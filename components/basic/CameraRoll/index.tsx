import { FileType, toFileType } from '@/constants/Helper';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraFlashKey, StoreManager } from '@/constants/Stores';
import { CameraRatio, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Image, LayoutChangeEvent, Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedBtnTxt } from '../ThemedBtn';
import { ThemedTxt } from '../ThemedTxt';
import { ThemedView } from '../ThemedView';
import { ImageCropper } from './ImageCropper';

export interface CameraRollProps {
  onCapture: (image: FileType) => void | Promise<void>;
  ratio?: [number, number];
  enableBuiltCrop?: boolean;
  skipUseConfirmation?: boolean;
  enableZoom?: boolean;
  closeBeforeCapture?: boolean;
}

type RatioOption = [number, number] | undefined;

const RATIO_OPTIONS: RatioOption[] = [undefined, [1, 1], [4, 3], [16, 9]];
const CONTROL_ICON_SIZE = 28;
const CAPTURE_ICON_SIZE = 60;
// Sits just above the footer row (82px capture button + 20px padding + gap).
const PHONE_CAMERA_BTN_OFFSET = 112;
const ZOOM_SENSITIVITY = 0.35;
const SQUARE_CAPTURE_ZOOM_CROP_COMPENSATION = 0.5;

const isSameRatio = (left?: RatioOption, right?: RatioOption) => {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return left[0] === right[0] && left[1] === right[1];
};

const getRatioLabel = (value?: RatioOption) => {
  if (!value) return 'Free';
  return `${value[0]}:${value[1]}`;
};

const getNativeCameraRatio = (value?: RatioOption) => {
  if (!value) return undefined;
  const label = getRatioLabel(value);
  return label === '1:1' || label === '4:3' || label === '16:9' ? label : undefined;
};

const getPictureSizeRatio = (size: string) => {
  const [width, height] = size.split('x').map(Number);
  if (!width || !height) return null;
  return width / height;
};

const getLargestSquarePictureSize = (sizes: string[]) =>
  sizes
    .filter(size => {
      const ratio = getPictureSizeRatio(size);
      return ratio !== null && Math.abs(ratio - 1) < 0.01;
    })
    .sort((left, right) => {
      const [leftWidth = 0, leftHeight = 0] = left.split('x').map(Number);
      const [rightWidth = 0, rightHeight = 0] = right.split('x').map(Number);
      return rightWidth * rightHeight - leftWidth * leftHeight;
    })[0];

const getEffectiveTargetRatio = (width: number, height: number, ratio: [number, number]) => {
  const isPortrait = height >= width;
  return isPortrait ? ratio[1] / ratio[0] : ratio[0] / ratio[1];
};

const clampZoom = (value: number) => Math.min(1.0, Math.max(0.0, value));
const ZOOM_CHANGE_THRESHOLD = 0.01;
// Max rate at which pinch zoom is forwarded to the native camera (~10 updates/s).
const ZOOM_APPLY_INTERVAL_MS = 100;
// Intermediate crop quality for capture pipeline. The submission pipeline re-encodes to 0.85 JPEG afterwards.
const CAPTURE_CROP_JPEG_QUALITY = 0.92;
type CameraFlashMode = 'off' | 'on';

type CameraPreviewProps = {
  cameraRef: React.RefObject<CameraView | null>;
  cameraStyle: object;
  controlsDisabled: boolean;
  enableZoom: boolean;
  facing: 'back' | 'front';
  flash: CameraFlashMode;
  nativeCameraRatio?: CameraRatio;
  pictureSize?: string;
  ratioGuideStyle: { width: number; height: number } | null;
  syncPictureSize: () => void | Promise<void>;
  onCameraOrientationChange: (orientation: 'portrait' | 'portraitUpsideDown' | 'landscapeLeft' | 'landscapeRight') => void;
  onPreviewLayout: (event: LayoutChangeEvent) => void;
  onZoomChange: (zoom: number) => void;
};

