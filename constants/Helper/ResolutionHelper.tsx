import { PHONE_FRAME_PREVIEW } from '@/hooks/usePhoneFramePreview';
import { Dimensions } from 'react-native';

const windowDimensions = Dimensions.get('window');
const { width, height } = PHONE_FRAME_PREVIEW.enabled
  ? {
      width: PHONE_FRAME_PREVIEW.width ?? windowDimensions.width,
      height: PHONE_FRAME_PREVIEW.height ?? windowDimensions.height,
    }
  : windowDimensions;

const baseWidth = 448;
const baseHeight = 1040;
const baseRatio = baseWidth / baseHeight;
export const Window = {
  w: width,
  h: height,
  ratio: width / height,
  vmax: width > height ? width : height,
  vmin: width < height ? width : height,
  wRatio: width / baseWidth,
  hRatio: height / baseHeight,
  rRatio: width / height / baseRatio,
  defH: height * 0.04,
};
export const wScale = (size: number) => (width / baseWidth) * size;
export const hScale = (size: number) => (height / baseHeight) * size;
export const minWScale = (size: number) => Math.min(size, wScale(size));
export const minHScale = (size: number) => Math.min(size, hScale(size));
export const moderateScale = (size: number, factor = 0.5) => size + (wScale(size) - size) * factor;

export function Normalize(size: number) {
  return size * Window.wRatio;
}
export function NormalizeRem(rem: number) {
  return Normalize(rem * 16);
}
export function NormalizeLineHeight(size: number, height: number) {
  return Normalize(size) * height;
}
export function NormalizeRemLineHeight(size: number, height: number) {
  return NormalizeRem(size) * height;
}
export function NormalizeFont(size: number, height: number) {
  return { fontSize: Normalize(size), lineHeight: NormalizeLineHeight(size, height) };
}
export function NormalizeRemFont(size: number, height: number) {
  return { fontSize: NormalizeRem(size), lineHeight: NormalizeRemLineHeight(size, height) };
}
