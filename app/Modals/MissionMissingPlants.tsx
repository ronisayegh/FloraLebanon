import type { MissingPlantPhotosMissionItem } from '@/@Types';
import { SafeInsetsWrapper, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import ModalHeader from '@/components/basic/Header';
import { MainColor } from '@/constants/Config';
import { GetPlantsMissingPhotosMission } from '@/services';
import { GlobalStyle } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

const PAGE_SIZE = 20;

const PlantCard = ({ item, onPress }: { item: MissingPlantPhotosMissionItem; onPress: () => void }) => {
  const displayName = item.scientificName || item.nameEn || item.nameAr || 'Unknown plant';
  const subtitle = item.nameEn || item.nameAr || item.description || '';
  const coverUri = item.coverImage?.browserUrl || item.coverImage?.url || null;

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.cardColumn} onPress={onPress}>
      <View style={styles.plantCard}>
        <View style={styles.imageShell}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Ionicons name="image-outline" size={72} color="#A8A8A8" />
            </View>
          )}
          <View style={styles.imageOverlay}>
            <ThemedTxt text={displayName} italic fontWeight="700" color="#FFF" rem={0.875} center nowwarp />
            {subtitle ? <ThemedTxt text={subtitle} color="#FFF" rem={0.75} center nowwarp /> : null}
            <View style={[GlobalStyle.row, GlobalStyle.alignCenter, GlobalStyle.tMar8]}>
              <Ionicons name="people-outline" rem={0.75} color="#FFF" />
              <ThemedTxt text={`${item.verifiedStepsCount}/${item.requiredStepsCount} verified`} color="#FFF" fontSize={11} style={GlobalStyle.lMar5} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function MissionMissingPlantsScreen() {
  const router = useRouter();
  const [plants, setPlants] = React.useState<MissingPlantPhotosMissionItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [query, setQuery] = React.useState('');
  const [hasNextPage, setHasNextPage] = React.useState(false);
  const [isLoading, setLoading] = React.useState(true);
  const [isRefreshing, setRefreshing] = React.useState(false);
  const [isLoadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const hasLoadedInitialRef = React.useRef(false);

  const loadPage = React.useCallback(
    async (nextPage: number, mode: 'replace' | 'append' = 'replace', search = query) => {
      if (mode === 'replace') setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const response = await GetPlantsMissingPhotosMission(nextPage, PAGE_SIZE, search);
        if (!response.success) {
          setError(response.error.message);
          return;
        }

        setPlants(prev =>
          mode === 'replace' ? response.data.items : [...prev, ...response.data.items.filter(item => !prev.some(existing => existing.id === item.id))],
        );
        setPage(response.data.pagination.page);
        setHasNextPage(response.data.pagination.hasNextPage);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load the mission plants.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [query],
  );

  useFocusEffect(
    React.useCallback(() => {
      hasLoadedInitialRef.current = true;
      loadPage(1, 'replace', query);
    }, [loadPage, query]),
  );

  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadPage(1, 'replace', query);
  }, [loadPage, query]);

  const handleLoadMore = React.useCallback(() => {
    if (isLoading || isRefreshing || isLoadingMore || !hasNextPage) return;
    loadPage(page + 1, 'append', query);
  }, [hasNextPage, isLoading, isLoadingMore, isRefreshing, loadPage, page, query]);

  React.useEffect(() => {
    if (!hasLoadedInitialRef.current) {
      return;
    }

    const timeout = setTimeout(() => {
      loadPage(1, 'replace', query);
    }, 220);

    return () => clearTimeout(timeout);
  }, [loadPage, query]);

  return (
    <SafeInsetsWrapper>
      <ThemedView style={GlobalStyle.flex} variant="Container">
        <ModalHeader />
        <View style={styles.copyBlock}>
          <ThemedTxt text="If you spot any of these plants, take detailed photos to help reach our collection goal." variant="Secondary" fontSize={14} />
          {/* <View style={styles.filterWrap}>
            <TextInputIcon value={query} onChangeText={setQuery} placeholder="Filter plants by name" />
          </View> */}
        </View>
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={MainColor} />
            <ThemedTxt text="Loading plants..." variant="Secondary" style={GlobalStyle.tMar12} />
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <ThemedTxt text={error} variant="Secondary" center />
            <ThemedBtnTxt text="Retry" buttonStyle={[GlobalStyle.tMar16, styles.retryButton]} onPress={() => loadPage(1, 'replace', query)} />
          </View>
        ) : (
          <FlatList
            data={plants}
            numColumns={2}
            keyExtractor={item => item.id}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <PlantCard item={item} onPress={() => router.push({ pathname: '/Modals/PlantDetail', params: { plantId: item.id } })} />}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            onEndReachedThreshold={0.45}
            onEndReached={handleLoadMore}
            ListEmptyComponent={
              <View style={styles.centerState}>
                <ThemedTxt text="Every tracked plant already has full step coverage." center />
              </View>
            }
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator color={MainColor} />
                </View>
              ) : (
                <View style={styles.closeSpacing} />
              )
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.bottomBar}>
          <ThemedBtnTxt text="Close" buttonStyle={styles.closeButton} onPress={() => router.back()} rem={1.5} />
        </View>
      </ThemedView>
    </SafeInsetsWrapper>
  );
}

const styles = StyleSheet.create({
  copyBlock: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  filterWrap: {
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  columnWrapper: {
    gap: 12,
  },
  cardColumn: {
    flex: 1,
    marginBottom: 12,
    maxWidth: '50%',
  },
  plantCard: {
    padding: 0,
    borderWidth: 1,
    borderColor: MainColor,
    borderRadius: 18,
    overflow: 'hidden',
    aspectRatio: 1,
  },
  imageShell: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F3F3',
  },
  imageOverlay: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(25, 25, 25, 0.3)',
    justifyContent: 'flex-end',
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    minWidth: 120,
    height: 44,
  },
  footerLoader: {
    paddingVertical: 16,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  closeButton: {
    borderRadius: 12,
    padding: 12,
  },
  closeSpacing: {
    height: 8,
  },
});
