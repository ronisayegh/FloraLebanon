import type { Submission, SubmissionStatus } from '@/@Types';
import { Card, SafeInsetsWrapper, Scroll, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import { CircleCheck, Clock, PaperPlane2 } from '@/components/basic/Icons';
import { MainColor } from '@/constants/Config';
import { Normalize } from '@/constants/Helper';
import { formatDate } from '@/constants/Static';
import { useDefaultContext } from '@/hooks';
import { GetMySubmissions } from '@/services';
import { GlobalStyle } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

const statusLabelMap: Record<SubmissionStatus, string> = {
  VERIFIED: 'Verified',
  UNDER_REVIEW: 'Under Review',
  SUBMITTED: 'Submitted',
  REJECTED: 'Rejected',
};

const getStatusIcon = (status: SubmissionStatus) => {
  switch (status) {
    case 'VERIFIED':
      return <CircleCheck size={Normalize(16)} filled strokeWidth={2} />;
    case 'UNDER_REVIEW':
      return <Clock size={Normalize(16)} strokeWidth={2} />;
    case 'SUBMITTED':
    case 'REJECTED':
    default:
      return <PaperPlane2 size={Normalize(16)} strokeWidth={2} />;
  }
};
const getStatusBadgeColors = (status: SubmissionStatus) => {
  switch (status) {
    case 'VERIFIED':
      return { bg: '#228B22', text: '#FFF' };
    case 'UNDER_REVIEW':
      return { bg: '#FFA500', text: '#FFF' };
    case 'REJECTED':
      return { bg: '#B42318', text: '#FFF' };
    case 'SUBMITTED':
    default:
      return { bg: MainColor, text: '#FFF' };
  }
};

const ObservationItem = ({ item, onPress }: { item: Submission; onPress: () => void }) => {
  const plantName = item.plant?.scientificName || item.plant?.nameEn || item.plant?.nameAr;
  const displayName = item.fieldCode || plantName || 'Observation';
  const { bg: badgeBg, text: badgeText } = getStatusBadgeColors(item.status);
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.observationTouch}>
      <ThemedView variant="Container" style={[GlobalStyle.row, styles.observationRow]}>
        <View style={[GlobalStyle.row, GlobalStyle.flex, GlobalStyle.alignCenter]}>
          {getStatusIcon(item.status)}
          <View style={GlobalStyle.lMar8}>
            <ThemedTxt text={displayName} fontWeight="500" rem={0.875} />
            {plantName && plantName !== item.fieldCode ? (
              <ThemedTxt text={plantName} variant="Secondary" rem={0.75} fontWeight="500" />
            ) : null}
            <ThemedTxt
              text={`${formatDate(item.submittedAt || item.createdAt, 'Pending sync')} • ${item.photos.length} image${item.photos.length === 1 ? '' : 's'}`}
              variant="Secondary"
              rem={0.75}
              fontWeight="500"
            />
          </View>
        </View>
        <View style={styles.rowActions}>
          <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
            <ThemedTxt text={statusLabelMap[item.status]} color={badgeText} fontSize={12} fontWeight="700" />
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
};
interface QueuedObservationItemProps {
  createdAt: string;
  imageCount: number;
  photosAvailable: boolean;
  onPress: () => void;
}
const QueuedObservationItem = (props: QueuedObservationItemProps) => {
  const { createdAt, imageCount, photosAvailable, onPress } = props;
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.observationTouch}>
      <ThemedView variant="Container" style={[GlobalStyle.row, styles.observationRow]}>
        <View style={[GlobalStyle.row, GlobalStyle.flex, GlobalStyle.alignCenter]}>
          <Clock size={Normalize(16)} strokeWidth={2} />
          <View style={GlobalStyle.lMar12}>
            <ThemedTxt text="Queued observation" fontWeight="500" rem={0.875} />
            <ThemedTxt
              text={`${formatDate(createdAt, 'Pending sync')} - ${imageCount} image${imageCount === 1 ? '' : 's'}`}
              variant="Secondary"
              fontSize={12}
              fontWeight="500"
            />
          </View>
        </View>
        <View style={styles.rowActions}>
          <View style={[styles.statusBadge, { backgroundColor: photosAvailable ? '#9E0031' : '#B42318' }]}>
            <ThemedTxt text={photosAvailable ? 'Queued' : 'Photos Lost'} color="#FFF" fontSize={12} fontWeight="700" />
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
};

