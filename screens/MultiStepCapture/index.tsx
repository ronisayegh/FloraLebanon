import { ModalWithX, SafeInsetsWrapper, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import { FileType } from '@/constants/Helper';
import { useDefaultContext } from '@/hooks';
import { ResolveVillageByCoordinates } from '@/services';
import { submitSubmissionWithQueue } from '@/services/submission-queue';
import { GlobalStyle } from '@/styles';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import CaptureStepView from './components/CaptureStepView';
import { MetadataForm, SubmissionMetadata } from './components/MetadataForm';
import StepHeader from './components/StepHeader';
import SubmitLoadingView from './components/SubmitLoadingView';
import SubmitResultView from './components/SubmitResultView';
import { SPECIAL_FEATURES_INDEX, STEPS, TOTAL_STEPS } from './constants';
import { SubmitResultState } from './types';

const createEmptyCapturedImages = () => Array.from({ length: TOTAL_STEPS }, () => [] as FileType[]);
const LOCATION_FALLBACK_COORDS = { latitude: 0, longitude: 0 };
const LOCATION_TIMEOUT_MS = 10000;

const parseMissingStepNumbers = (value: string | undefined) => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;

    return parsed.map(item => Number(item)).filter((item): item is number => Number.isInteger(item) && item >= 1 && item <= TOTAL_STEPS);
  } catch (_error) {
    return null;
  }
};

