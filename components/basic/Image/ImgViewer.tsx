import { CompareByField, FieldOrder, isArray, isNumber, isString } from '@/constants/Static';
import React, { useEffect, useState } from 'react';
import { Image, TextStyle, ViewStyle } from 'react-native';
import ImageViewerBase, { ImageViewerPropsDefine } from 'react-native-image-zoom-viewer';
import { IImageInfo } from 'react-native-image-zoom-viewer/built/image-viewer.type';
import { ModalWithX } from '../Modal/ModalWithX';
import { ThemedTxt } from '../ThemedTxt';
export interface ImgInfos extends IImageInfo {}
export type ImgInfosPlus = ImgInfos & {
  url: string;
  originUrl: string;
  order?: number[];
};
interface ImgViewerProps extends Omit<Omit<ImageViewerPropsDefine, 'imageUrls'>, 'index'> {
  isVisible: boolean;
  closeModal: () => void;
  imageUrls?: ImgInfos[];
  currentUrl?: string;
}
export const ImgViewer = (props: ImgViewerProps) => {
  const { closeModal: closeModal, isVisible, imageUrls, currentUrl, ...prps } = props;
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (isString(currentUrl)) {
      if (!imageUrls) return;
      var index = imageUrls.findIndex(e => e.url === currentUrl);
      setIndex(index || 0);
    }
  }, [currentUrl]);
  return (
    <ModalWithX isVisible={isVisible} closeModal={closeModal} innerStyle={{ height: '100%', backgroundColor: 'transparent' }} hideX out ignoreSafeInsets>
      <ImageViewerBase
        index={index}
        imageUrls={imageUrls}
        onChange={index => {
          if (isNumber(index) && imageUrls) setIndex(index);
        }}
        onSwipeDown={closeModal}
        saveToLocalByLongPress={false}
        style={{ width: '100%', justifyContent: 'center' }}
        renderIndicator={(idx, count) => (
          <ThemedTxt
            text={idx + '/' + count}
            color="white"
            fontSize={18}
            center
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '10%',
              zIndex: 13,
              textAlign: 'center',
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: {
                width: 0,
                height: 0.5,
              },
              textShadowRadius: 0,
            }}
          />
        )}
        renderImage={imageProps => <Image {...imageProps} resizeMode="contain" />}
        backgroundColor="transparent"
        show={isVisible}
        {...prps}
      />
    </ModalWithX>
  );
};
type IIRef = React.MutableRefObject<ImgInfosPlus[]>;
type IIField = FieldOrder<ImgInfosPlus>;
export const ImgViewerOnUri = (imgsRef: IIRef, url: string, uri: string, order?: number[], FieldOrder: IIField = []) => {
  imgsRef.current?.push({ url: uri, originUrl: url, order });
  if (order) {
    if (!isArray(FieldOrder) || FieldOrder.length === 0) {
      FieldOrder = [];
      for (let i = 0; i < order.length; i++) FieldOrder.push({ field: 'order', index: i, order: 'ASC' });
    }
    imgsRef.current.sort((o1, o2) => CompareByField<ImgInfosPlus>(FieldOrder)(o1, o2) as number);
  }
};
const simpleStyle: {
  [x: string]: ViewStyle | TextStyle;
} = {
  count: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '10%',
    zIndex: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {},
};
