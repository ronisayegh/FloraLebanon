import {
  ApiFailure,
  ApiResponse,
  AuthPayload,
  AuthSession,
  AuthUser,
  FloweringPlantItem,
  FloweringPlantsResponse,
  GuestAuthPayload,
  HomeSummary,
  MissingPlantPhotosMissionDetail,
  MissingPlantPhotosMissionList,
  MissionCode,
  OrganizationCreationRequest,
  OrganizationDetail,
  OrganizationMemberSummary,
  ProfileSummary,
  ResolvedVillage,
  Submission,
  SubmissionPhotoStepInput,
  UploadedAsset,
  VillageFewSubmissionsItem,
} from '@/@Types';
import { API_BASE_URL } from '@/constants/Config';
import { PrepareSubmissionImages, type FileType } from '@/constants/Helper';
import Logging from '@/constants/Logging';
import { AuthSessionKey, SecureStoreManager, StoreManager } from '@/constants/Stores';
import axios, { AxiosError, AxiosRequestConfig, RawAxiosRequestHeaders } from 'axios';
import { Platform } from 'react-native';

const API_PREFIX = '/v1';
const REQUEST_TIMEOUT = 10000;
const nowIso = () => new Date().toISOString();

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
type ContentType = 'json' | 'form';
type FetchOptions = {
  requiresAuth?: boolean;
};

