import { FileType, toFileType } from '@/constants/Helper';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { ThemedBtnTxt } from '../ThemedBtn';
import { ThemedTxt } from '../ThemedTxt';
import { ThemedView } from '../ThemedView';

type CropRatio = [number, number];

interface ImageCropperProps {
  image: FileType;
  sourceWidth: number;
  sourceHeight: number;
  ratio?: CropRatio;
  onCancel: () => void;
  onConfirm: (file: FileType) => void;
}

const getEffectiveTargetRatio = (width: number, height: number, ratio: CropRatio) => {
  const isPortrait = height >= width;
  return isPortrait ? ratio[1] / ratio[0] : ratio[0] / ratio[1];
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const ImageCropper: React.FC<ImageCropperProps> = ({ image, sourceWidth, sourceHeight, ratio, onCancel, onConfirm }) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setSaving] = useState(false);
  const offsetRef = useRef(offset);
  const zoomRef = useRef(zoom);
  const pinchStartZoomRef = useRef(zoom);
  const pinchDistanceRef = useRef<number | null>(null);
  const activeTouchCountRef = useRef(0);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const setOffsetClamped = (nextX: number, nextY: number) => {
    const nextOffset = clampOffset(nextX, nextY);
    offsetRef.current = nextOffset;
    setOffset(nextOffset);
  };

  const setZoomClamped = (nextZoom: number) => {
    const clampedZoom = clamp(Number(nextZoom.toFixed(2)), 1, 4);
    zoomRef.current = clampedZoom;
    setZoom(clampedZoom);
  };

  const cropBox = useMemo(() => {
    if (!containerSize.width || !containerSize.height) return null;
    if (!ratio) {
      return { width: containerSize.width, height: containerSize.height };
    }

    const targetRatio = getEffectiveTargetRatio(containerSize.width, containerSize.height, ratio);
    const isPortrait = containerSize.height >= containerSize.width;

    if (isPortrait) {
      const width = containerSize.width;
      return { width, height: width / targetRatio };
    }

    const height = containerSize.height;
    return { width: height * targetRatio, height };
  }, [containerSize.height, containerSize.width, ratio]);

  const renderedImage = useMemo(() => {
    if (!cropBox) return null;
    const baseScale = Math.max(cropBox.width / sourceWidth, cropBox.height / sourceHeight);
    const width = sourceWidth * baseScale * zoom;
    const height = sourceHeight * baseScale * zoom;
    return { width, height };
  }, [cropBox, sourceHeight, sourceWidth, zoom]);

  const clampOffset = (nextX: number, nextY: number) => {
    if (!cropBox || !renderedImage) return { x: 0, y: 0 };

    const maxX = Math.max(0, (renderedImage.width - cropBox.width) / 2);
    const maxY = Math.max(0, (renderedImage.height - cropBox.height) / 2);

    return {
      x: clamp(nextX, -maxX, maxX),
      y: clamp(nextY, -maxY, maxY),
    };
  };

  useEffect(() => {
    setOffset(current => {
      const nextOffset = clampOffset(current.x, current.y);
      offsetRef.current = nextOffset;
      return nextOffset;
    });
  }, [cropBox, renderedImage]);

  const resetGestureState = () => {
    pinchDistanceRef.current = null;
    activeTouchCountRef.current = 0;
    lastPanPointRef.current = null;
  };

  const handleTouchStart = (event: any) => {
    const touches = event.nativeEvent.touches ?? [];
    activeTouchCountRef.current = touches.length;

    if (touches.length >= 2) {
      const [firstTouch, secondTouch] = touches;
      pinchDistanceRef.current = Math.hypot(secondTouch.pageX - firstTouch.pageX, secondTouch.pageY - firstTouch.pageY);
      pinchStartZoomRef.current = zoomRef.current;
      lastPanPointRef.current = null;
      return;
    }

    if (touches.length === 1) {
      const touch = touches[0];
      lastPanPointRef.current = { x: touch.pageX, y: touch.pageY };
    }
  };

  const handleTouchMove = (event: any) => {
    const touches = event.nativeEvent.touches ?? [];

    if (touches.length >= 2) {
      activeTouchCountRef.current = 2;
      lastPanPointRef.current = null;
      const [firstTouch, secondTouch] = touches;
      const distance = Math.hypot(secondTouch.pageX - firstTouch.pageX, secondTouch.pageY - firstTouch.pageY);

      if (!pinchDistanceRef.current) {
        pinchDistanceRef.current = distance;
        pinchStartZoomRef.current = zoomRef.current;
        return;
      }

      setZoomClamped(pinchStartZoomRef.current * (distance / pinchDistanceRef.current));
      return;
    }

    pinchDistanceRef.current = null;

    if (touches.length !== 1) {
      activeTouchCountRef.current = touches.length;
      lastPanPointRef.current = null;
      return;
    }

    const touch = touches[0];
    if (activeTouchCountRef.current !== 1 || !lastPanPointRef.current) {
      activeTouchCountRef.current = 1;
      lastPanPointRef.current = { x: touch.pageX, y: touch.pageY };
      return;
    }

    const deltaX = touch.pageX - lastPanPointRef.current.x;
    const deltaY = touch.pageY - lastPanPointRef.current.y;
    lastPanPointRef.current = { x: touch.pageX, y: touch.pageY };
    setOffsetClamped(offsetRef.current.x + deltaX, offsetRef.current.y + deltaY);
  };

  const handleTouchEnd = (event: any) => {
    const touches = event.nativeEvent.touches ?? [];

    if (touches.length >= 2) {
      const [firstTouch, secondTouch] = touches;
      pinchDistanceRef.current = Math.hypot(secondTouch.pageX - firstTouch.pageX, secondTouch.pageY - firstTouch.pageY);
      pinchStartZoomRef.current = zoomRef.current;
      activeTouchCountRef.current = 2;
      lastPanPointRef.current = null;
      return;
    }

    if (touches.length === 1) {
      const touch = touches[0];
      activeTouchCountRef.current = 1;
      pinchDistanceRef.current = null;
      lastPanPointRef.current = { x: touch.pageX, y: touch.pageY };
      return;
    }

    resetGestureState();
  };

  const handleConfirm = async () => {
    if (!cropBox || !renderedImage) return;

    setSaving(true);
    try {
      if (!ratio) {
        onConfirm(image);
        return;
      }

      const imageLeft = (cropBox.width - renderedImage.width) / 2 + offset.x;
      const imageTop = (cropBox.height - renderedImage.height) / 2 + offset.y;

      const originX = clamp(Math.round((-imageLeft / renderedImage.width) * sourceWidth), 0, sourceWidth);
      const originY = clamp(Math.round((-imageTop / renderedImage.height) * sourceHeight), 0, sourceHeight);
      const width = clamp(Math.round((cropBox.width / renderedImage.width) * sourceWidth), 1, sourceWidth - originX);
      const height = clamp(Math.round((cropBox.height / renderedImage.height) * sourceHeight), 1, sourceHeight - originY);

      const cropped = await ImageManipulator.manipulateAsync(image.uri, [{ crop: { originX, originY, width, height } }], {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      onConfirm(toFileType({ uri: cropped.uri, width: cropped.width, height: cropped.height }));
    } finally {
      setSaving(false);
    }
  };

  const overlayInsets = cropBox
    ? {
        horizontal: Math.max(0, (containerSize.width - cropBox.width) / 2),
        vertical: Math.max(0, (containerSize.height - cropBox.height) / 2),
      }
    : null;

  return (
    <ThemedView style={styles.container} variant="Transparent">
      <View style={styles.content} onLayout={event => setContainerSize(event.nativeEvent.layout)}>
        {cropBox && renderedImage && overlayInsets ? (
          <>
            <View pointerEvents="none" style={styles.overlayContainer}>
              <View style={[styles.maskTop, { height: overlayInsets.vertical }]} />
              <View style={styles.maskMiddleRow}>
                <View style={[styles.maskSide, { width: overlayInsets.horizontal }]} />
                <View style={[styles.cropGuide, { width: cropBox.width, height: cropBox.height }]} />
                <View style={[styles.maskSide, { width: overlayInsets.horizontal }]} />
              </View>
              <View style={[styles.maskBottom, { height: overlayInsets.vertical }]} />
            </View>

            <View
              style={[styles.cropArea, { width: cropBox.width, height: cropBox.height }]}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <Image
                source={{ uri: image.uri }}
                style={[
                  styles.cropImage,
                  {
                    width: renderedImage.width,
                    height: renderedImage.height,
                    left: (cropBox.width - renderedImage.width) / 2 + offset.x,
                    top: (cropBox.height - renderedImage.height) / 2 + offset.y,
                  },
                ]}
                resizeMode="cover"
              />
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerHeader}>
          <ThemedTxt text={ratio ? `Crop ${ratio[0]}:${ratio[1]}` : 'Adjust Image'} color="white" fontWeight="700" fontSize={18} />
          <ThemedTxt text="Drag to reposition. Use a two-finger pinch to zoom." color="#FFFFFFB8" fontSize={12} />
          <ThemedTxt text={`${zoom.toFixed(2)}x`} color="white" fontWeight="700" fontSize={14} />
        </View>

        <View style={styles.actionRow}>
          <ThemedBtnTxt
            text="Cancel"
            rem={1.5}
            variant="OutLine"
            buttonStyle={styles.secondaryButton}
            onPress={onCancel}
            disabled={isSaving}
            textStyle={{ color: '#FFF' }}
          />
          <ThemedBtnTxt text={isSaving ? 'Cropping...' : 'Use'} rem={1.5} buttonStyle={styles.primaryButton} onPress={handleConfirm} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="white" style={styles.spinner} /> : null}
          </ThemedBtnTxt>
        </View>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskTop: {
    width: '100%',
    backgroundColor: '#00000088',
  },
  maskMiddleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskSide: {
    height: '100%',
    backgroundColor: '#00000088',
  },
  maskBottom: {
    width: '100%',
    backgroundColor: '#00000088',
  },
  cropGuide: {
    borderWidth: 2,
    borderColor: '#FFFFFFCC',
    borderRadius: 12,
  },
  cropArea: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  cropImage: {
    position: 'absolute',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF24',
    backgroundColor: 'black',
  },
  footerHeader: {
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'white',
    backgroundColor: 'transparent',
  },
  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
  },
  spinner: {
    marginRight: 8,
  },
});
