// constants/Helper/FileUtils.tsx
import axios from 'axios';
import Logging from '../../Logging';
const extToMimeMap = {
  'pdf': 'application/pdf',
  'zip': 'application/x-zip-compressed',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'json': 'application/json',
  'xml': 'application/xml',
  'txt': 'text/plain',
  'html': 'text/html',
  'css': 'text/css',
  'js': 'text/javascript',
  'csv': 'text/csv',
  'svg': 'image/svg+xml',
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'wav': 'audio/wav',
  'm4a': 'audio/x-m4a',
  'mp3': 'audio/mpeg',
  '3gp': 'video/3gpp',
  'mp4': 'video/mp4',
  'mov': 'video/quicktime',
  'avi': 'video/x-msvideo',
  '': 'application/octet-stream',
} as const;
export type SimpleMime = 'unknown' | 'text' | 'svg' | 'image' | 'audio' | 'video' | 'pdf' | 'word' | 'excel' | 'powerpoint' | 'zip' | 'folder';

export type ExtensionType = keyof typeof extToMimeMap;
export type MimeTypes = (typeof extToMimeMap)[keyof typeof extToMimeMap];

export const SimpleStrToMime = (str?: string) => (str ? SimpleToMime(str.toLowerCase() as SimpleMime, true) : undefined);
export const SimpleToMime = (simple: SimpleMime, und = false) => {
  switch (simple) {
    case 'text':
      return 'text/*';
    case 'svg':
      return 'image/svg+xml';
    case 'image':
      return 'image/*';
    case 'audio':
      return 'audio/*';
    case 'video':
      return 'video/*';
    case 'pdf':
      return 'application/pdf';
    case 'word':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'excel':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'powerpoint':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'zip':
      return 'application/x-zip-compressed';
    default:
      return 'application/octet-stream';
  }
};
export const MimeToSimple = (mime?: string): SimpleMime => {
  if (!mime) return 'unknown';
  if (mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml') return 'text';
  if (mime === 'image/svg+xml') return 'svg';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.includes('wordprocessingml') || mime === 'application/msword') return 'word';
  if (mime.includes('spreadsheetml') || mime === 'application/vnd.ms-excel') return 'excel';
  if (mime.includes('presentationml') || mime === 'application/vnd.ms-powerpoint') return 'powerpoint';
  if (mime === 'application/zip' || mime === 'application/x-zip-compressed') return 'zip';
  if (mime === 'folder') return 'folder';
  return 'unknown';
};
export const ExtToSimpleType = (ext: string): SimpleMime => MimeToSimple(ExtToMime(ext) || 'application/octet-stream');
type BaseUnfilteredFileType = {
  name?: string | null;
  fileName?: string | null;
  type?: string | null;
  mimeType?: string | null;
  size?: number | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
};
export type UnfilteredFileTypeUrl = BaseUnfilteredFileType & { url: string };
export type UnfilteredFileTypeUri = BaseUnfilteredFileType & { uri: string };
export type UnfilteredFileType = UnfilteredFileTypeUrl | UnfilteredFileTypeUri;
//ImagePicker.ImagePickerAsset | CameraCapturedPicture | DocumentPicker.DocumentPickerAsset |
export type FileType = {
  name?: string | null;
  size?: number;
  uri: string;
  type: MimeTypes;
};
export type RemoteFileMetadata = {
  etag?: string | null;
  lastModified?: string | null;
  contentLength?: number | null;
  contentType?: string | null;
};
const mimeToExtMap: { [K in MimeTypes]: ExtensionType } = Object.keys(extToMimeMap).reduce(
  (acc, key) => {
    const mimeKey = extToMimeMap[key as keyof typeof extToMimeMap];
    acc[mimeKey] = key as ExtensionType;
    return acc;
  },
  {} as { [K in MimeTypes]: ExtensionType },
);

export const ExtToMime = (ext?: string): MimeTypes | undefined => (ext ? extToMimeMap[ext.toLowerCase() as ExtensionType] : undefined);
export const MimeToExt = (mime?: string): ExtensionType | undefined => (mime ? mimeToExtMap[mime.toLowerCase() as MimeTypes] : undefined);
const compoundExtensions: string[] = ['.tar.gz', '.user.js'];
export const GetURIExt = (uri: string) => {
  try {
    const decodedUrl = decodeURIComponent(uri);
    if (decodedUrl.startsWith('data:')) {
      const mimeType = decodedUrl.match(/data:([^;]*);/)?.[1];
      if (mimeType) return MimeToExt(mimeType);
    }
    const matches = decodedUrl.match(/\/([^\/?#]+)(\?|#|$)/);
    const filename = matches && matches[1] ? matches[1] : null;
    if (!filename) return null;
    for (const ext of compoundExtensions) if (filename.endsWith(ext)) return ext.substring(1);
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex + 1) : null;
  } catch (ex) {
    Logging.Logger.warn('GetURIExt', uri, ex);
  }
  return null;
};

const getStringHeader = (value: unknown) => (typeof value === 'string' ? value : Array.isArray(value) && typeof value[0] === 'string' ? value[0] : null);

export const GetFileContentType = async (url: string): Promise<string | null> => {
  try {
    const response = await axios({ method: 'HEAD', url, timeout: 2000 });
    if (response.status === 200) return getStringHeader(response.headers['content-type']);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 405) return null;
    Logging.Logger.log('Error on GetFileContentType', 'For Url', url, error);
  }
  return null;
};

export const GetUrlExt = async (url: string) => {
  try {
    const ext = GetURIExt(url);
    if (ext) return ext;
    const contentType = await GetFileContentType(url);
    if (contentType) return MimeToExt(contentType);
  } catch (ex) {}
  return null;
};

export const GetRemoteFileMetadata = async (url: string, timeout = 2000, headers?: Record<string, string>): Promise<RemoteFileMetadata | null> => {
  try {
    const response = await axios({
      method: 'HEAD',
      url,
      headers,
      timeout,
      validateStatus: status => status >= 200 && status < 400,
    });
    const rawLength = getStringHeader(response.headers['content-length']);
    const parsedLength = typeof rawLength === 'string' ? Number(rawLength) : null;
    return {
      etag: getStringHeader(response.headers.etag),
      lastModified: getStringHeader(response.headers['last-modified']),
      contentLength: Number.isFinite(parsedLength) ? parsedLength : null,
      contentType: getStringHeader(response.headers['content-type']),
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 405) return null;
    Logging.Logger.log('Error on GetRemoteFileMetadata', 'For Url', url, error);
  }
  return null;
};
