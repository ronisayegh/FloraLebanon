import { CameraCapturedPicture } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { GetRandomName, isString } from '../../Static';
import { GetCachedURI } from '../../Stores';
import { ExtToMime, FileType, GetURIExt, MimeToExt, SimpleStrToMime, UnfilteredFileTypeUri, UnfilteredFileTypeUrl } from './FileUtils';

export const isLocalURI = (uri: string) => isString(uri) && uri.startsWith('file://');
export const isLocalFile = (file: FileType) => isLocalURI(file.uri);
export const isImgAsset = (file: UnfilteredFileTypeUri): file is ImagePicker.ImagePickerAsset =>
  file && 'type' in file && (file.type === 'image' || file.type === 'video');
export const isCameraCapturedPicture = (file: UnfilteredFileTypeUri): file is CameraCapturedPicture =>
  file && 'width' in file && 'height' in file && !('name' in file) && !('fileName' in file) && !('type' in file);
export const isDocumentPickerAsset = (file: UnfilteredFileTypeUri): file is DocumentPicker.DocumentPickerAsset => file && 'name' in file;
export const toFileTypeAsync = async (file: UnfilteredFileTypeUrl) => GetCachedURI(file.url).then(uri => toFileType({ ...file, uri }));
export function toFileType(file: UnfilteredFileTypeUri): FileType {
  let uri = file.uri;
  let name = file.name || file.fileName;
  let type = file.type || file.mimeType;
  let size = file.size || file.fileSize;
  if (!size) size = (file.height ?? 0) * (file.width ?? 0);
  if (isCameraCapturedPicture(file)) {
    type = 'image/jpeg';
    name = GetRandomNameWithExt('jpg');
  }
  if (!name) name = GetRandomNameWithExt(GetURIExt(uri) || 'unknown');
  const result = FixFileType({ name, size, uri, type } as FileType);
  result.name ||= GetRandomFileName(result);
  return result;
}
export const FixFileType = (file: FileType): FileType => {
  let ext: string | undefined = MimeToExt(file.type);
  if (ext) return file;
  ext = GetFileExt(file);
  let type = ExtToMime(ext);
  if (type) file.type = type;
  else if (!file.type) file.type = 'application/octet-stream';
  return file;
};
const FindType = (type?: string, ext?: string) => {
  let temp = ExtToMime(MimeToExt(type)) || ExtToMime(ext);
  if (temp) return temp;
  return SimpleStrToMime(type);
};
export const toFilesType = (file: UnfilteredFileTypeUri[]) => file.map(toFileType);
export const GetRandomFileName = (file: FileType, length: number = 32): string => GetRandomNameWithExt(GetFileExt(file), length);
export const GetRandomNameWithExt = (ext: string, length: number = 32): string => GetRandomName(length) + '.' + ext;
const Pop = (array?: string[]) => array && array?.length > 1 && array.pop();
const SPop = (str: string | undefined | null, separator: string) => Pop(str?.split(separator));
export const GetFileExt = (file: FileType): string => (SPop(file.name, '.') || GetURIExt(file.uri) || SPop(file.type, '/') || '').toLowerCase();
const compoundExtensions: string[] = ['.tar.gz', '.user.js'];

export const isFileImage = (file: FileType) => file && file.type && file.type.startsWith('image');
export const isFileVideo = (file: FileType) => file && file.type && file.type.startsWith('video');
export const isFileAudio = (file: FileType) => file && file.type && file.type.startsWith('audio');