export default function SubmissionsModalScreen() {
  const router = useRouter();
  const { ThemeContext, SubmissionQueueContext } = useDefaultContext();
  const theme = ThemeContext.value;
  const queuedSubmissions = SubmissionQueueContext.value;
  const isQueueSyncing = SubmissionQueueContext.isSyncing;
  const refreshQueue = SubmissionQueueContext.refreshQueue;
  const retryAllQueued = SubmissionQueueContext.retryAll;
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [isLoading, setLoading] = React.useState(true);
  const [isRefreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadSubmissions = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await GetMySubmissions();
      if (!response.success) {
        setError(response.error.message);
        return;
      }
      setSubmissions(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load submissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void refreshQueue();
      void loadSubmissions();
    }, [refreshQueue, loadSubmissions]),
  );

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadSubmissions(), refreshQueue()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshQueue, loadSubmissions]);

  const handleRetryAll = React.useCallback(async () => {
    await retryAllQueued();
    await loadSubmissions();
  }, [retryAllQueued, loadSubmissions]);

  return (
    <SafeInsetsWrapper>
      <ThemedView style={GlobalStyle.flex} variant="Container">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={Normalize(20)} color={MainColor} />
          </TouchableOpacity>
          <View style={GlobalStyle.lMar12}>
            <ThemedTxt text="My Submissions" fontWeight="600" rem={1.5} variant="Primary" />
            <ThemedTxt text="View sent and queued observations" variant="Secondary" rem={0.875} />
          </View>
        </View>

        <Scroll refresh={{ onRefresh: handleRefresh, isLoading: isRefreshing }}>
          <Card style={styles.mainCard}>
            <View style={styles.sectionHeader}>
              <ThemedTxt text={`Queued Observations (${queuedSubmissions.length})`} rem={0.875} fontWeight="500" />
              {queuedSubmissions.length > 0 && (
                <ThemedBtnTxt
                  text={isQueueSyncing ? 'Submitting...' : 'Submit All'}
                  rem={0.75}
                  buttonStyle={styles.submitAllButton}
                  onPress={handleRetryAll}
                  disabled={isQueueSyncing}
                  enabled={!isQueueSyncing}
                />
              )}
            </View>

            {queuedSubmissions.length === 0 ? (
              <View style={styles.emptySection}>
                <ThemedTxt text="No queued observations." fontWeight="700" />
                <ThemedTxt text="If you lose connection, pending submissions will appear here." variant="Secondary" center style={GlobalStyle.tMar8} />
              </View>
            ) : (
              queuedSubmissions.map(item => (
                <QueuedObservationItem
                  key={item.id}
                  createdAt={item.createdAt}
                  imageCount={item.payload.images.length}
                  photosAvailable={item.photosAvailable}
                  onPress={() => router.push({ pathname: '/Modals/SubmissionDetail', params: { queueId: item.id } } as any)}
                />
              ))
            )}
          </Card>

          <Card style={styles.mainCard}>
            <ThemedTxt text={`All Observations (${submissions.length})`} rem={0.875} fontWeight="500" />
            {isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator color={MainColor} />
                <ThemedTxt text="Loading submissions..." variant="Secondary" style={GlobalStyle.tMar12} />
              </View>
            ) : error ? (
              <View style={styles.centerState}>
                <ThemedTxt text={error} variant="Secondary" center />
                <ThemedBtnTxt text="Retry" buttonStyle={[GlobalStyle.tMar16, styles.retryButton]} onPress={loadSubmissions} />
              </View>
            ) : submissions.length === 0 ? (
              <View style={styles.centerState}>
                <ThemedTxt text="No submissions yet." fontWeight="700" />
                <ThemedTxt text="Create your first observation from the capture flow." variant="Secondary" center style={GlobalStyle.tMar8} />
              </View>
            ) : (
              submissions.map(item => (
                <ObservationItem
                  key={item.id}
                  item={item}
                  onPress={() => router.push({ pathname: '/Modals/SubmissionDetail', params: { submissionId: item.id } } as any)}
                />
              ))
            )}
          </Card>

          <View style={{ height: 20, backgroundColor: theme.containerBg }} />
        </Scroll>
      </ThemedView>
    </SafeInsetsWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderBottomColor: MainColor,
    borderBottomWidth: 2,
  },
  mainCard: {
    borderRadius: 12,
    marginBottom: 16,
    borderColor: MainColor,
    borderWidth: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  observationRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  observationTouch: {
    marginTop: 10,
  },
  submitAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  retryButton: {
    minWidth: 120,
    height: 44,
  },
});