export default function MultiStepCaptureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ plantId?: string; missionCode?: string; missingStepNumbers?: string }>();
  const { ThemeContext, RandomContext, SessionContext, SubmissionQueueContext } = useDefaultContext();
  const Theme = ThemeContext.value;
  const plantId = typeof params.plantId === 'string' ? params.plantId : undefined;
  const missionCode = typeof params.missionCode === 'string' ? params.missionCode : undefined;
  const missingStepNumbers = typeof params.missingStepNumbers === 'string' ? parseMissingStepNumbers(params.missingStepNumbers) : null;

  const [currentStep, setCurrentStep] = useState(0);
  const [showMetadata, setShowMetadata] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [capturedImages, setCapturedImages] = useState<FileType[][]>(createEmptyCapturedImages);
  const [submitStage, setSubmitStage] = useState<'editing' | 'submitting' | 'result'>('editing');
  const [submitResult, setSubmitResult] = useState<SubmitResultState | null>(null);
  const [collectedAt, setCollectedAt] = useState(() => new Date().toISOString());
  const [metadataLocation, setMetadataLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [resolvedVillage, setResolvedVillage] = useState<{ id: string; nameEn: string; nameFr: string | null; nameAr: string | null } | null>(null);
  const [isFetchingLocation, setFetchingLocation] = useState(false);
  const [isResolvingVillage, setResolvingVillage] = useState(false);
  const [pendingLocationFallbackMessage, setPendingLocationFallbackMessage] = useState<string | null>(null);
  const villageRequestIdRef = useRef(0);
  const hasAttemptedLocationPrefetchRef = useRef(false);
  const [locationPermissionState, setLocationPermissionState] = useState<{
    status: Location.PermissionStatus;
    canAskAgain: boolean;
  } | null>(null);
  const [infoModal, setInfoModal] = useState<{
    title: string;
    message: string;
    primaryLabel: string;
    onPrimary: () => void | Promise<void>;
    secondaryLabel?: string;
    onSecondary?: () => void;
  } | null>(null);

  const activeStepIndices = useMemo(() => {
    if (missionCode !== 'MISSING_PLANT_PHOTOS' || !missingStepNumbers || missingStepNumbers.length === 0) {
      return STEPS.map((_, index) => index);
    }

    return Array.from(new Set(missingStepNumbers))
      .sort((a, b) => a - b)
      .map(stepNumber => stepNumber - 1);
  }, [missionCode, missingStepNumbers]);

  const activeStepCount = activeStepIndices.length;
  const stepIndex = activeStepIndices[currentStep] ?? 0;
  const stepData = STEPS[stepIndex]!;
  const currentStepImages = capturedImages[stepIndex] || [];
  const progressWidth = activeStepCount > 0 ? ((currentStep + 1) / activeStepCount) * 100 : 100;
  const resolvedVillageName = useMemo(() => resolvedVillage?.nameEn || resolvedVillage?.nameAr || resolvedVillage?.nameFr || null, [resolvedVillage]);
  const closeInfoModal = useCallback(() => setInfoModal(null), []);
  const isFallbackLocation = useMemo(
    () => metadataLocation?.latitude === LOCATION_FALLBACK_COORDS.latitude && metadataLocation?.longitude === LOCATION_FALLBACK_COORDS.longitude,
    [metadataLocation],
  );

  const useFallbackLocation = useCallback(() => {
    setMetadataLocation(LOCATION_FALLBACK_COORDS);
    setResolvedVillage(null);
    setResolvingVillage(false);
    setPendingLocationFallbackMessage(null);
    villageRequestIdRef.current += 1;
  }, []);

  const openLocationFallbackModal = useCallback(
    (message?: string) => {
      setInfoModal({
        title: 'Location unavailable',
        message:
          message ||
          'We could not detect your location. You can still submit this observation, but it will be saved with coordinates 0,0 and no village will receive credit for it.',
        primaryLabel: 'OK',
        onPrimary: () => {
          useFallbackLocation();
          closeInfoModal();
        },
      });
    },
    [closeInfoModal, useFallbackLocation],
  );

  const openSettingsModal = useCallback(() => {
    setInfoModal({
      title: 'Enable location in Settings',
      message:
        'Location access is disabled for the app. Open your phone settings and enable location permission so we can detect coordinates and suggest the village.',
      primaryLabel: 'Open Settings',
      onPrimary: async () => {
        closeInfoModal();
        await Linking.openSettings();
      },
      secondaryLabel: 'Close',
      onSecondary: closeInfoModal,
    });
  }, [closeInfoModal]);

  const getCurrentPositionWithTimeout = useCallback(async () => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      return await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Location detection timed out after 10 seconds.')), LOCATION_TIMEOUT_MS);
        }),
      ]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, []);

  const openMissingPhotosModal = useCallback(() => {
    setInfoModal({
      title: 'At least one image is required',
      message: 'Add at least one image before submitting this observation.',
      primaryLabel: 'OK',
      onPrimary: closeInfoModal,
    });
  }, [closeInfoModal]);

  const resolveVillagePreview = useCallback(async (latitude: number, longitude: number) => {
    const requestId = villageRequestIdRef.current + 1;
    villageRequestIdRef.current = requestId;
    setResolvingVillage(true);

    try {
      const response = await ResolveVillageByCoordinates(latitude, longitude);
      if (requestId !== villageRequestIdRef.current || !response.success || !response.data) {
        if (requestId === villageRequestIdRef.current && response.success) setResolvedVillage(null);
        return;
      }

      setResolvedVillage({
        id: response.data.id,
        nameEn: response.data.nameEn,
        nameFr: response.data.nameFr,
        nameAr: response.data.nameAr,
      });
    } catch (_error) {
      if (requestId === villageRequestIdRef.current) setResolvedVillage(null);
    } finally {
      if (requestId === villageRequestIdRef.current) setResolvingVillage(false);
    }
  }, []);

  const requestCurrentLocation = useCallback(
    async (interactive = false) => {
      if (isFetchingLocation) return;

      setFetchingLocation(true);
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        setLocationPermissionState({ status: permission.status, canAskAgain: permission.canAskAgain });

        if (permission.status !== 'granted') {
          const message =
            'Location permission was not granted. You can still submit this observation, but it will be saved with coordinates 0,0 and no village will receive credit for it.';
          if (interactive) {
            openLocationFallbackModal(message);
          } else {
            setPendingLocationFallbackMessage(message);
          }
          return;
        }

        const position = await getCurrentPositionWithTimeout();
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setMetadataLocation(nextLocation);
        setPendingLocationFallbackMessage(null);
        void resolveVillagePreview(nextLocation.latitude, nextLocation.longitude);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'We could not determine your location right now.';
        const fallbackMessage = `${message} You can still submit this observation, but it will be saved with coordinates 0,0 and no village will receive credit for it.`;
        if (interactive) {
          openLocationFallbackModal(fallbackMessage);
        } else {
          setPendingLocationFallbackMessage(fallbackMessage);
        }
      } finally {
        setFetchingLocation(false);
      }
    },
    [getCurrentPositionWithTimeout, isFetchingLocation, openLocationFallbackModal, resolveVillagePreview],
  );

  useEffect(() => {
    if (hasAttemptedLocationPrefetchRef.current || metadataLocation || isFetchingLocation) return;
    hasAttemptedLocationPrefetchRef.current = true;
    void requestCurrentLocation(false);
  }, [isFetchingLocation, metadataLocation, requestCurrentLocation]);

  useEffect(() => {
    if (!showMetadata || metadataLocation || isFetchingLocation || !pendingLocationFallbackMessage || infoModal) return;
    openLocationFallbackModal(pendingLocationFallbackMessage);
  }, [infoModal, isFetchingLocation, metadataLocation, openLocationFallbackModal, pendingLocationFallbackMessage, showMetadata]);

  const handleLocationInfoAction = useCallback(() => {
    if (locationPermissionState && !locationPermissionState.canAskAgain) {
      openSettingsModal();
      return;
    }

    void requestCurrentLocation(true);
  }, [locationPermissionState, openSettingsModal, requestCurrentLocation]);

  const locationInfo = useMemo(() => {
    if (isFetchingLocation) return { text: 'Detecting your coordinates in the background...' };
    if (isFallbackLocation) return { text: 'Location was unavailable. This observation will be submitted with coordinates 0,0.' };
    if (metadataLocation) return { text: 'Coordinates were requested automatically when this flow opened. Use the button if you want to retry.' };
    if (locationPermissionState?.status !== 'granted') {
      if (locationPermissionState?.canAskAgain === false)
        return {
          text: 'Location permission is disabled for the app, so we cannot detect your coordinates yet.',
          actionLabel: 'Open Settings',
        };

      return {
        text: 'Location permission is needed to detect your coordinates.',
        actionLabel: 'Allow Location',
      };
    }

    return { text: 'Coordinates are requested automatically in the background when this flow opens.' };
  }, [isFallbackLocation, isFetchingLocation, locationPermissionState, metadataLocation]);

  const villageInfo = useMemo(() => {
    if (isResolvingVillage) return { text: 'Trying to match your coordinates to a village...' };
    if (isFallbackLocation) return { text: 'No village will be assigned or credited because location was unavailable.' };
    if (resolvedVillageName) return { text: 'This is a preview only. The server will verify it again when you submit.' };
    if (locationPermissionState?.status !== 'granted') {
      if (locationPermissionState?.canAskAgain === false)
        return {
          text: 'Village preview depends on location access, which is currently disabled for the app.',
          actionLabel: 'Open Settings',
        };

      return {
        text: 'Village preview will appear after location access is granted.',
        actionLabel: 'Allow Location',
      };
    }

    if (metadataLocation) return { text: 'No village match yet. Submission can still continue and the server will try again on submit.' };

    return { text: 'Village preview will appear after your location is available.' };
  }, [isFallbackLocation, isResolvingVillage, locationPermissionState, metadataLocation, resolvedVillageName]);

  const openCameraRollForStep = useCallback(
    (mode: 'append' | 'replace') => {
      const updateImage = (file: FileType) => {
        setCapturedImages(currentImages => {
          const nextImages = currentImages.map(images => [...images]);
          const stepImages = nextImages[stepIndex] ?? [];

          if (stepIndex === SPECIAL_FEATURES_INDEX && mode === 'append') nextImages[stepIndex] = [...stepImages, file];
          else if (stepIndex === SPECIAL_FEATURES_INDEX && stepImages.length > 0) nextImages[stepIndex] = [...stepImages.slice(0, -1), file];
          else nextImages[stepIndex] = [file];

          return nextImages;
        });
      };

      RandomContext.Set({ ...RandomContext.value, TempCameraRoll: { onCapture: updateImage, ratio: [1, 1], skipUseConfirmation: true } });
      router.push('/Modals/CameraRoll');
    },
    [RandomContext, router, stepIndex],
  );

  const handleSelectImage = useCallback(() => {
    openCameraRollForStep(stepIndex === SPECIAL_FEATURES_INDEX ? 'append' : 'replace');
  }, [openCameraRollForStep, stepIndex]);

  const handleRetakeLastImage = useCallback(() => {
    openCameraRollForStep('replace');
  }, [openCameraRollForStep]);

  const removeImage = (index: number) => {
    const nextImages = [...capturedImages];
    nextImages[stepIndex] = nextImages[stepIndex].filter((_, i) => i !== index);
    setCapturedImages(nextImages);
  };

  const nextStep = () => {
    if (currentStep < activeStepCount - 1) setCurrentStep(prev => prev + 1);
    else setShowMetadata(true);
  };

  const resetFlow = () => {
    setCurrentStep(0);
    setShowMetadata(false);
    setSubmitting(false);
    setCapturedImages(createEmptyCapturedImages());
    setSubmitStage('editing');
    setSubmitResult(null);
    setCollectedAt(new Date().toISOString());
  };

  const prevStep = () => {
    if (submitStage === 'result') {
      setSubmitStage('editing');
      setSubmitResult(null);
      setShowMetadata(true);
    } else if (showMetadata) setShowMetadata(false);
    else if (currentStep > 0) setCurrentStep(prev => prev - 1);
    else router.back();
  };

  const handleSubmit = async (data: SubmissionMetadata) => {
    const flattenedPhotos = capturedImages.flatMap((images, imageStepIndex) =>
      images.map(image => ({
        image,
        stepNumber: imageStepIndex + 1,
        stepTitle: STEPS[imageStepIndex]?.title.replaceAll('-', ' - '),
      })),
    );

    if (flattenedPhotos.length === 0) {
      openMissingPhotosModal();
      return;
    }

    setSubmitting(true);
    setSubmitStage('submitting');

    try {
      const result = await submitSubmissionWithQueue(
        {
          latitude: data.latitude,
          longitude: data.longitude,
          note: data.notes,
          villageId: data.villageId,
          plantId,
          missionCode: missionCode === 'MISSING_PLANT_PHOTOS' ? missionCode : undefined,
          collectedAt,
          photoSteps: flattenedPhotos.map(photo => ({ stepNumber: photo.stepNumber, stepTitle: photo.stepTitle })),
          images: flattenedPhotos.map(photo => photo.image),
        },
        SessionContext.value,
      );

      await SubmissionQueueContext.refreshQueue();

      if (result.status === 'success') {
        setSubmitResult({
          kind: 'success',
          title: 'Your data has been sent successfully!',
          message: 'Observation saved to %My Submissions%',
          detailRows: [
            { label: 'Field Code', value: result.response.fieldCode },
            { label: 'Date', value: new Date(result.response.submittedAt || result.response.createdAt || new Date().toISOString()).toLocaleDateString() },
            { label: 'Location', value: `${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}` },
            { label: 'Total Images', value: `${flattenedPhotos.length} ${flattenedPhotos.length === 1 ? 'photo' : 'photos'}` },
          ],
        });
      } else if (result.status === 'queued') {
        setSubmitResult({
          kind: 'queued',
          title: 'Observation saved to queue',
          message: 'Observation saved to %queue%. ' + result.item.reason.message,
          queueReasonCode: result.item.reason.code,
          detailRows: [
            { label: 'Queue ID', value: result.item.id },
            { label: 'Queued At', value: new Date(result.item.updatedAt).toLocaleString() },
            { label: 'Reason', value: result.item.reason.message },
            { label: 'Total Images', value: `${flattenedPhotos.length} ${flattenedPhotos.length === 1 ? 'photo' : 'photos'}` },
          ],
        });
      } else if (result.status === 'blocked') {
        setSubmitResult({
          kind: 'error',
          title: 'Submission failed',
          message: result.reason.message,
          detailRows: [
            { label: 'Reason', value: result.reason.message },
            { label: 'Total Images', value: `${flattenedPhotos.length} ${flattenedPhotos.length === 1 ? 'photo' : 'photos'}` },
          ],
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit the observation right now.';
      setSubmitResult({
        kind: 'error',
        title: 'Submission failed',
        message,
        detailRows: [
          { label: 'Reason', value: message },
          { label: 'Total Images', value: `${flattenedPhotos.length} ${flattenedPhotos.length === 1 ? 'photo' : 'photos'}` },
        ],
      });
    } finally {
      setSubmitting(false);
      setSubmitStage('result');
    }
  };

  if (submitStage === 'submitting') return <SubmitLoadingView />;
  if (submitStage === 'result' && submitResult) return <SubmitResultView submitResult={submitResult} onBack={prevStep} onReset={resetFlow} />;

  return (
    <SafeInsetsWrapper>
      <ThemedView style={GlobalStyle.flex} variant="Container">
        <StepHeader showMetadata={showMetadata} stepData={stepData} onBack={prevStep} onClose={() => router.back()} />
        {!showMetadata ? (
          <CaptureStepView
            currentStep={currentStep}
            activeStepCount={activeStepCount}
            progressWidth={progressWidth}
            stepIndex={stepIndex}
            stepData={stepData}
            currentStepImages={currentStepImages}
            containerBg={Theme.containerBg}
            onSelectImage={handleSelectImage}
            onRetakeLastImage={handleRetakeLastImage}
            onRemoveImage={removeImage}
            onNextStep={nextStep}
          />
        ) : (
          <MetadataForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            latitude={metadataLocation?.latitude ?? null}
            longitude={metadataLocation?.longitude ?? null}
            resolvedVillageId={resolvedVillage?.id ?? null}
            resolvedVillageName={resolvedVillageName}
            isFetchingLocation={isFetchingLocation}
            isResolvingVillage={isResolvingVillage}
            onRefreshLocation={() => {
              setResolvedVillage(null);
              void requestCurrentLocation(true);
            }}
            locationInfoText={locationInfo.text}
            locationActionLabel={locationInfo.actionLabel}
            onLocationActionPress={locationInfo.actionLabel ? handleLocationInfoAction : undefined}
            villageInfoText={villageInfo.text}
            villageActionLabel={villageInfo.actionLabel}
            onVillageActionPress={villageInfo.actionLabel ? handleLocationInfoAction : undefined}
          />
        )}
        <ModalWithX isVisible={Boolean(infoModal)} closeModal={closeInfoModal} position="middle" style={styles.infoModal} innerStyle={styles.infoModalInner}>
          {infoModal ? (
            <View style={styles.infoModalContent}>
              <ThemedTxt text={infoModal.title} rem={2} fontWeight="700" center style={styles.infoModalTitle} />
              <ThemedTxt text={infoModal.message} rem={1.25} variant="Secondary" center style={styles.infoModalMessage} />
              <View style={styles.infoModalActions}>
                {infoModal.secondaryLabel ? (
                  <ThemedBtnTxt
                    text={infoModal.secondaryLabel}
                    variant="OutLine"
                    buttonStyle={styles.infoModalSecondaryBtn}
                    onPress={infoModal.onSecondary ?? closeInfoModal}
                    rem={1.5}
                  />
                ) : null}
                <ThemedBtnTxt text={infoModal.primaryLabel} buttonStyle={styles.infoModalPrimaryBtn} rem={1.5} onPress={() => void infoModal.onPrimary()} />
              </View>
            </View>
          ) : null}
        </ModalWithX>
      </ThemedView>
    </SafeInsetsWrapper>
  );
}

const styles = StyleSheet.create({
  infoModal: { padding: 20 },
  infoModalInner: { alignItems: 'stretch', borderRadius: 18 },
  infoModalContent: { paddingHorizontal: 20, paddingVertical: 24 },
  infoModalTitle: { marginBottom: 12 },
  infoModalMessage: { lineHeight: 20 },
  infoModalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  infoModalPrimaryBtn: { flex: 1, minHeight: 48 },
  infoModalSecondaryBtn: { flex: 1, minHeight: 48 },
});
