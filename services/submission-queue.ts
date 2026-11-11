import type { ApiFailure, AuthSession, MissionCode, Submission, SubmissionPhotoStepInput } from '@/@Types';
import { PrepareSubmissionImage, type FileType } from '@/constants/Helper';
import Logging from '@/constants/Logging';
import { SecureStoreManager, StoreManager, SubmissionQueueKey } from '@/constants/Stores';
import NetInfo from '@react-native-community/netinfo';
import { Directory, File, Paths } from 'expo-file-system';
import { CreateSubmission, apiBaseUrl, getStoredSessionSnapshot } from './index';

const QUEUE_HEALTH_TIMEOUT_MS = 4000;
const RETRY_BACKOFF_MS = [30_000, 2 * 60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000];
const QueueDir = new Directory(Paths.document, 'queuedSubmissions');

export type QueueReasonCode = 'NO_NETWORK' | 'NO_USER' | 'SERVER_UNAVAILABLE' | 'SERVER_ERROR' | 'VALIDATION_ERROR' | 'PHOTO_LOST' | 'UNKNOWN';

export type QueueReason = {
  code: QueueReasonCode;
  message: string;
  serverCode?: string;
  updatedAt: string;
};

export type QueuedSubmissionPayload = {
  latitude: number;
  longitude: number;
  note?: string;
  organizationId?: string;
  villageId?: string;
  plantId?: string;
  missionCode?: MissionCode;
  collectedAt?: string;
  photoSteps: SubmissionPhotoStepInput[];
  images: FileType[];
};

export type QueuedSubmission = {
  id: string;
  ownerKey?: string;
  payload: QueuedSubmissionPayload;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  reason: QueueReason;
  retryable: boolean;
  photosAvailable: boolean;
};

export type SubmissionAttemptResult =
  | { status: 'success'; response: Submission }
  | { status: 'queued'; item: QueuedSubmission }
  | { status: 'blocked'; reason: QueueReason };

export type QueueSyncSummary = {
  attempted: number;
  succeeded: number;
  queued: number;
};

