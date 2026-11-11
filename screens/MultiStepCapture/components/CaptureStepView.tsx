import { ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import { QuestionCircle } from '@/components/basic/Icons';
import { MainColor } from '@/constants/Config';
import { NormalizeRem, NormalizeRemFont, type FileType } from '@/constants/Helper';
import { GlobalStyle } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SPECIAL_FEATURES_INDEX, StepConfig, TOTAL_STEPS } from '../constants';

type CaptureStepViewProps = {
  currentStep: number;
  activeStepCount: number;
  progressWidth: number;
  stepIndex: number;
  stepData: StepConfig;
  currentStepImages: FileType[];
  containerBg: string;
  onSelectImage: () => void;
  onRetakeLastImage: () => void;
  onRemoveImage: (index: number) => void;
  onNextStep: () => void;
};

const CONTENT_PADDING = 16;
const IMAGE_MARGIN_TOP = 20;

const CaptureStepView = (props: CaptureStepViewProps) => {
  const { currentStep, progressWidth, stepIndex, stepData, currentStepImages, containerBg, ...o } = props;
  const { onSelectImage, onRetakeLastImage, onRemoveImage, onNextStep } = o;
  const isSpecialFeaturesStep = stepIndex === SPECIAL_FEATURES_INDEX;
  const photoCount = currentStepImages.length;
  const hasPhotos = photoCount > 0;
  const shouldShowSpecialGrid = isSpecialFeaturesStep && photoCount > 1;
  const photoCountLabel = `${photoCount} photo${photoCount === 1 ? '' : 's'} captured for this step`;
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const [infoCardHeight, setInfoCardHeight] = useState(0);
  const isSinglePhotoView = hasPhotos && !shouldShowSpecialGrid;

  const handleContentLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContentSize({ width, height });
  };

  const handleInfoCardLayout = (event: LayoutChangeEvent) => {
    setInfoCardHeight(event.nativeEvent.layout.height);
  };

  const squareImageSize = useMemo(() => {
    if (!contentSize.width || !contentSize.height || !infoCardHeight) return undefined;
    const availableWidth = Math.max(0, contentSize.width - CONTENT_PADDING * 2);
    const availableHeight = Math.max(0, contentSize.height - infoCardHeight - IMAGE_MARGIN_TOP - CONTENT_PADDING * 2);
    return Math.max(120, Math.min(availableWidth, availableHeight));
  }, [contentSize.height, contentSize.width, infoCardHeight]);

  return (
    <>
      <ThemedTxt text={`Step ${currentStep + 1} of ${TOTAL_STEPS} \u2022 Take Photos of the SAME plant.`} variant="Secondary" center fontSize={11} style={GlobalStyle.bMar8} />
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progressWidth}%` }]} />
      </View>

      <View style={styles.content} onLayout={handleContentLayout}>
        <ThemedView style={styles.infoCard} onLayout={handleInfoCardLayout}>
          <View style={styles.infoCardIcon}>
            <ThemedTxt text="!" fontSize={28} bold />
          </View>
          <View style={styles.infoCardInfo}>
            <ThemedTxt text={stepData.info} variant="Secondary" style={[NormalizeRemFont(1.125, 1.625)]} fontWeight="600" />
            {stepData.note && <ThemedTxt text={stepData.note} variant="Secondary" style={[GlobalStyle.tMar8, NormalizeRemFont(0.75, 1.33)]} italic />}
          </View>
        </ThemedView>

        <View
          style={[
            styles.imageContainer,
            shouldShowSpecialGrid && styles.gridPadding,
            isSinglePhotoView && squareImageSize ? { width: squareImageSize, height: squareImageSize } : null,
            { backgroundColor: !hasPhotos ? '#FEFEFE' : containerBg },
          ]}
        >
          {!hasPhotos ? (
            <Image source={stepData.placeholder} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={styles.imageWrapper}>
              {shouldShowSpecialGrid ? (
                <View style={styles.grid}>
                  {currentStepImages.map((img, idx) => (
                    <View key={idx} style={styles.gridItem}>
                      <Image source={{ uri: img.uri }} style={GlobalStyle.flex} resizeMode="cover" />
                      <TouchableOpacity style={styles.removeBtn} onPress={() => onRemoveImage(idx)}>
                        <Ionicons name="close-circle" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.singleImageWrapper}>
                  <Image source={{ uri: currentStepImages[0].uri }} style={styles.previewImage} resizeMode="contain" />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => onRemoveImage(0)}>
                    <Ionicons name="close-circle" size={22} color="red" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
      <View style={styles.footer}>
        {!hasPhotos ? (
          <>
            <ThemedBtnTxt text="Capture" buttonStyle={styles.fullButton} onPress={onSelectImage} rem={1.33} bold>
              <Ionicons name="camera-outline" size={NormalizeRem(1.6)} color="white" style={GlobalStyle.rMar8} />
            </ThemedBtnTxt>
            <ThemedBtnTxt text="Skip this step if not present" buttonStyle={styles.fullButton} onPress={onNextStep} rem={1.33} bold>
              <QuestionCircle size={NormalizeRem(1.6)} fill="white" style={GlobalStyle.rMar8} />
            </ThemedBtnTxt>
          </>
        ) : isSpecialFeaturesStep ? (
          <>
            <ThemedTxt text={photoCountLabel} color={MainColor} center rem={0.875} style={styles.photoCountLabel} />
            <View style={styles.footerRow}>
              <ThemedBtnTxt text="Retake Last" variant="OutLine" buttonStyle={styles.halfButton} onPress={onRetakeLastImage} rem={0.875} />
              <ThemedBtnTxt text="+ Add Another" variant="OutLine" buttonStyle={styles.halfButton} onPress={onSelectImage} rem={0.875} />
            </View>
            <ThemedBtnTxt text="Next" buttonStyle={styles.primaryButton} onPress={onNextStep} rem={0.875} />
          </>
        ) : (
          <>
            <ThemedTxt text={photoCountLabel} color={MainColor} center rem={0.875} style={styles.photoCountLabel} />
            <View style={styles.footerRow}>
              <ThemedBtnTxt text="Retake" variant="OutLine" buttonStyle={styles.halfButton} onPress={onRetakeLastImage} rem={0.875} />
              <ThemedBtnTxt text="Next" buttonStyle={styles.halfButton} onPress={onNextStep} rem={0.875} />
            </View>
          </>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  progressContainer: {
    height: 6,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: MainColor,
  },
  content: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 2,
    borderColor: MainColor,
    padding: 12,
    borderRadius: 14,
    width: '100%',
  },
  infoCardIcon: {
    borderWidth: 2,
    borderColor: MainColor,
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCardInfo: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  imageContainer: {
    width: '100%',
    maxHeight: '100%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: MainColor,
    borderRadius: 20,
    marginTop: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridPadding: {
    padding: 10,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  singleImageWrapper: {
    width: '100%',
    height: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.5%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#EEE',
  },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: MainColor,
  },
  fullButton: {
    flexDirection: 'row',
    height: 48,
    marginBottom: 12,
  },
  photoCountLabel: {
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfButton: {
    flex: 1,
    height: 46,
  },
  primaryButton: {
    height: 46,
    marginTop: 12,
  },
});

export default CaptureStepView;
