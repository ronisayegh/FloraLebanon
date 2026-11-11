import { SUBMISSION_IMAGES_CONVERT_TO_JPEG } from '@/constants/Config';
import * as ImageManipulator from 'expo-image-manipulator';
import type { FileType } from './FileUtils';

const DEFAULT_SUBMISSION_JPEG_QUALITY = 0.85;

const getJpegName = (file: FileType, index: number) => {
  const baseName = file.name?.replace(/\.[^.]+$/, '') || `submission-photo-${index + 1}`;
  return `${baseName}.jpg`;
};

export const PrepareSubmissionImage = async (file: FileType, index = 0, quality = DEFAULT_SUBMISSION_JPEG_QUALITY): Promise<FileType> => {
  if (!file.type?.startsWith('image/')) return file;
  if (!SUBMISSION_IMAGES_CONVERT_TO_JPEG) return file;

  const normalized = await ImageManipulator.manipulateAsync(file.uri, [], {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return {
    ...file,
    uri: normalized.uri,
    type: 'image/jpeg',
    name: getJpegName(file, index),
  };
};

export const PrepareSubmissionImages = async (files: FileType[], quality = DEFAULT_SUBMISSION_JPEG_QUALITY) => {
  return Promise.all(files.map((file, index) => PrepareSubmissionImage(file, index, quality)));
};

export const GetSubmissionImageSettings = () => ({
  format: 'JPEG',
  quality: DEFAULT_SUBMISSION_JPEG_QUALITY,
  keepsOriginalDimensions: true,
});