const nowIso = () => new Date().toISOString();
const buildQueueId = () => `queued-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const isAuthenticatedSession = (session?: AuthSession | null) => session?.status === 'authenticated' && !!session.user;

const getQueueOwnerContext = async (session?: AuthSession | null) => {
  const activeSession = session ?? (await getStoredSessionSnapshot());
  const deviceId = await SecureStoreManager.getSessionUUID();
  const guestOwnerKey = `guest:${deviceId}`;
  const authenticatedOwnerKey = isAuthenticatedSession(activeSession) && activeSession?.user?.id ? `user:${activeSession.user.id}` : null;

  return {
    currentOwnerKey: authenticatedOwnerKey ?? guestOwnerKey,
    guestOwnerKey,
    authenticatedOwnerKey,
    isAuthenticated: Boolean(authenticatedOwnerKey),
  };
};

const getQueueOwnerKey = async (session?: AuthSession | null) => {
  const ownerContext = await getQueueOwnerContext(session);
  return ownerContext.currentOwnerKey;
};

type QueueOwnerContext = Awaited<ReturnType<typeof getQueueOwnerContext>>;

const isVisibleToQueueOwner = (item: QueuedSubmission, ownerContext: QueueOwnerContext) => {
  if (!item.ownerKey) return true;
  if (item.ownerKey === ownerContext.currentOwnerKey) return true;
  return ownerContext.isAuthenticated && item.ownerKey === ownerContext.guestOwnerKey && item.reason.code === 'NO_USER';
};

const isRetryableReason = (reason: QueueReason) => {
  return reason.code === 'NO_USER' || reason.code === 'NO_NETWORK' || reason.code === 'SERVER_UNAVAILABLE' || reason.code === 'UNKNOWN';
};

const getNextAttemptAt = (reason: QueueReason, attempts: number) => {
  if (!isRetryableReason(reason)) return null;
  if (reason.code === 'NO_USER') {
    // Freshly queued items (no attempts yet) may submit immediately after login.
    // Repeated NO_USER results (e.g. revoked/expired token during an authenticated
    // session) must back off so the queue cannot hammer the server with 401s.
    if (attempts <= 0) return nowIso();
    const delay = RETRY_BACKOFF_MS[Math.min(attempts - 1, RETRY_BACKOFF_MS.length - 1)]!;
    return new Date(Date.now() + delay).toISOString();
  }

  const delay = attempts <= 0 ? 0 : RETRY_BACKOFF_MS[Math.min(attempts - 1, RETRY_BACKOFF_MS.length - 1)]!;
  return new Date(Date.now() + delay).toISOString();
};

const isQueuedSubmissionDue = (item: QueuedSubmission) => {
  if (!item.retryable || !item.photosAvailable) return false;
  if (!item.nextAttemptAt) return true;
  return new Date(item.nextAttemptAt).getTime() <= Date.now();
};

export const getQueueReasonMessage = (reason: QueueReason) => reason.message;

export const buildQueueReason = (code: QueueReasonCode, message: string, serverCode?: string): QueueReason => ({
  code,
  message,
  serverCode,
  updatedAt: nowIso(),
});

const isApiFailure = (value: unknown): value is ApiFailure => {
  return Boolean(value && typeof value === 'object' && 'success' in value && (value as ApiFailure).success === false);
};

const loadSubmissionQueue = async (): Promise<QueuedSubmission[]> => {
  const stored = await StoreManager.getJson(SubmissionQueueKey);
  if (!Array.isArray(stored)) return [];
  return stored
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const queuedItem = item as QueuedSubmission;
      const retryable = typeof queuedItem.retryable === 'boolean' ? queuedItem.retryable : isRetryableReason(queuedItem.reason);
      return {
        ...queuedItem,
        attempts: queuedItem.attempts ?? 0,
        lastAttemptAt: queuedItem.lastAttemptAt ?? null,
        nextAttemptAt: queuedItem.nextAttemptAt ?? (retryable ? nowIso() : null),
        photosAvailable: queuedItem.photosAvailable ?? true,
        retryable,
      };
    });
};

const getVisibleQueueForCurrentOwner = async (): Promise<QueuedSubmission[]> => {
  const queue = await loadSubmissionQueue();
  const ownerContext = await getQueueOwnerContext();
  return queue.filter(item => isVisibleToQueueOwner(item, ownerContext));
};

const ensureQueueFolder = async () => {
  if (!QueueDir.exists) QueueDir.create({ intermediates: true, idempotent: true });
};

const buildQueuedImagePath = (queueId: string, index: number, image: FileType) => {
  const extensionFromType = image.type?.split('/')[1]?.replace(/[^a-zA-Z0-9]/g, '');
  const extensionFromUri = image.uri.split('.').pop()?.split('?')[0];
  const extension = extensionFromType || extensionFromUri || 'jpg';
  return new File(QueueDir, `${queueId}-${index}.${extension}`).uri;
};

const saveImageIntoQueue = async (sourceUri: string, destination: string) => {
  const sourceFile = new File(sourceUri);
  const destinationFile = new File(destination);
  if (destinationFile.exists) destinationFile.delete();
  sourceFile.copy(destinationFile);
  if (!destinationFile.exists) throw new Error(`Copied image missing at destination: ${destination}`);
};

const normalizeImageIntoQueue = async (image: FileType, destination: string, index: number) => {
  const normalized = await PrepareSubmissionImage(image, index);
  const normalizedFile = new File(normalized.uri);
  const destinationFile = new File(destination);
  if (destinationFile.exists) destinationFile.delete();
  normalizedFile.copy(destinationFile);
  if (!destinationFile.exists) throw new Error(`Normalized image missing at destination: ${destination}`);
};

const persistPayloadImages = async (queueId: string, payload: QueuedSubmissionPayload) => {
  await ensureQueueFolder();
  const persistedImages: FileType[] = [];
  let photosAvailable = true;

  for (let index = 0; index < payload.images.length; index += 1) {
    const image = payload.images[index]!;
    const destination = buildQueuedImagePath(queueId, index, image);

    try {
      await saveImageIntoQueue(image.uri, destination);
      persistedImages.push({ ...image, uri: destination });
    } catch (error) {
      try {
        await normalizeImageIntoQueue(image, destination, index);
        persistedImages.push({ ...image, uri: destination, type: 'image/jpeg' });
      } catch (fallbackError) {
        photosAvailable = false;
        Logging.Logger.warn(`Failed to persist queued submission photo from ${image.uri} to ${destination}:`, error);
        Logging.Logger.warn(`Failed to normalize queued submission photo from ${image.uri} to ${destination}:`, fallbackError);
        persistedImages.push({ ...image, uri: destination });
      }
    }
  }

  return { persistedImages, photosAvailable };
};

const cleanupQueuedImages = async (item: QueuedSubmission) => {
  await Promise.all(
    item.payload.images.map(async image => {
      try {
        const file = new File(image.uri);
        if (file.exists) file.delete();
      } catch (_error) {}
    }),
  );
};

const hasAllQueuedImages = async (item: QueuedSubmission) => {
  return item.payload.images.every(image => {
    try {
      return new File(image.uri).exists;
    } catch (_error) {
      return false;
    }
  });
};

const saveSubmissionQueue = async (items: QueuedSubmission[]) => {
  await StoreManager.setJson(SubmissionQueueKey, items);
  return items;
};

export const getQueuedSubmissions = async () => getVisibleQueueForCurrentOwner();

export const getQueuedSubmissionById = async (queueId: string) => {
  const queue = await getVisibleQueueForCurrentOwner();
  return queue.find(item => item.id === queueId) ?? null;
};

export const removeQueuedSubmission = async (queueId: string) => {
  const queue = await loadSubmissionQueue();
  const ownerContext = await getQueueOwnerContext();
  const removedItem = queue.find(item => item.id === queueId && isVisibleToQueueOwner(item, ownerContext));
  if (!removedItem) return getVisibleQueueForCurrentOwner();

  const nextQueue = queue.filter(item => item.id !== queueId);
  await cleanupQueuedImages(removedItem);
  await saveSubmissionQueue(nextQueue);
  return getVisibleQueueForCurrentOwner();
};

const upsertQueuedSubmission = async (item: QueuedSubmission) => {
  const queue = await loadSubmissionQueue();
  const existingIndex = queue.findIndex(entry => entry.id === item.id);
  const nextQueue = [...queue];
  if (existingIndex >= 0) nextQueue[existingIndex] = item;
  else nextQueue.unshift(item);
  await saveSubmissionQueue(nextQueue);
  return item;
};

export const enqueueSubmission = async (payload: QueuedSubmissionPayload, reason: QueueReason, ownerKey?: string) => {
  const id = buildQueueId();
  const { persistedImages, photosAvailable } = await persistPayloadImages(id, payload);
  const item: QueuedSubmission = {
    id,
    ownerKey: ownerKey ?? (await getQueueOwnerKey(null)),
    payload: { ...payload, images: persistedImages },
    createdAt: nowIso(),
    updatedAt: nowIso(),
    attempts: 0,
    lastAttemptAt: null,
    reason: photosAvailable ? reason : buildQueueReason('PHOTO_LOST', 'Queued submission photos are missing, so this observation can no longer be submitted.'),
    photosAvailable,
    retryable: photosAvailable ? isRetryableReason(reason) : false,
    nextAttemptAt: photosAvailable ? getNextAttemptAt(reason, 0) : null,
  };
  await upsertQueuedSubmission(item);
  return item;
};

const updateQueuedSubmissionState = async (item: QueuedSubmission, reason: QueueReason) => {
  const photosAvailable = await hasAllQueuedImages(item);
  const nextAttempts = item.attempts + 1;
  const nextReason = photosAvailable ? reason : buildQueueReason('PHOTO_LOST', 'Queued submission photos are missing, so this observation can no longer be submitted.');
  const retryable = photosAvailable ? isRetryableReason(nextReason) : false;
  const nextItem: QueuedSubmission = {
    ...item,
    updatedAt: nowIso(),
    attempts: nextAttempts,
    lastAttemptAt: nowIso(),
    reason: nextReason,
    photosAvailable,
    retryable,
    nextAttemptAt: retryable ? getNextAttemptAt(nextReason, nextAttempts) : null,
  };
  await upsertQueuedSubmission(nextItem);
  return nextItem;
};

const classifyFailureReason = (failure: ApiFailure): QueueReason => {
  const message = failure.error.message || 'Unable to submit this observation right now.';
  const serverCode = failure.error.code;

  if (serverCode?.startsWith('AUTH_') || serverCode === 'AUTH_REQUIRED' || failure.status === 401) {
    return buildQueueReason('NO_USER', 'You need to login first before submitting this observation.', serverCode);
  }

  if (!failure.status || /network|internet|offline|timeout|fetch|connection/i.test(message)) {
    return buildQueueReason('NO_NETWORK', 'No internet connection. This observation is waiting for network access.', serverCode);
  }

  if (failure.status >= 500 || failure.status === 408 || failure.status === 429) {
    return buildQueueReason('SERVER_UNAVAILABLE', 'The server is unavailable right now. We will try again later.', serverCode);
  }

  return buildQueueReason('VALIDATION_ERROR', message, serverCode);
};

export const canAttemptQueuedSubmission = async () => {
  const session = await getStoredSessionSnapshot();
  if (!isAuthenticatedSession(session)) {
    return buildQueueReason('NO_USER', 'You need to login first before submitting this observation.');
  }

  const networkState = await NetInfo.fetch();
  if (!networkState.isConnected || networkState.isInternetReachable === false) {
    return buildQueueReason('NO_NETWORK', 'No internet connection. This observation is waiting for network access.');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), QUEUE_HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBaseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      return buildQueueReason('SERVER_UNAVAILABLE', 'The server is unavailable right now. We will try again later.');
    }
    return null;
  } catch (_error) {
    return buildQueueReason('SERVER_UNAVAILABLE', 'We had a problem connecting to the server. We will try again later.');
  } finally {
    clearTimeout(timeoutId);
  }
};

const classifyUnknownError = async (error: unknown) => {
  if (isApiFailure(error)) return classifyFailureReason(error);

  const precheck = await canAttemptQueuedSubmission();
  if (precheck) return precheck;

  if (error instanceof Error) return buildQueueReason('UNKNOWN', error.message || 'Unable to submit this observation right now.');
  return buildQueueReason('UNKNOWN', 'Unable to submit this observation right now.');
};

export const submitSubmissionWithQueue = async (payload: QueuedSubmissionPayload, session?: AuthSession | null): Promise<SubmissionAttemptResult> => {
  const activeSession = session ?? (await getStoredSessionSnapshot());
  if (!isAuthenticatedSession(activeSession)) {
    const item = await enqueueSubmission(payload, buildQueueReason('NO_USER', 'You need to login before it can be submitted.'));
    return { status: 'queued', item };
  }

  const precheck = await canAttemptQueuedSubmission();
  if (precheck) {
    const item = await enqueueSubmission(payload, precheck);
    return { status: 'queued', item };
  }

  try {
    const response = await CreateSubmission(payload);
    if (response.success) {
      return { status: 'success', response: response.data };
    }

    const reason = classifyFailureReason(response);
    if (!isRetryableReason(reason)) return { status: 'blocked', reason };
    const item = await enqueueSubmission(payload, reason);
    return { status: 'queued', item };
  } catch (error) {
    const reason = await classifyUnknownError(error);
    if (!isRetryableReason(reason)) return { status: 'blocked', reason };
    const item = await enqueueSubmission(payload, reason);
    return { status: 'queued', item };
  }
};

export const retryQueuedSubmission = async (queueId: string, session?: AuthSession | null): Promise<SubmissionAttemptResult | null> => {
  const queue = await loadSubmissionQueue();
  let item = queue.find(entry => entry.id === queueId);
  if (!item) return null;
  const ownerContext = await getQueueOwnerContext(session);
  if (!isVisibleToQueueOwner(item, ownerContext)) return null;

  if (!(await hasAllQueuedImages(item))) {
    return {
      status: 'queued',
      item: await updateQueuedSubmissionState(
        item,
        buildQueueReason('PHOTO_LOST', 'Queued submission photos are missing, so this observation can no longer be submitted.'),
      ),
    };
  }

  const activeSession = session ?? (await getStoredSessionSnapshot());
  if (!isAuthenticatedSession(activeSession)) {
    return {
      status: 'queued',
      item: await updateQueuedSubmissionState(item, buildQueueReason('NO_USER', 'You need to login first before submitting this observation.')),
    };
  }

  if (item.ownerKey === ownerContext.guestOwnerKey && item.reason.code === 'NO_USER' && ownerContext.authenticatedOwnerKey) {
    item = await upsertQueuedSubmission({ ...item, ownerKey: ownerContext.authenticatedOwnerKey, updatedAt: nowIso() });
  }

  const precheck = await canAttemptQueuedSubmission();
  if (precheck) {
    return {
      status: 'queued',
      item: await updateQueuedSubmissionState(item, precheck),
    };
  }

  try {
    const response = await CreateSubmission(item.payload);
    if (response.success) {
      await removeQueuedSubmission(queueId);
      return { status: 'success', response: response.data };
    }

    return {
      status: 'queued',
      item: await updateQueuedSubmissionState(item, classifyFailureReason(response)),
    };
  } catch (error) {
    const reason = await classifyUnknownError(error);
    return {
      status: 'queued',
      item: await updateQueuedSubmissionState(item, reason),
    };
  }
};

export const retryAllQueuedSubmissions = async (session?: AuthSession | null, options?: { onlyDue?: boolean }): Promise<QueueSyncSummary> => {
  const queue = await loadSubmissionQueue();
  if (queue.length === 0) return { attempted: 0, succeeded: 0, queued: 0 };

  const ownerContext = await getQueueOwnerContext(session);
  const ownQueue = queue.filter(item => isVisibleToQueueOwner(item, ownerContext));

  if (ownQueue.length === 0) return { attempted: 0, succeeded: 0, queued: queue.length };
  const retryQueue = options?.onlyDue ? ownQueue.filter(isQueuedSubmissionDue) : ownQueue;
  if (retryQueue.length === 0) return { attempted: 0, succeeded: 0, queued: queue.length };

  let succeeded = 0;
  let queued = 0;

  for (const item of retryQueue) {
    try {
      const result = await retryQueuedSubmission(item.id, session);
      if (!result) continue;
      if (result.status === 'success') succeeded += 1;
      else queued += 1;
    } catch (error) {
      Logging.Logger.warn('Failed to retry queued submission:', error);
      queued += 1;
    }
  }

  return {
    attempted: retryQueue.length,
    succeeded,
    queued: queue.length - retryQueue.length + queued,
  };
};
