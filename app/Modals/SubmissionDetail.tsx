import type { Submission, SubmissionStatus } from '@/@Types';
import { Card, ImgViewer, SafeInsetsWrapper, Scroll, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import { MainColor } from '@/constants/Config';
import { formatDate } from '@/constants/Static';
import { SaveURIToLibrary, SecureStoreManager } from '@/constants/Stores';
import { useDefaultContext } from '@/hooks';
import { GetSubmissionById } from '@/services';
import { getQueuedSubmissionById, type QueuedSubmission } from '@/services/submission-queue';
import { GlobalStyle } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

const statusLabelMap: Record<SubmissionStatus, string> = {
  VERIFIED: 'Verified',
  UNDER_REVIEW: 'Under Review',
  SUBMITTED: 'Submitted',
  REJECTED: 'Rejected',
};

const fitImageToScreen = (width: number, height: number) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const scale = Math.min(screenWidth / width, screenHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

export default function SubmissionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ submissionId?: string; queueId?: string }>();
  const submissionId = typeof params.submissionId === 'string' ? params.submissionId : '';
  const queueId = typeof params.queueId === 'string' ? params.queueId : '';
  const isQueuedMode = !!queueId;
  const { SubmissionQueueContext } = useDefaultContext();
  const [submission, setSubmission] = React.useState<Submission | null>(null);
  const [queuedSubmission, setQueuedSubmission] = React.useState<QueuedSubmission | null>(null);
  const [isLoading, setLoading] = React.useState(true);
  const [isRetrying, setRetrying] = React.useState(false);
  const [isDeleting, setDeleting] = React.useState(false);
  const [isDownloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showImages, setShowImages] = React.useState(false);
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [imageUrls, setImageUrls] = React.useState<
    Array<{
      url: string;
      width: number;
      height: number;
      props?: {
        source?: {
          uri?: string;
          headers?: Record<string, string>;
        };
      };
    }>
  >([]);

  const loadDetail = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isQueuedMode) {
        const queued = await getQueuedSubmissionById(queueId);
        if (!queued) {
          setError('Queued submission not found.');
          return;
        }

        setQueuedSubmission(queued);
        setSubmission(null);
        return;
      }

      if (!submissionId) {
        setError('Submission id is missing.');
        return;
      }

      const response = await GetSubmissionById(submissionId);
      if (!response.success) {
        setError(response.error.message);
        return;
      }

      setSubmission(response.data);
      setQueuedSubmission(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load this submission.');
    } finally {
      setLoading(false);
    }
  }, [isQueuedMode, queueId, submissionId]);

  useFocusEffect(
    React.useCallback(() => {
      void loadDetail();
    }, [loadDetail]),
  );

  React.useEffect(() => {
    let isMounted = true;

    void SecureStoreManager.getToken().then(token => {
      if (isMounted) setAuthToken(token);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const loadImageSizes = async () => {
      const queuedImages = queuedSubmission?.payload.images ?? [];
      const photos = submission?.photos ?? [];
      const sourceItems = isQueuedMode
        ? queuedImages.map(image => ({ uri: image.uri, requiresAuth: false }))
        : photos.map(photo => ({ uri: photo.browserUrl || photo.url, requiresAuth: true }));

      if (sourceItems.length === 0) {
        if (isMounted) setImageUrls([]);
        return;
      }

      const nextImageUrls = await Promise.all(
        sourceItems.map(async item => {
          const headers = item.requiresAuth && authToken ? { Authorization: `Bearer ${authToken}` } : undefined;

          try {
            const size = headers ? await Image.getSizeWithHeaders(item.uri, headers) : await Image.getSize(item.uri);
            const fitted = fitImageToScreen(size.width, size.height);
            return {
              url: item.uri,
              width: fitted.width,
              height: fitted.height,
              props: { source: headers ? { uri: item.uri, headers } : { uri: item.uri } },
            };
          } catch (_error) {
            return {
              url: item.uri,
              width: 1080,
              height: 1080,
              props: { source: headers ? { uri: item.uri, headers } : { uri: item.uri } },
            };
          }
        }),
      );

      if (isMounted) setImageUrls(nextImageUrls);
    };

    void loadImageSizes();

    return () => {
      isMounted = false;
    };
  }, [authToken, isQueuedMode, queuedSubmission, submission]);

  const detailRows = React.useMemo(() => {
    if (isQueuedMode && queuedSubmission) {
      return [
        { label: 'Queue ID:', value: queuedSubmission.id },
        { label: 'Queued At:', value: new Date(queuedSubmission.createdAt).toLocaleString() },
        { label: 'Last Attempt:', value: queuedSubmission.lastAttemptAt ? new Date(queuedSubmission.lastAttemptAt).toLocaleString() : 'Not tried yet' },
        { label: 'Status:', value: queuedSubmission.photosAvailable ? 'Queued' : 'Queued / Photos Lost' },
        { label: 'Reason:', value: queuedSubmission.reason.message },
        { label: 'Total Images:', value: `${queuedSubmission.payload.images.length} ${queuedSubmission.payload.images.length === 1 ? 'photo' : 'photos'}` },
        { label: 'Attempts:', value: String(queuedSubmission.attempts) },
      ];
    }

    if (!submission) return [];

    return [
      { label: 'Field Code:', value: submission.fieldCode || '-' },
      {
        label: 'Species:',
        value: submission.plant?.scientificName || submission.plant?.nameEn || submission.plant?.nameAr || 'Not identified yet',
      },
      { label: 'Date:', value: formatDate(submission.submittedAt || submission.createdAt, 'Pending sync') },
      {
        label: 'Location:',
        value: submission.latitude != null && submission.longitude != null ? `${submission.latitude} N, ${submission.longitude} E` : 'N/A',
      },
      { label: 'Total Images:', value: `${submission.photos.length} ${submission.photos.length === 1 ? 'photo' : 'photos'}` },
      { label: 'Status:', value: statusLabelMap[submission.status] },
    ];
  }, [isQueuedMode, queuedSubmission, submission]);

  const handleRetryQueued = React.useCallback(async () => {
    if (!queueId) return;

    setRetrying(true);
    setError(null);

    try {
      const result = await SubmissionQueueContext.retryOne(queueId);
      await SubmissionQueueContext.refreshQueue();

      if (result?.status === 'success') {
        router.replace({ pathname: '/Modals/SubmissionDetail', params: { submissionId: result.response.id } } as any);
        return;
      }

      await loadDetail();
    } finally {
      setRetrying(false);
    }
  }, [SubmissionQueueContext, loadDetail, queueId, router]);

  const handleDeleteQueued = React.useCallback(async () => {
    if (!queueId) return;

    setDeleting(true);
    setError(null);

    try {
      await SubmissionQueueContext.removeOne(queueId);
      router.replace('/Modals/Submissions');
    } finally {
      setDeleting(false);
    }
  }, [SubmissionQueueContext, queueId, router]);

  const handleDownloadImages = React.useCallback(async () => {
    if (imageUrls.length === 0) return;

    setDownloading(true);
    try {
      let savedCount = 0;

      for (const image of imageUrls) {
        const didSave = await SaveURIToLibrary(image.url, { headers: image.props?.source?.headers });
        if (didSave) savedCount += 1;
        else {
          Alert.alert('Permission needed', 'Please allow photo library access to save observation images.');
          return;
        }
      }

      Alert.alert('Download complete', `${savedCount} ${savedCount === 1 ? 'photo was' : 'photos were'} saved to your phone.`);
    } catch (downloadError) {
      Alert.alert('Download failed', downloadError instanceof Error ? downloadError.message : 'Could not save these images. Please try again.');
    } finally {
      setDownloading(false);
    }
  }, [imageUrls]);

  return (
    <SafeInsetsWrapper>
      <ThemedView style={GlobalStyle.flex} variant="Container">
        <View style={styles.header}>
          <ThemedTxt text={isQueuedMode ? 'Queued Observation' : submission?.fieldCode || 'Observation details'} color={MainColor} fontSize={16} />
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={26} color={MainColor} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={MainColor} />
            <ThemedTxt text="Loading observation..." variant="Secondary" style={GlobalStyle.tMar12} />
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <ThemedTxt text={error} variant="Secondary" center rem={1.5} />
            <ThemedBtnTxt text="Retry" buttonStyle={[GlobalStyle.tMar16, styles.actionButton]} rem={1.2} onPress={loadDetail} />
          </View>
        ) : (
          <>
            <Scroll>
              <View style={styles.content}>
                <Card showBorder borderColor={MainColor} style={styles.sectionCard}>
                  <ThemedTxt text="Observation Details" color={MainColor} rem={1} fontWeight="500" style={styles.sectionTitle} />
                  {detailRows.map(row => (
                    <View key={row.label} style={styles.detailRow}>
                      <ThemedTxt text={row.label} variant="Secondary" rem={0.875} />
                      <ThemedTxt text={row.value} color={MainColor} rem={0.875} style={styles.detailValue} />
                    </View>
                  ))}
                </Card>

                <Card showBorder borderColor={MainColor} style={styles.sectionCard}>
                  <ThemedTxt
                    text={isQueuedMode ? 'Queued images available' : submission?.status === 'VERIFIED' ? 'Verified images available' : 'Images available'}
                    color={MainColor}
                    rem={1.2}
                    center
                  />
                  <ThemedBtnTxt
                    text={isQueuedMode ? 'View Images' : submission?.status === 'VERIFIED' ? 'View Verified Images' : 'View Images'}
                    buttonStyle={styles.actionButton}
                    onPress={() => setShowImages(true)}
                    disabled={imageUrls.length === 0}
                    enabled={imageUrls.length > 0}
                    rem={1.2}
                  />
                  <ThemedBtnTxt
                    text={isDownloading ? 'Downloading...' : imageUrls.length === 1 ? 'Download Image' : 'Download Images'}
                    variant="OutLine"
                    buttonStyle={styles.actionButton}
                    onPress={handleDownloadImages}
                    disabled={imageUrls.length === 0 || isDownloading}
                    enabled={imageUrls.length > 0 && !isDownloading}
                    rem={1.2}
                  />
                </Card>

                {isQueuedMode && queuedSubmission && (
                  <Card showBorder borderColor={MainColor} style={styles.sectionCard}>
                    <ThemedTxt text="Queue Status" color={MainColor} rem={1.2} center />
                    <ThemedTxt text={queuedSubmission.reason.message} variant="Secondary" center style={GlobalStyle.tMar5} rem={1} />
                    {!queuedSubmission.photosAvailable && (
                      <ThemedView style={styles.warningBox}>
                        <ThemedTxt text="Photos are missing" color="#B42318" fontWeight="700" center />
                        <ThemedTxt
                          text="This queued observation can no longer be submitted because its saved photos were lost."
                          variant="Secondary"
                          center
                          style={GlobalStyle.tMar5}
                          rem={1}
                        />
                      </ThemedView>
                    )}
                    {queuedSubmission.photosAvailable && (
                      <>
                        {queuedSubmission.reason.code === 'NO_USER' && (
                          <ThemedBtnTxt text="Login" buttonStyle={styles.actionButton} onPress={() => router.replace('/Pages/LoginFlow/Login')} rem={1.2} />
                        )}
                        <ThemedBtnTxt
                          text={isRetrying ? 'Resubmitting...' : 'Resubmit'}
                          buttonStyle={styles.actionButton}
                          onPress={handleRetryQueued}
                          disabled={isRetrying || SubmissionQueueContext.isSyncing}
                          enabled={!isRetrying && !SubmissionQueueContext.isSyncing}
                          rem={1.2}
                        />
                      </>
                    )}
                    <ThemedBtnTxt
                      text={isDeleting ? 'Deleting...' : 'Delete from Queue'}
                      variant="OutLine"
                      buttonStyle={[styles.actionButton, styles.deleteButton]}
                      onPress={handleDeleteQueued}
                      disabled={isDeleting}
                      enabled={!isDeleting}
                      rem={1.2}
                    />
                  </Card>
                )}
              </View>
            </Scroll>
            <View style={styles.footer}>
              <ThemedBtnTxt text="Close" variant="OutLine" buttonStyle={GlobalStyle.pad12} onPress={() => router.back()} rem={1.2} />
            </View>
          </>
        )}

        <ImgViewer isVisible={showImages} closeModal={() => setShowImages(false)} imageUrls={imageUrls} enableSwipeDown />
      </ThemedView>
    </SafeInsetsWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: MainColor,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    paddingTop: 18,
  },
  sectionCard: {
    borderWidth: 1.5,
    borderRadius: 18,
    borderColor: MainColor,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
    gap: 12,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    minWidth: 180,
    padding: 12,
    alignSelf: 'center',
    borderRadius: 12,
    marginTop: 12,
  },
  warningBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: MainColor,
    borderRadius: 12,
    padding: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: MainColor,
  },
  deleteButton: {
    borderColor: '#B42318',
  },
});