const normalizeBaseUrl = (baseUrl: string) => (baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl);
const assetBaseUrl = normalizeBaseUrl(API_BASE_URL);
const normalizeAssetUrl = (url: string | null) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${assetBaseUrl}${url}`;
  return `${assetBaseUrl}/${url}`;
};
const normalizeAuthUser = (user: AuthUser): AuthUser => ({ ...user, profilePhotoUrl: normalizeAssetUrl(user.profilePhotoUrl) });
const normalizeUploadedAsset = <T extends UploadedAsset>(asset: T): T => ({
  ...asset,
  url: normalizeAssetUrl(asset.url) || asset.url,
  browserUrl: normalizeAssetUrl(asset.browserUrl) || asset.browserUrl,
});
const normalizeSubmissionPhoto = <T extends Submission['photos'][number]>(photo: T): T => ({
  ...photo,
  url: normalizeAssetUrl(photo.url) || photo.url,
  browserUrl: normalizeAssetUrl(photo.browserUrl) || photo.browserUrl,
});
const normalizeSubmission = <T extends Submission>(submission: T): T => ({
  ...submission,
  photos: submission.photos.map(normalizeSubmissionPhoto),
});
const normalizeSubmissionListResponse = (response: ApiResponse<Submission[]>): ApiResponse<Submission[]> =>
  response.success ? { ...response, data: response.data.map(normalizeSubmission) } : response;
const normalizeSubmissionDetailResponse = (response: ApiResponse<Submission>): ApiResponse<Submission> =>
  response.success ? { ...response, data: normalizeSubmission(response.data) } : response;
const normalizeAuthPayloadResponse = <T extends AuthPayload | GuestAuthPayload>(response: ApiResponse<T>): ApiResponse<T> =>
  response.success ? { ...response, data: { ...response.data, user: normalizeAuthUser(response.data.user) } } : response;
const normalizeGetMeResponse = (response: ApiResponse<{ user: AuthUser }>): ApiResponse<{ user: AuthUser }> =>
  response.success ? { ...response, data: { ...response.data, user: normalizeAuthUser(response.data.user) } } : response;
const normalizeMissionListResponse = (response: ApiResponse<MissingPlantPhotosMissionList>): ApiResponse<MissingPlantPhotosMissionList> =>
  response.success
    ? {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(item => ({
            ...item,
            coverImage: item.coverImage ? normalizeUploadedAsset(item.coverImage) : null,
          })),
        },
      }
    : response;
const normalizeMissionDetailResponse = (response: ApiResponse<MissingPlantPhotosMissionDetail>): ApiResponse<MissingPlantPhotosMissionDetail> =>
  response.success
    ? {
        ...response,
        data: {
          ...response.data,
          gallery: response.data.gallery.map(normalizeUploadedAsset),
          stepCoverage: {
            ...response.data.stepCoverage,
            coveredSteps: response.data.stepCoverage.coveredSteps.map(normalizeUploadedAsset),
          },
        },
      }
    : response;
const normalizeFloweringPlantsResponse = (response: ApiResponse<FloweringPlantsResponse>): ApiResponse<FloweringPlantsResponse> =>
  response.success
    ? {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map((item: FloweringPlantItem) => ({
            ...item,
            plant: {
              ...item.plant,
              image: item.plant.image
                ? {
                    ...item.plant.image,
                    url: normalizeAssetUrl(item.plant.image.url) || item.plant.image.url,
                  }
                : null,
            },
          })),
        },
      }
    : response;

// In the web dev preview, route API calls through the dev server's /api-proxy
// (see metro.config.js) because the API blocks cross-origin browser requests.
const USE_WEB_DEV_PROXY = Platform.OS === 'web' && __DEV__;
export const apiBaseUrl = USE_WEB_DEV_PROXY ? `/api-proxy${API_PREFIX}` : `${normalizeBaseUrl(API_BASE_URL)}${API_PREFIX}`;
export const getSessionStatusFromUser = (user: AuthUser): AuthSession['status'] => (user.role === 'GUEST' ? 'guest' : 'authenticated');
export const createLocalGuestSession = (): AuthSession => ({ status: 'local_guest', user: null, lastSyncedAt: null });
export const createSessionSnapshot = (user: AuthUser): AuthSession => {
  const normalizedUser = normalizeAuthUser(user);
  return { status: getSessionStatusFromUser(normalizedUser), user: normalizedUser, lastSyncedAt: nowIso() };
};
export const persistSessionSnapshot = async (session: AuthSession) => {
  await StoreManager.setJson(AuthSessionKey, session);
  return session;
};
export const getStoredSessionSnapshot = async (): Promise<AuthSession | null> => {
  const session = await StoreManager.getJson(AuthSessionKey);
  if (!session || typeof session !== 'object') return null;
  return session as AuthSession;
};
export const clearStoredSessionSnapshot = async () => {
  await StoreManager.deleteItem(AuthSessionKey);
};

const missingAuthFailure = (): ApiFailure => ({
  success: false,
  status: 401,
  error: {
    message: 'Authentication token is missing.',
    code: 'AUTH_REQUIRED',
  },
});

const buildHeaders = async (contentType: ContentType): Promise<RawAxiosRequestHeaders> => {
  const token = await SecureStoreManager.getToken();
  const headers: RawAxiosRequestHeaders = {};

  if (token) headers.Authorization = `Bearer ${token}`;

  if (contentType === 'json') headers['content-type'] = 'application/json';
  else headers['content-type'] = 'multipart/form-data';

  return headers;
};

const normalizeApiError = (error: unknown): ApiFailure => {
  const axiosError = error as AxiosError<ApiFailure | { error?: { message: string; code?: string }; message?: string }>;
  const responseData = axiosError.response?.data;
  const message =
    (responseData && 'error' in responseData && responseData.error?.message) ||
    (responseData && 'message' in responseData && responseData.message) ||
    axiosError.message ||
    'Request failed.';
  const code = responseData && 'error' in responseData ? responseData.error?.code : undefined;
  const requestId = responseData && 'requestId' in responseData ? responseData.requestId : undefined;
  return { success: false, error: { message, code }, requestId, status: axiosError.response?.status };
};

const clearAuthOnUnauthorized = async (error: AxiosError) => {
  if (error.response?.status === 401) {
    await SecureStoreManager.clearToken();
    await clearStoredSessionSnapshot();
  }
};

const fetchURL: <T>(
  path: string,
  data?: object | FormData,
  contentType?: ContentType,
  method?: HttpMethod,
  config?: AxiosRequestConfig,
  options?: FetchOptions,
) => Promise<ApiResponse<T>> = async (path, data, contentType = 'json', method = 'post', config, options?: FetchOptions) => {
  if (options?.requiresAuth) {
    const token = await SecureStoreManager.getToken();
    if (!token) {
      return Promise.reject(missingAuthFailure());
    }
  }

  const headers = await buildHeaders(contentType);
  return axios({
    method,
    url: `${apiBaseUrl}${path}`,
    headers,
    data,
    timeout: REQUEST_TIMEOUT,
    ...config,
  })
    .then(response => response.data)
    .catch(async (error: AxiosError) => {
      await clearAuthOnUnauthorized(error);
      printError(error);
      return Promise.reject(normalizeApiError(error));
    });
};

export const postURL: <T>(path: string, data: object) => Promise<ApiResponse<T>> = (path, data) => fetchURL(path, data, 'json', 'post');
export const postProtectedURL: <T>(path: string, data: object) => Promise<ApiResponse<T>> = (path, data) =>
  fetchURL(path, data, 'json', 'post', undefined, { requiresAuth: true });

export const getURL: <T>(path: string) => Promise<ApiResponse<T>> = path => fetchURL(path, undefined, 'json', 'get');
export const getProtectedURL: <T>(path: string) => Promise<ApiResponse<T>> = path =>
  fetchURL(path, undefined, 'json', 'get', undefined, { requiresAuth: true });

export const putURL: <T>(path: string, data: object) => Promise<ApiResponse<T>> = (path, data) => fetchURL(path, data, 'json', 'put');
export const putProtectedURL: <T>(path: string, data: object) => Promise<ApiResponse<T>> = (path, data) =>
  fetchURL(path, data, 'json', 'put', undefined, { requiresAuth: true });

export const patchURL: <T>(path: string, data: object) => Promise<ApiResponse<T>> = (path, data) => fetchURL(path, data, 'json', 'patch');
export const patchProtectedURL: <T>(path: string, data: object) => Promise<ApiResponse<T>> = (path, data) =>
  fetchURL(path, data, 'json', 'patch', undefined, { requiresAuth: true });

export const deleteURL: <T>(path: string) => Promise<ApiResponse<T>> = path => fetchURL(path, undefined, 'json', 'delete');
export const deleteProtectedURL: <T>(path: string) => Promise<ApiResponse<T>> = path =>
  fetchURL(path, undefined, 'json', 'delete', undefined, { requiresAuth: true });

export const fetchFormURL: <T>(path: string, formData: FormData, method?: Exclude<HttpMethod, 'get'>) => Promise<ApiResponse<T>> = (
  path,
  formData,
  method = 'post',
) => fetchURL(path, formData, 'form', method);

export const fetchProtectedFormURL: <T>(path: string, formData: FormData, method?: Exclude<HttpMethod, 'get'>) => Promise<ApiResponse<T>> = (
  path,
  formData,
  method = 'post',
) => fetchURL(path, formData, 'form', method, undefined, { requiresAuth: true });

export const downloadFileAndGetContentType = async (uri: string) => {
  try {
    const response = await fetch(uri);
    if (!response.ok) return null;
    const contentType = response.headers.get('Content-Type');
    const data = await response.blob();
    return { contentType, data };
  } catch (error) {
    Logging.Logger.error(error);
    return null;
  }
};

export const printError = (error: unknown) => {
  const axiosError = error as AxiosError;

  if (axiosError.response) {
    Logging.Logger.warn('Error Status', axiosError.response.status);
    Logging.Logger.warn('Error Data', axiosError.response.data);
    return;
  }
  if (axiosError.request) return Logging.Logger.warn('Error Request', axiosError.request);
  if (axiosError.message) return Logging.Logger.warn('Error Message', axiosError.message);

  Logging.Logger.error('Error', error);
};

export const toQueryStr = (args: { [key: string]: unknown }) => {
  const queryParts: string[] = [];
  Object.keys(args).forEach(key => {
    const value = args[key];
    if (value !== undefined && value !== null) queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  });
  return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
};

export const EncodeURIPath = (path: string) => {
  try {
    return path
      .split('/')
      .map(item => encodeURIComponent(item))
      .join('/');
  } catch (_error) {
    return path;
  }
};

const persistAuthToken = async (response: ApiResponse<AuthPayload | GuestAuthPayload>) => {
  const normalizedResponse = normalizeAuthPayloadResponse(response);
  if (normalizedResponse.success) {
    await SecureStoreManager.setToken(normalizedResponse.data.token);
    await persistSessionSnapshot(createSessionSnapshot(normalizedResponse.data.user));
  }
  return normalizedResponse;
};

export const Login = async (email: string, password: string) => persistAuthToken(await postURL<AuthPayload>('/auth/login', { email, password }));

export const Register = async (email: string, password: string, firstName?: string, lastName?: string) =>
  persistAuthToken(await postURL<AuthPayload>('/auth/register', { email, password, firstName, lastName }));

export const RequestPasswordReset = async (email: string) => postURL<{ sent: boolean; previewUrl: string | null }>('/auth/password-reset/request', { email });

export const GuestAccess = async (deviceId?: string) => persistAuthToken(await postURL<GuestAuthPayload>('/auth/guest', { deviceId }));

export const GetMe = async () => normalizeGetMeResponse(await getProtectedURL<{ user: AuthUser }>('/auth/me'));

export const UpdateMyProfilePhoto = async (image: FileType) => {
  const formData = new FormData();
  formData.append('image', {
    uri: image.uri,
    name: image.name || 'profile-photo.jpg',
    type: image.type || 'image/jpeg',
  } as any);
  return normalizeGetMeResponse(await fetchProtectedFormURL<{ user: AuthUser }>('/auth/me/photo', formData, 'patch'));
};

export const CreateSubmission = async (input: {
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
}) => {
  const preparedImages = await PrepareSubmissionImages(input.images);
  const formData = new FormData();
  formData.append('latitude', String(input.latitude));
  formData.append('longitude', String(input.longitude));
  if (input.note) formData.append('note', input.note);
  if (input.organizationId) formData.append('organizationId', input.organizationId);
  if (input.villageId) formData.append('villageId', input.villageId);
  if (input.plantId) formData.append('plantId', input.plantId);
  if (input.missionCode) formData.append('missionCode', input.missionCode);
  if (input.collectedAt) formData.append('collectedAt', input.collectedAt);
  formData.append('photoSteps', JSON.stringify(input.photoSteps));
  preparedImages.forEach((image: FileType, index: number) => {
    formData.append('images', {
      uri: image.uri,
      name: image.name || `submission-photo-${index + 1}.jpg`,
      type: image.type || 'image/jpeg',
    } as any);
  });
  return fetchProtectedFormURL<Submission>('/submissions', formData, 'post');
};

export const GetMySubmissions = async () => normalizeSubmissionListResponse(await getProtectedURL<Submission[]>('/submissions/me'));
export const GetSubmissionById = async (submissionId: string) =>
  normalizeSubmissionDetailResponse(await getProtectedURL<Submission>(`/submissions/${EncodeURIPath(submissionId)}`));
export const GetPlantsMissingPhotosMission = async (page = 1, pageSize = 20, search?: string) =>
  normalizeMissionListResponse(
    await getProtectedURL<MissingPlantPhotosMissionList>(`/missions/plants/missing-photos${toQueryStr({ page, pageSize, search })}`),
  );

export const GetPlantMissingPhotosMissionDetail = async (plantId: string) =>
  normalizeMissionDetailResponse(await getProtectedURL<MissingPlantPhotosMissionDetail>(`/missions/plants/${EncodeURIPath(plantId)}/missing-photos`));
export const GetMyOrganizations = async () => getProtectedURL<OrganizationMemberSummary[]>('/organizations/me');
export const GetMyOrganizationInvitations = async () => getProtectedURL<OrganizationMemberSummary[]>('/organizations/me/invitations');
export const GetOrganizationById = async (organizationId: string) => getURL<OrganizationDetail>(`/organizations/${EncodeURIPath(organizationId)}`);
export const RespondToOrganizationInvitation = async (organizationId: string, memberId: string, status: 'ACTIVE' | 'REJECTED') =>
  patchProtectedURL<OrganizationMemberSummary>(`/organizations/${EncodeURIPath(organizationId)}/invitations/${EncodeURIPath(memberId)}/respond`, { status });
export const InviteOrganizationMember = async (organizationId: string, input: { email: string; roleInOrganization?: string }) =>
  postProtectedURL<OrganizationMemberSummary>(`/organizations/${EncodeURIPath(organizationId)}/invitations`, input);
export const UpdateOrganizationMemberRole = async (organizationId: string, memberId: string, input: { roleInOrganization: string }) =>
  patchProtectedURL<OrganizationMemberSummary>(`/organizations/${EncodeURIPath(organizationId)}/members/${EncodeURIPath(memberId)}`, input);
export const RemoveOrganizationMember = async (organizationId: string, memberId: string) =>
  deleteProtectedURL<{ id: string; organizationId: string; userId: string; removed: boolean; removedBySelf: boolean }>(
    `/organizations/${EncodeURIPath(organizationId)}/members/${EncodeURIPath(memberId)}`,
  );
export const GetHomeSummary = async () => getURL<HomeSummary>('/leaderboards/home');
export const GetMyProfileSummary = async () => getProtectedURL<ProfileSummary>('/leaderboards/me/profile-summary');
export const GetCurrentFloweringPlants = async () => normalizeFloweringPlantsResponse(await getURL<FloweringPlantsResponse>('/flowering/current'));
export const GetVillagesByFewSubmissions = async (limit = 100) =>
  getProtectedURL<VillageFewSubmissionsItem[]>(`/missions/villages/few-submissions${toQueryStr({ limit })}`);
export const ResolveVillageByCoordinates = async (latitude: number, longitude: number) =>
  getURL<ResolvedVillage>(`/villages/resolve${toQueryStr({ latitude, longitude })}`);
export const CreateOrganizationRequest = async (input: { name: string; description?: string }) =>
  postURL<OrganizationCreationRequest>('/requests/organizations', input);
export const CreateVillageRequest = async (input: { nameEn: string; nameFr?: string; nameAr?: string; description?: string }) =>
  postURL<{ id: string; nameEn: string; nameFr?: string | null; nameAr?: string | null; description?: string | null }>('/requests/villages', input);

export const RegisterNotificationDeviceToken = async (input: { token: string; platform: 'ANDROID' | 'IOS'; deviceId?: string }) =>
  postProtectedURL<{ id: string; token: string; platform: 'ANDROID' | 'IOS'; isActive: boolean }>('/notifications/device-token', input);

export const UnregisterNotificationDeviceToken = async (input: { token: string; platform: 'ANDROID' | 'IOS'; deviceId?: string }) =>
  fetchURL<{ token: string; isActive: boolean }>('/notifications/device-token', input, 'json', 'delete', undefined, { requiresAuth: true });

export const SendTestNotification = async (input?: { title?: string; body?: string }) =>
  postProtectedURL<{ attempted: number; sent: number; deactivated: number }>('/notifications/test', input || {});

export const Logout = async () => {
  await SecureStoreManager.clearToken();
  await clearStoredSessionSnapshot();
  return true;
};