const CameraPreview = React.memo(
  ({
    cameraRef,
    cameraStyle,
    controlsDisabled,
    enableZoom,
    facing,
    flash,
    nativeCameraRatio,
    pictureSize,
    ratioGuideStyle,
    syncPictureSize,
    onCameraOrientationChange,
    onPreviewLayout,
    onZoomChange,
  }: CameraPreviewProps) => {
    // `zoom` is what the native camera receives; `zoomRef` tracks the live pinch value.
    // Pinch events arrive ~60/s. Forwarding each one made the native camera queue
    // zoom (and physical lens-switch) requests faster than it could apply them, so
    // zoom lag grew with every use. Native updates are throttled instead, and the
    // final value is always applied when the pinch ends.
    const [zoom, setZoom] = useState(0);
    const pinchStartZoomRef = useRef(0);
    const zoomRef = useRef(0);
    const appliedZoomRef = useRef(0);
    const lastZoomApplyAtRef = useRef(0);
    const zoomApplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearZoomApplyTimer = useCallback(() => {
      if (zoomApplyTimerRef.current) {
        clearTimeout(zoomApplyTimerRef.current);
        zoomApplyTimerRef.current = null;
      }
    }, []);

    const applyZoom = useCallback(() => {
      clearZoomApplyTimer();
      lastZoomApplyAtRef.current = Date.now();
      const nextZoom = zoomRef.current;
      if (Math.abs(appliedZoomRef.current - nextZoom) < ZOOM_CHANGE_THRESHOLD) return;
      appliedZoomRef.current = nextZoom;
      setZoom(nextZoom);
    }, [clearZoomApplyTimer]);

    React.useEffect(() => clearZoomApplyTimer, [clearZoomApplyTimer]);

    const startZoomGesture = useCallback(() => {
      if (!enableZoom || controlsDisabled) return;
      pinchStartZoomRef.current = zoomRef.current;
    }, [controlsDisabled, enableZoom]);

    const updateZoomGesture = useCallback(
      (scale: number) => {
        if (!enableZoom || controlsDisabled) return;
        const nextZoom = clampZoom(pinchStartZoomRef.current + (scale - 1) * ZOOM_SENSITIVITY);
        if (Math.abs(zoomRef.current - nextZoom) < ZOOM_CHANGE_THRESHOLD) return;
        zoomRef.current = nextZoom;
        onZoomChange(nextZoom);

        const sinceLastApply = Date.now() - lastZoomApplyAtRef.current;
        if (sinceLastApply >= ZOOM_APPLY_INTERVAL_MS) applyZoom();
        else if (!zoomApplyTimerRef.current) zoomApplyTimerRef.current = setTimeout(applyZoom, ZOOM_APPLY_INTERVAL_MS - sinceLastApply);
      },
      [applyZoom, controlsDisabled, enableZoom, onZoomChange],
    );

    const endZoomGesture = useCallback(() => {
      pinchStartZoomRef.current = zoomRef.current;
      applyZoom();
    }, [applyZoom]);

    const pinchGesture = React.useMemo(
      () =>
        Gesture.Pinch()
          .enabled(enableZoom && !controlsDisabled)
          .runOnJS(true)
          .onStart(startZoomGesture)
          .onUpdate(event => updateZoomGesture(event.scale))
          .onEnd(endZoomGesture)
          .onFinalize(endZoomGesture),
      [controlsDisabled, enableZoom, endZoomGesture, startZoomGesture, updateZoomGesture],
    );

    return (
      <GestureDetector gesture={pinchGesture}>
        <View style={styles.previewContainer} onLayout={onPreviewLayout}>
          <View style={[styles.cameraPreviewContainer, ratioGuideStyle ?? styles.freeCameraPreview]}>
            <CameraView
              style={cameraStyle}
              facing={facing}
              zoom={zoom}
              flash={flash}
              ratio={nativeCameraRatio}
              pictureSize={pictureSize}
              ref={cameraRef}
              onCameraReady={syncPictureSize}
              responsiveOrientationWhenOrientationLocked
              onResponsiveOrientationChanged={event => onCameraOrientationChange(event.orientation)}
            />
          </View>
        </View>
      </GestureDetector>
    );
  },
);

CameraPreview.displayName = 'CameraPreview';

