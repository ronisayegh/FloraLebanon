import { Directory, File as ExpoFile, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import shortHash from 'shorthash2';
import { API_BASE_URL } from '../Config';
import { GetRemoteFileMetadata, GetUrlExt, MimeToExt, RemoteFileMetadata } from '../Helper/File/FileUtils';
import Logging from '../Logging';
import { isNumber, isNumeric, isStringNotEmpty } from '../Static';
import { ValidateUri } from '../Validation';

const CacheDir = new Directory(Paths.document, 'cachedFiles');
const fix: { regex: RegExp; ext: string }[] = [];
const activeRefreshes = new Map<string, Promise<CacheRefreshResult>>();
const cacheListeners = new Map<string, Set<(uri: string) => void>>();

type CacheRequestOptions = {
  headers?: Record<string, string>;
};

type CacheMetadata = {
  url: string;
  localPath: string;
  fileExtension?: string | null;
  etag?: string | null;
  lastModified?: string | null;
  contentLength?: number | null;
  contentType?: string | null;
  lastValidatedAt: number;
  lastDownloadedAt: number;
};

type CacheRefreshResult = {
  metadata: CacheMetadata;
  changed: boolean;
};

const normalizeRemoteUrl = (url: string) => url.replace('http://work/DoubleOutSource/LNA/website/wordpress', API_BASE_URL);
const cacheKeyFor = (url: string) => shortHash(normalizeRemoteUrl(url));
const metadataFileFor = (url: string) => new ExpoFile(CacheDir, `${cacheKeyFor(url)}.meta.json`);

const sanitizeRevisionToken = (value?: string | null) =>
  (value ? shortHash(value) : `${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12) || `${Date.now()}`;

const toPath = (url: string, revision: string, ext?: string | null) => {
  const cleanExt = ext?.replace(/^\./, '');
  return new ExpoFile(CacheDir, `${cacheKeyFor(url)}.${revision}${cleanExt ? `.${cleanExt}` : ''}`).uri;
};

const notifyCacheListeners = (url: string, uri: string) => {
  const listeners = cacheListeners.get(url);
  if (!listeners?.size) return;
  for (const listener of listeners) {
    try {
      listener(uri);
    } catch (error) {
      Logging.Logger.warn('SimpleCache listener error:', error);
    }
  }
};

const deleteFileIfExists = (filePath?: string | null) => {
  if (!filePath) return;
  try {
    const file = new ExpoFile(filePath);
    if (file.exists) file.delete();
  } catch (error) {
    Logging.Logger.warn('Failed to delete cached file:', error);
  }
};

const writeMetadata = async (url: string, metadata: CacheMetadata) => {
  const file = metadataFileFor(url);
  if (!file.exists) file.create({ intermediates: true, overwrite: true });
  file.write(JSON.stringify(metadata));
};

const readMetadata = async (url: string): Promise<CacheMetadata | null> => {
  const file = metadataFileFor(url);
  if (!file.exists) return null;
  try {
    const parsed = JSON.parse(await file.text()) as CacheMetadata;
    if (!parsed?.localPath || !new ExpoFile(parsed.localPath).exists) {
      deleteFileIfExists(parsed?.localPath);
      file.delete();
      return null;
    }
    return parsed;
  } catch (error) {
    Logging.Logger.warn('Failed to read cached metadata:', error);
    try {
      file.delete();
    } catch (_error) {}
    return null;
  }
};

const resolveKnownExtension = async (url: string, remoteMetadata?: RemoteFileMetadata | null, existingMetadata?: CacheMetadata | null) => {
  if (existingMetadata?.fileExtension) return existingMetadata.fileExtension;
  for (const item of fix) if (item.regex.test(url)) return item.ext;
  const fromContentType = MimeToExt(remoteMetadata?.contentType ?? undefined);
  if (fromContentType) return fromContentType;
  return await GetUrlExt(url);
};

const isMeaningfulMetadata = (metadata?: RemoteFileMetadata | null) =>
  Boolean(metadata?.etag || metadata?.lastModified || metadata?.contentLength || metadata?.contentType);

const isRemoteVersionSame = (local: CacheMetadata, remote?: RemoteFileMetadata | null) => {
  if (!remote || !isMeaningfulMetadata(remote)) return null;
  if (local.etag && remote.etag) return local.etag === remote.etag;
  if (local.lastModified && remote.lastModified) return local.lastModified === remote.lastModified;
  if (isNumber(local.contentLength) && isNumber(remote.contentLength) && local.contentLength !== remote.contentLength) return false;
  if (local.contentLength && remote.contentLength && local.contentType && remote.contentType) {
    return local.contentLength === remote.contentLength && local.contentType === remote.contentType;
  }
  return null;
};

const downloadWithTimeout = (url: string, path: string, timeout?: number, headers?: Record<string, string>) => {
  const downloadTask = ExpoFile.downloadFileAsync(url, new ExpoFile(path), { headers, idempotent: true });
  if (!isNumeric(timeout) || timeout <= 0) return downloadTask;
  return new Promise<ExpoFile>((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error('Download timed out'));
    }, timeout);
    downloadTask
      .then(file => {
        clearTimeout(id);
        resolve(file as ExpoFile);
      })
      .catch(error => {
        clearTimeout(id);
        reject(error);
      });
  });
};

const downloadAndPersist = async (
  url: string,
  timeout?: number,
  remoteMetadata?: RemoteFileMetadata | null,
  existingMetadata?: CacheMetadata | null,
  options?: CacheRequestOptions,
) => {
  await CreateCacheFolder();
  const fileExtension = await resolveKnownExtension(url, remoteMetadata, existingMetadata);
  const revision = sanitizeRevisionToken(remoteMetadata?.etag || remoteMetadata?.lastModified || `${Date.now()}`);
  const localPath = toPath(url, revision, fileExtension);
  const downloadedFile = await downloadWithTimeout(normalizeRemoteUrl(url), localPath, timeout, options?.headers);
  const fileInfo = downloadedFile.info();
  const metadata: CacheMetadata = {
    url,
    localPath: downloadedFile.uri,
    fileExtension,
    etag: remoteMetadata?.etag ?? existingMetadata?.etag ?? null,
    lastModified: remoteMetadata?.lastModified ?? existingMetadata?.lastModified ?? null,
    contentLength: remoteMetadata?.contentLength ?? fileInfo.size ?? downloadedFile.size ?? existingMetadata?.contentLength ?? null,
    contentType: remoteMetadata?.contentType ?? existingMetadata?.contentType ?? null,
    lastValidatedAt: Date.now(),
    lastDownloadedAt: Date.now(),
  };
  await writeMetadata(url, metadata);
  if (existingMetadata?.localPath && existingMetadata.localPath !== metadata.localPath) deleteFileIfExists(existingMetadata.localPath);
  return metadata;
};

const refreshCachedFile = async (url: string, timeout?: number, forceDownload = false, options?: CacheRequestOptions): Promise<CacheRefreshResult> => {
  const currentMetadata = forceDownload ? null : await readMetadata(url);
  if (!currentMetadata) {
    const remoteMetadata = await GetRemoteFileMetadata(normalizeRemoteUrl(url), timeout, options?.headers);
    const metadata = await downloadAndPersist(url, timeout, remoteMetadata, null, options);
    return { metadata, changed: true };
  }

  const remoteMetadata = await GetRemoteFileMetadata(normalizeRemoteUrl(url), timeout, options?.headers);
  const sameVersion = forceDownload ? false : isRemoteVersionSame(currentMetadata, remoteMetadata);

  if (sameVersion === true) {
    const metadata: CacheMetadata = {
      ...currentMetadata,
      etag: remoteMetadata?.etag ?? currentMetadata.etag ?? null,
      lastModified: remoteMetadata?.lastModified ?? currentMetadata.lastModified ?? null,
      contentLength: remoteMetadata?.contentLength ?? currentMetadata.contentLength ?? null,
      contentType: remoteMetadata?.contentType ?? currentMetadata.contentType ?? null,
      lastValidatedAt: Date.now(),
    };
    await writeMetadata(url, metadata);
    return { metadata, changed: false };
  }

  const metadata = await downloadAndPersist(url, timeout, remoteMetadata, currentMetadata, options);
  return { metadata, changed: metadata.localPath !== currentMetadata.localPath || sameVersion === false };
};

const getRefreshKey = (url: string, options?: CacheRequestOptions) => `${url}:${options?.headers ? shortHash(JSON.stringify(options.headers)) : 'public'}`;

const queueRefresh = (url: string, timeout?: number, forceDownload = false, options?: CacheRequestOptions) => {
  const refreshKey = getRefreshKey(url, options);
  const existingRefresh = activeRefreshes.get(refreshKey);
  if (existingRefresh && !forceDownload) return existingRefresh;
  const refreshTask = refreshCachedFile(url, timeout, forceDownload, options)
    .then(result => {
      if (result.changed) notifyCacheListeners(url, result.metadata.localPath);
      return result;
    })
    .finally(() => {
      activeRefreshes.delete(refreshKey);
    });
  activeRefreshes.set(refreshKey, refreshTask);
  return refreshTask;
};

export const subscribeToCacheUpdates = (url: string, listener: (uri: string) => void) => {
  const listeners = cacheListeners.get(url) ?? new Set<(uri: string) => void>();
  listeners.add(listener);
  cacheListeners.set(url, listeners);
  return () => {
    const currentListeners = cacheListeners.get(url);
    if (!currentListeners) return;
    currentListeners.delete(listener);
    if (!currentListeners.size) cacheListeners.delete(url);
  };
};

export const CreateCacheFolder = async () => {
  if (!CacheDir.exists) CacheDir.create({ idempotent: true, intermediates: true });
};

export const ClearCache = async (daysOld?: number) => {
  try {
    await CreateCacheFolder();
    if (!isNumber(daysOld)) {
      for (const entry of CacheDir.list()) entry.delete();
      return;
    }
    const currentTime = Date.now();
    for (const entry of CacheDir.list()) {
      if (!(entry instanceof ExpoFile)) continue;
      const info = entry.info();
      const modifiedAt = info.modificationTime ?? 0;
      if (!modifiedAt) continue;
      const diffDays = (currentTime - modifiedAt) / (1000 * 3600 * 24);
      if (diffDays > daysOld) entry.delete();
    }
  } catch (ex) {
    Logging.Logger.error('Failed to clear cache:', ex);
  }
};

export const ClearMonthOld = async () => await ClearCache(30);

export const GetCachedURI = async (url?: string, forceDownload?: boolean, timeout?: number, options?: CacheRequestOptions) => {
  if (!isStringNotEmpty(url)) return Promise.reject('Invalid or empty URL provided for GetLocalFileURI: ' + url);
  if (url.startsWith('file://')) return url;
  if (!ValidateUri(url)) return Promise.reject('Invalid or empty URL provided for GetLocalFileURI: ' + url);
  try {
    const cachedMetadata = forceDownload ? null : await readMetadata(url);
    if (cachedMetadata?.localPath && new ExpoFile(cachedMetadata.localPath).exists) {
      queueRefresh(url, timeout, false, options).catch(error => Logging.Logger.warn('Background cache refresh failed:', error));
      return cachedMetadata.localPath;
    }
    return (await queueRefresh(url, timeout, Boolean(forceDownload), options)).metadata.localPath;
  } catch (ex) {
    return Promise.reject(`Failed to download file for ${url}:\n${ex}`);
  }
};

export const SaveURIToLibrary = async (uri: string, options?: CacheRequestOptions) => {
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) return false;
  const localUri = uri.startsWith('file://') ? uri : await GetCachedURI(uri, false, undefined, options);
  await MediaLibrary.saveToLibraryAsync(localUri);
  return true;
};

export const ShareURL = async (url: string) => {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) return Logging.Logger.error("Sharing isn't available on this device.");
  const uri = await GetCachedURI(url);
  if (!uri) return Logging.Logger.error('Failed to download file for sharing');
  await Sharing.shareAsync(uri);
};

export const ShareDownloadedURI = async (localUri: string) => {
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) await Sharing.shareAsync(localUri);
  else Logging.Logger.error("Sharing isn't available on this device.");
};
