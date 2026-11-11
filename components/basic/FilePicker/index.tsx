import { FileType, GetRandomFileName, MimeToSimple, SimpleMime, SimpleToMime, isFileImage, toFilesType } from '@/constants/Helper';
import { isArray } from '@/constants/Static';
import { useDefaultContext } from '@/hooks';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { GetFileIcon, XCircle } from '../Icons';
import { ImgWithDef } from '../Image/ImgWithDef';
import { ModalWithX } from '../Modal';
import { Scroll } from '../Scroll';
import { ThemedBtnTxt } from '../ThemedBtn';
import { ThemedTxt } from '../ThemedTxt';
export type BaseFilePicker = {
  onFilesChanged?: (file: FileType[]) => void;
  selectedFiles?: FileType[];
  documentPickerOptions?: DocumentPicker.DocumentPickerOptions;
  imagePickerOptions?: ImagePicker.ImagePickerOptions;
  containerStyle?: StyleProp<ViewStyle>;
  fileTypes?: SimpleMime[];
  multi?: boolean;
};
export type FilePickerWithButton = BaseFilePicker & {
  showButton?: true;
};
export type FilePickerWithoutButton = BaseFilePicker & {
  showButton: false;
  visible: boolean;
  onClose: () => void;
};
export type FilePickerProps = FilePickerWithButton | FilePickerWithoutButton;
export const FilePicker: React.FC<FilePickerProps> = props => {
  const theme = useDefaultContext().ThemeContext.value;
  const { visible, onClose, ...prps } = props as FilePickerProps & { visible?: boolean; onClose?: () => void };
  const { onFilesChanged, selectedFiles, ...settings } = prps;
  const { documentPickerOptions, imagePickerOptions, fileTypes = [], showButton = true, multi = true, containerStyle } = settings;
  const [files, setFiles] = useState<FileType[]>([]);
  const [modalVisible, setModalVisible] = useState(visible || false);
  useEffect(() => setModalVisible(visible || false), [visible]);
  useEffect(() => setFiles(selectedFiles || []), [selectedFiles]);
  const options = { isAll: true, isImageOnly: false, isVideoOnly: false, isMediaOnly: false, isDocumentOnly: false };
  const includeImage = fileTypes.includes('image');
  const includeVideo = fileTypes.includes('video');
  switch (fileTypes.length) {
    case 1:
      options.isAll = false;
      options.isImageOnly = includeImage;
      options.isVideoOnly = includeVideo;
      options.isMediaOnly = options.isImageOnly || options.isVideoOnly;
      options.isDocumentOnly = !options.isMediaOnly;
      break;
    case 2:
      options.isMediaOnly = includeImage && includeVideo;
      options.isDocumentOnly = !includeImage && !includeVideo;
      options.isAll = !options.isDocumentOnly && !options.isMediaOnly;
      break;
    default:
      options.isAll = true;
  }
  const setSelectedFiles = (files: FileType[]) => {
    setFiles(prev => {
      let result = multi ? [...prev, ...(files || [])] : files.slice(0, 1);
      onFilesChanged?.(result);
      return result;
    });
  };
  const removeSelectedFile = (index: number) => {
    if (isArray(files))
      setFiles(prev => {
        let result = prev.filter((_, i) => i !== index);
        onFilesChanged?.(result);
        return result;
      });
  };
  const handleSelectImages = async () => {
    const mediaTypes: ImagePicker.MediaTypeOptions = options.isImageOnly
      ? ImagePicker.MediaTypeOptions.Images
      : options.isVideoOnly
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.All;
    HandleExpoImagePicker({ mediaTypes, allowsMultipleSelection: multi, ...imagePickerOptions }).then(result => {
      if (result) setSelectedFiles(result);
      if (onClose) onClose();
      else setModalVisible(false);
    });
  };
  const handleSelectDocuments = async () => {
    const allowedTypes = fileTypes.length === 0 ? ['*/*'] : fileTypes.map(fileType => SimpleToMime(fileType));
    HandleExpoDocumentPicker({ type: allowedTypes, multiple: multi, ...documentPickerOptions }).then(result => {
      if (result) setSelectedFiles(result);
      if (onClose) onClose();
      else setModalVisible(false);
    });
  };
  const attachmentOptions = [
    { key: 'media', label: 'Media', action: handleSelectImages },
    { key: 'documents', label: 'Documents', action: handleSelectDocuments },
  ];
  const handleBtnPress = () => {
    if (options.isAll) setModalVisible(true);
    else if (options.isMediaOnly) handleSelectImages();
    else handleSelectDocuments();
  };
  const buildFileItem = (file: FileType, index: number) => {
    return (
      <View key={index} style={styles.fileItemCont}>
        <TouchableOpacity style={[styles.itemXBtn, { backgroundColor: theme.primaryBg }]} onPress={() => removeSelectedFile(index)}>
          <XCircle size={16} />
        </TouchableOpacity>
        {isFileImage(file) ? <ImgWithDef url={file.uri} style={styles.imageItem} /> : GetFileIcon(MimeToSimple(file.type), 60)}
        <ThemedTxt text={file.name || file.type} fontSize={12} nowwarp />
      </View>
    );
  };
  return (
    <View style={[styles.container, containerStyle]}>
      <Scroll horizontal style={styles.selectedImagesContainer}>
        {files?.map((file, index) => buildFileItem(file, index))}
      </Scroll>
      {showButton && <ThemedBtnTxt text="Select file(s)" buttonStyle={styles.button} onPress={handleBtnPress} />}
      <ModalWithX isVisible={modalVisible} closeModal={() => (onClose ? onClose() : setModalVisible(false))} position="bottom">
        <View style={[styles.modalContent, { backgroundColor: theme.primaryBg }]}>
          {attachmentOptions.map(option => (
            <TouchableOpacity key={option.key} style={[styles.modalOption, { borderBottomColor: theme.disabledbg }]} onPress={() => option.action()}>
              <ThemedTxt text={option.label} fontSize={16} fontWeight="bold" capitalize />
            </TouchableOpacity>
          ))}
        </View>
      </ModalWithX>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  button: {
    width: 140,
    minHeight: 44,
    borderRadius: 10,
  },
  selectedImagesContainer: {
    maxHeight: 100,
    paddingBottom: 5,
  },
  imageItem: {
    height: 60,
    width: 'auto',
    aspectRatio: 1,
  },
  fileItemCont: {
    width: 80,
    height: 80,
    marginHorizontal: 4,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemXBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    zIndex: 3,
    backgroundColor: 'white',
    borderRadius: 999,
  },
  modalContent: {
    padding: 22,
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 1)',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
  },
  modalOption: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
export const FileToFormData = (file: FileType, filename?: string) => {
  if (!file) return null;
  let name = filename || file.name || GetRandomFileName(file);
  return { uri: file.uri, type: file.type, name } as any;
};
export const HandleExpoImagePicker = async (options?: ImagePicker.ImagePickerOptions) => {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permissionResult.status !== 'granted') {
    Alert.alert('Permission needed', 'Permission to access the media library is required.');
    return null;
  }
  try {
    let result = await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return null;
    return toFilesType(result.assets);
  } catch (error) {
    return null;
  }
};
export const HandleExpoDocumentPicker = async (options?: DocumentPicker.DocumentPickerOptions) => {
  try {
    let result = await DocumentPicker.getDocumentAsync(options);
    if (result.canceled) return null;
    return toFilesType(result.assets);
  } catch (error) {
    return null;
  }
};