export const CameraRoll: React.FC<CameraRollProps> = props => {
  const { onCapture, ratio, enableBuiltCrop = true, skipUseConfirmation = true, enableZoom = true, closeBeforeCapture = false } = props;
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [camPic, setCamPic] = useState<FileType | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });
  const [cameraOrientation, setCameraOrientation] = useState<'portrait' | 'portraitUpsideDown' | 'landscapeLeft' | 'landscapeRight'>('portrait');
  const [isProcessingCapture, setProcessingCapture] = useState(false);
  const [activeRatio, setActiveRatio] = useState<RatioOption>(ratio);
  const [flash, setFlash] = useState<CameraFlashMode>('off');
  const [pictureSize, setPictureSize] = useState<string | undefined>();
  const [cropSource, setCropSource] = useState<{ image: FileType; width: number; height: number; ratio?: [number, number] } | null>(null);
  const zoomRef = useRef(0);
  const hasRatio = !!activeRatio && activeRatio[0] > 0 && activeRatio[1] > 0;
  const isSquareRatio = activeRatio?.[0] === 1 && activeRatio?.[1] === 1;
  const nativeCameraRatio = Platform.OS === 'android' && !pictureSize ? (getNativeCameraRatio(activeRatio) as CameraRatio | undefined) : undefined;
  const rotationDeg = useSharedValue(0);
  const controlsDisabled = isProcessingCapture;

  React.useEffect(() => {
    const nextRotation =
      cameraOrientation === 'landscapeLeft' ? 90 : cameraOrientation === 'landscapeRight' ? -90 : cameraOrientation === 'portraitUpsideDown' ? 180 : 0;

    rotationDeg.value = withTiming(nextRotation, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [cameraOrientation, rotationDeg]);

  const iconRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationDeg.value}deg` }],
  }));

  const cropToRatio = async (
    file: FileType,
    sourceSize?: {
      width?: number | null;
      height?: number | null;
    },
    captureZoom = 0,
  ) => {
    if (!hasRatio || !activeRatio) return file;

    const originalWidth = sourceSize?.width ?? 0;
    const originalHeight = sourceSize?.height ?? 0;

    if (!originalWidth || !originalHeight) return file;

    const targetRatio = getEffectiveTargetRatio(originalWidth, originalHeight, activeRatio);
    const originalRatio = originalWidth / originalHeight;

    let cropWidth = originalWidth;
    let cropHeight = originalHeight;

    if (originalRatio > targetRatio) cropWidth = Math.round(originalHeight * targetRatio);
    else cropHeight = Math.round(originalWidth / targetRatio);

    if (isSquareRatio && captureZoom > 0) {
      const compensationScale = 1 + captureZoom * SQUARE_CAPTURE_ZOOM_CROP_COMPENSATION;
      cropWidth = Math.round(cropWidth / compensationScale);
      cropHeight = Math.round(cropHeight / compensationScale);
    }

    const originX = Math.max(0, Math.round((originalWidth - cropWidth) / 2));
    const originY = Math.max(0, Math.round((originalHeight - cropHeight) / 2));

    const cropped = await ImageManipulator.manipulateAsync(file.uri, [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }], {
      compress: CAPTURE_CROP_JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return toFileType({ uri: cropped.uri, width: cropped.width, height: cropped.height });
  };

  React.useEffect(() => {
    setActiveRatio(ratio);
  }, [ratio]);

  React.useEffect(() => {
    let isMounted = true;

    void (async () => {
      const storedFlash = await StoreManager.getItem<CameraFlashMode>(CameraFlashKey);
      if (!isMounted || (storedFlash !== 'on' && storedFlash !== 'off')) return;
      setFlash(storedFlash);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    setPictureSize(undefined);
  }, [facing, activeRatio]);

  const syncPictureSize = useCallback(async () => {
    if (Platform.OS !== 'android' || !isSquareRatio || !cameraRef.current) {
      setPictureSize(undefined);
      return;
    }

    const sizes = await cameraRef.current.getAvailablePictureSizesAsync();
    setPictureSize(getLargestSquarePictureSize(sizes));
  }, [isSquareRatio]);

  const updateCurrentZoom = useCallback((nextZoom: number) => {
    zoomRef.current = nextZoom;
  }, []);

  if (!permission) return <View />;

  if (!permission.granted) {
    const cameraBlocked = !permission.granted && permission.canAskAgain === false;

    return (
      <ThemedView style={styles.container}>
        <View style={[styles.btnCont, styles.headerCont, { top: insets.top + 10 }]}>
          <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.permissionContainer}>
          <ThemedTxt text="No access to camera" />
          <ThemedBtnTxt
            buttonStyle={styles.permissionBtn}
            text={cameraBlocked ? 'Open Settings' : 'Grant Camera Permission'}
            onPress={async () => {
              if (cameraBlocked) {
                await Linking.openSettings();
                return;
              }

              await requestPermission();
            }}
          />
        </View>
      </ThemedView>
    );
  }

  const completeCapture = async (file: FileType) => {
    if (closeBeforeCapture) {
      router.back();
      setTimeout(() => {
        void onCapture(file);
      }, 0);
      return;
    }

    await onCapture(file);
    router.back();
  };

  const completeCapturedFile = async (file: FileType) => {
    if (skipUseConfirmation) {
      await completeCapture(file);
      return;
    }

    setCamPic(file);
    setImageUri(file.uri);
  };

  const takePicture = async () => {
    if (!cameraRef.current || isProcessingCapture) return;

    setProcessingCapture(true);
    try {
      const data = await cameraRef.current.takePictureAsync();
      if (!data) return;

      const originalFile = toFileType(data);
      const file = await cropToRatio(originalFile, data, zoomRef.current);
      await completeCapturedFile(file);
    } finally {
      setProcessingCapture(false);
    }
  };

  const onUse = () => {
    if (camPic) {
      void completeCapture(camPic);
    }
  };

  const onCropCapturedImage = () => {
    if (!camPic) return;
    const captured = camPic as FileType & { width?: number; height?: number };
    setCropSource({
      image: camPic,
      width: captured.width ?? previewSize.width,
      height: captured.height ?? previewSize.height,
      ratio: activeRatio,
    });
  };

  const usesNativeLibraryCrop = !enableBuiltCrop;

  const pickImage = async () => {
    let permissionResponse = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (permissionResponse.status !== 'granted' && permissionResponse.canAskAgain) {
      permissionResponse = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    const libraryGranted = permissionResponse.status === 'granted';

    if (!libraryGranted) {
      if (permissionResponse.canAskAgain === false) {
        Alert.alert('Library permission needed', 'To select an image from your library, enable photo library access in the app settings.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ]);
      }

      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: usesNativeLibraryCrop && hasRatio,
      aspect: usesNativeLibraryCrop ? activeRatio : undefined,
      quality: 1,
    });

    handlePickedImage(result);
  };

  // Shared by the photo library and the phone's own camera app: either hand the
  // image over directly (native crop) or open the built-in cropper at the active ratio.
  const handlePickedImage = (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const file = toFileType(asset);

    if (usesNativeLibraryCrop) {
      void completeCapture(file);
      return;
    }

    setCropSource({
      image: file,
      width: asset.width ?? previewSize.width,
      height: asset.height ?? previewSize.height,
      ratio: activeRatio,
    });
  };

  // Opens the phone's built-in camera app. Users get its tap-to-focus, macro mode,
  // zoom and full resolution, which the embedded camera view cannot match on many
  // devices. The photo returns here and goes through the same crop flow as a library pick.
  const openPhoneCamera = async () => {
    let permissionResponse = await ImagePicker.getCameraPermissionsAsync();
    if (!permissionResponse.granted && permissionResponse.canAskAgain) {
      permissionResponse = await ImagePicker.requestCameraPermissionsAsync();
    }

    if (!permissionResponse.granted) {
      if (permissionResponse.canAskAgain === false) {
        Alert.alert('Camera permission needed', 'To use your phone camera, enable camera access in the app settings.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ]);
      }
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: usesNativeLibraryCrop && hasRatio,
        aspect: usesNativeLibraryCrop ? activeRatio : undefined,
        quality: 1,
        cameraType: facing === 'front' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      });
      handlePickedImage(result);
    } catch (error) {
      Alert.alert('Camera unavailable', "Couldn't open your phone camera. Please use the in-app camera or pick a photo from your library.");
    }
  };

  const resetImage = () => {
    setImageUri(null);
    setCamPic(null);
    setProcessingCapture(false);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };
  const toggleFlash = () => {
    setFlash(current => {
      const nextFlash = current === 'off' ? 'on' : 'off';
      void StoreManager.setItem(CameraFlashKey, nextFlash);
      return nextFlash;
    });
  };
  const cycleRatio = () => {
    setActiveRatio(current => {
      const currentIndex = RATIO_OPTIONS.findIndex(option => isSameRatio(option, current));
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % RATIO_OPTIONS.length : 0;
      return RATIO_OPTIONS[nextIndex];
    });
  };
  const onPreviewLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPreviewSize({ width, height });
  };
  const ratioGuideStyle = (() => {
    if (!hasRatio || !activeRatio || !previewSize.width || !previewSize.height) return null;
    const isPortraitPreview = previewSize.height >= previewSize.width;
    const targetRatio = getEffectiveTargetRatio(previewSize.width, previewSize.height, activeRatio);

    if (isPortraitPreview) {
      const guideWidth = previewSize.width;
      return { width: guideWidth, height: guideWidth / targetRatio };
    }

    const guideHeight = previewSize.height;
    return { width: guideHeight * targetRatio, height: guideHeight };
  })();
  const overlayMaskStyle = (() => {
    if (!ratioGuideStyle) return null;
    const horizontalInset = Math.max(0, (previewSize.width - ratioGuideStyle.width) / 2);
    const verticalInset = Math.max(0, (previewSize.height - ratioGuideStyle.height) / 2);
    return {
      top: verticalInset,
      bottom: verticalInset,
      left: horizontalInset,
      right: horizontalInset,
    };
  })();

  if (cropSource) {
    return (
      <ImageCropper
        image={cropSource.image}
        sourceWidth={cropSource.width}
        sourceHeight={cropSource.height}
        ratio={cropSource.ratio}
        onCancel={() => setCropSource(null)}
        onConfirm={file => {
          setCropSource(null);
          void completeCapture(file);
        }}
      />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.btnCont, styles.headerCont, { top: insets.top }]}>
        <Animated.View style={iconRotationStyle}>
          <TouchableOpacity style={styles.btn} onPress={cycleRatio} disabled={controlsDisabled}>
            <ThemedTxt text={getRatioLabel(activeRatio)} color="white" fontSize={14} fontWeight="700" />
          </TouchableOpacity>
        </Animated.View>
        {!imageUri ? (
          <Animated.View style={iconRotationStyle}>
            <TouchableOpacity
              style={styles.btn}
              onPress={toggleFlash}
              disabled={controlsDisabled}
            >
              <MaterialIcons name={flash === 'on' ? 'flash-on' : 'flash-off'} size={CONTROL_ICON_SIZE} color="white" />
            </TouchableOpacity>
          </Animated.View>
        ) : null}
        <Animated.View style={iconRotationStyle}>
          <TouchableOpacity style={styles.btn} onPress={() => router.back()} disabled={controlsDisabled}>
            <MaterialIcons name="close" size={CONTROL_ICON_SIZE} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
      {skipUseConfirmation && isProcessingCapture ? (
        <View pointerEvents="auto" style={styles.processingOverlay}>
          <ThemedTxt text="Processing..." color="white" fontSize={18} fontWeight="700" center />
        </View>
      ) : null}
      {imageUri ? (
        <View style={styles.previewContainer} onLayout={onPreviewLayout}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
        </View>
      ) : (
        <CameraPreview
          cameraRef={cameraRef}
          cameraStyle={StyleSheet.absoluteFill}
          controlsDisabled={controlsDisabled}
          enableZoom={enableZoom}
          facing={facing}
          flash={flash}
          nativeCameraRatio={nativeCameraRatio}
          pictureSize={pictureSize}
          ratioGuideStyle={ratioGuideStyle}
          syncPictureSize={syncPictureSize}
          onCameraOrientationChange={setCameraOrientation}
          onPreviewLayout={onPreviewLayout}
          onZoomChange={updateCurrentZoom}
        />
      )}
      {hasRatio && ratioGuideStyle && !imageUri && (
        <View pointerEvents="none" style={styles.overlayContainer}>
          <View style={[styles.maskTop, { height: overlayMaskStyle?.top ?? 0 }]} />
          <View style={styles.maskMiddleRow}>
            <View style={[styles.maskSide, { width: overlayMaskStyle?.left ?? 0 }]} />
            <View style={[styles.ratioGuide, ratioGuideStyle]} />
            <View style={[styles.maskSide, { width: overlayMaskStyle?.right ?? 0 }]} />
          </View>
          <View style={[styles.maskBottom, { height: overlayMaskStyle?.bottom ?? 0 }]} />
        </View>
      )}
      {!imageUri ? (
        <View style={[styles.phoneCameraCont, { bottom: insets.bottom + PHONE_CAMERA_BTN_OFFSET }]} pointerEvents="box-none">
          <TouchableOpacity style={styles.phoneCameraBtn} onPress={openPhoneCamera} disabled={controlsDisabled}>
            <MaterialIcons name="photo-camera" size={20} color="white" />
            <ThemedTxt text="Use Phone Camera" color="white" fontSize={14} fontWeight="700" style={styles.phoneCameraTxt} />
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={[styles.btnCont, styles.footerCont, { bottom: insets.bottom }]}>
        {skipUseConfirmation || !imageUri ? (
          <>
            <Animated.View style={iconRotationStyle}>
              <TouchableOpacity style={styles.btn} onPress={toggleCameraFacing} disabled={controlsDisabled}>
                <MaterialIcons name="flip-camera-ios" size={CONTROL_ICON_SIZE} color="white" />
              </TouchableOpacity>
            </Animated.View>
            <Animated.View style={iconRotationStyle}>
              <TouchableOpacity style={[styles.btn, styles.captureBtn]} onPress={takePicture} disabled={controlsDisabled}>
                <MaterialIcons name="camera" size={CAPTURE_ICON_SIZE} color="white" />
              </TouchableOpacity>
            </Animated.View>
            <Animated.View style={iconRotationStyle}>
              <TouchableOpacity style={styles.btn} onPress={pickImage} disabled={controlsDisabled}>
                <MaterialIcons name="photo-library" size={CONTROL_ICON_SIZE} color="white" />
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          <>
            <ThemedBtnTxt buttonStyle={styles.btn} text="Take Another" onPress={resetImage} disabled={controlsDisabled} enabled={!controlsDisabled} />
            <ThemedBtnTxt buttonStyle={styles.btn} text="Crop" onPress={onCropCapturedImage} disabled={controlsDisabled} enabled={!controlsDisabled} />
            <ThemedBtnTxt
              buttonStyle={styles.btn}
              text={isProcessingCapture ? 'Processing...' : 'Use'}
              onPress={onUse}
              disabled={controlsDisabled}
              enabled={!controlsDisabled}
            />
          </>
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
    backgroundColor: 'black',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraPreviewContainer: {
    overflow: 'hidden',
  },
  freeCameraPreview: {
    width: '100%',
    height: '100%',
  },
  previewImage: {
    flex: 1,
    backgroundColor: 'black',
  },
  btnCont: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 1,
  },
  headerCont: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  footerCont: {
    padding: 20,
    paddingTop: 0,
  },
  btn: {
    minWidth: 62,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000a0',
    borderRadius: 12,
    zIndex: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  captureBtn: {
    minWidth: 82,
    minHeight: 82,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  phoneCameraCont: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  phoneCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000a0',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFFFFF66',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  phoneCameraTxt: {
    marginLeft: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionBtn: {
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#000000A0',
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
  ratioGuide: {
    borderWidth: 2,
    borderColor: '#FFFFFFCC',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
});
