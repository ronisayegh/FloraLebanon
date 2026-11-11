import { MainColor } from '@/constants/Config';
import { FileType, MimeToSimple, UnfilteredFileType, UnfilteredFileTypeUri, UnfilteredFileTypeUrl, toFileType, toFileTypeAsync } from '@/constants/Helper';
import Logging from '@/constants/Logging';
import { isString } from '@/constants/Static';
import React, { useEffect, useState } from 'react';
import { StyleProp, TouchableOpacity, View, ViewStyle } from 'react-native';
import {
  BinaryFile,
  CodeFile,
  ExcelFile,
  Folder,
  ImageFile,
  MusicFile,
  PDFFile,
  PowerPointFile,
  TextFile,
  ThemeIconType,
  VideoFile,
  WordFile,
  ZipFile,
} from '../SVGs';
export interface FileIconProps {
  file: UnfilteredFileType;
  size?: number;
  iconProps?: Partial<ThemeIconType>;
  contStyle?: StyleProp<ViewStyle>;
  touchable?: boolean;
}
export const GetFileIcon = (type: string, size = 40, props?: Partial<ThemeIconType>) => {
  switch (type) {
    case 'folder':
      return <Folder size={size} fill={MainColor} filled {...props} />;
    case 'image':
      return <ImageFile size={size} fill={MainColor} {...props} />;
    case 'text':
      return <TextFile size={size} fill="#DDC985" {...props} />;
    case 'svg':
      return <CodeFile size={size} fill="#DDC985" {...props} />;
    case 'audio':
      return <MusicFile size={size} fill="orange" {...props} />;
    case 'pdf':
      return <PDFFile size={size} fill="red" {...props} />;
    case 'word':
      return <WordFile size={size} fill="blue" {...props} />;
    case 'video':
      return <VideoFile size={size} fill="#f2537c" {...props} />;
    case 'excel':
      return <ExcelFile size={size} fill="green" {...props} />;
    case 'powerpoint':
      return <PowerPointFile size={size} fill="#ff782c" {...props} />;
    case 'zip':
      return <ZipFile size={size} fill="purple" {...props} />;
    case 'unknown':
    default:
      return <BinaryFile size={size} fill="grey" {...props} />;
  }
};
export const FileIcon: React.FC<FileIconProps> = props => {
  const { file, size = 40, touchable, iconProps, contStyle } = props;
  const [fixedFile, setFixedFile] = useState<FileType>();
  useEffect(() => {
    if (!file) return;
    let { uri } = file as UnfilteredFileTypeUri;
    let { url } = file as UnfilteredFileTypeUrl;
    if (isString(uri)) setFixedFile(toFileType({ ...file, uri }));
    else if (isString(url))
      toFileTypeAsync(file as UnfilteredFileTypeUrl)
        .then(file => setFixedFile(file))
        .catch(e => Logging.Logger.error('FileIcon', e));
  }, [file]);
  return fixedFile ? (
    touchable ? (
      <TouchableOpacity style={[{ width: size, height: size }, contStyle]}>{GetFileIcon(MimeToSimple(fixedFile?.type), size, iconProps)}</TouchableOpacity>
    ) : (
      <View style={[{ width: size, height: size }, contStyle]}>{GetFileIcon(MimeToSimple(fixedFile?.type), size, iconProps)}</View>
    )
  ) : null;
};
