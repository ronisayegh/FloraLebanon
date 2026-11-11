import type { VillageFewSubmissionsItem } from '@/@Types';
import { SafeInsetsWrapper, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import ModalHeader from '@/components/basic/Header';
import { MainColor } from '@/constants/Config';
import { GetVillagesByFewSubmissions } from '@/services';
import { GlobalStyle } from '@/styles';
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

const VILLAGE_FETCH_LIMIT = 2000;
const TILE_HEIGHT = 86;
const PAGE_SIZE = 40;

const VillageTile = ({ item, onPress }: { item: VillageFewSubmissionsItem; onPress: () => void }) => {
  const label = item.nameEn || item.nameFr || item.nameAr || 'Unknown village';
  return (
    <TouchableOpacity activeOpacity={0.88} style={[styles.tileWrap]} onPress={onPress}>
      <ThemedView variant="Container" style={styles.tile}>
        <ThemedTxt text={label} variant="Primary" rem={0.875} center nowwarp />
      </ThemedView>
    </TouchableOpacity>
  );
};

export default function MissionFewVillagesScreen() {
  const router = useRouter();
  const [villages, setVillages] = React.useState<VillageFewSubmissionsItem[]>([]);
  const [query, setQuery] = React.useState('');
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [isLoading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const filteredVillages = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return villages;
    }

    return villages.filter(item => [item.nameEn, item.nameFr, item.nameAr].filter(Boolean).some(name => String(name).toLowerCase().includes(normalizedQuery)));
  }, [query, villages]);

  const visibleVillages = React.useMemo(() => filteredVillages.slice(0, visibleCount), [filteredVillages, visibleCount]);

  const loadVillages = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await GetVillagesByFewSubmissions(VILLAGE_FETCH_LIMIT);
      if (!response.success) {
        setError(response.error.message);
        return;
      }
      setVillages(response.data);
      setVisibleCount(PAGE_SIZE);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load villages.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  const loadMoreVillages = React.useCallback(() => {
    setVisibleCount(current => {
      if (current >= filteredVillages.length) {
        return current;
      }

      return Math.min(current + PAGE_SIZE, filteredVillages.length);
    });
  }, [filteredVillages.length]);

  useFocusEffect(
    React.useCallback(() => {
      loadVillages();
    }, [loadVillages]),
  );

  return (
    <SafeInsetsWrapper>
      <ThemedView style={GlobalStyle.flex} variant="Primary">
        <ModalHeader />
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={MainColor} />
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <ThemedTxt text={error} center variant="Secondary" />
            <ThemedBtnTxt text="Retry" buttonStyle={[GlobalStyle.tMar16, styles.retryButton]} onPress={loadVillages} />
          </View>
        ) : (
          <FlatList
            data={visibleVillages}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrap}
            initialNumToRender={16}
            maxToRenderPerBatch={20}
            windowSize={8}
            removeClippedSubviews
            keyboardShouldPersistTaps="handled"
            onEndReached={loadMoreVillages}
            onEndReachedThreshold={0.35}
            getItemLayout={(_data, index) => ({
              length: TILE_HEIGHT,
              offset: TILE_HEIGHT * Math.floor(index / 2),
              index,
            })}
            renderItem={({ item }) => <VillageTile item={item} onPress={() => router.push('/Modals/MultiStepCapture')} />}
            ListHeaderComponent={
              <View style={styles.headerBlock}>
                <ThemedTxt text="Villages With Few Photos" color={MainColor} fontWeight="700" fontSize={20} />
                {/* <View style={GlobalStyle.tMar12}>
                  <TextInputIcon value={query} onChangeText={setQuery} placeholder="Filter villages by name" />
                </View> */}
              </View>
            }
            ListEmptyComponent={
              <ThemedView variant="Secondary" style={styles.emptyState}>
                <ThemedTxt text="No villages match your filter." variant="Secondary" center />
              </ThemedView>
            }
            ListFooterComponent={
              <View style={styles.footerBlock}>
                {visibleVillages.length < filteredVillages.length ? (
                  <ThemedTxt
                    text={`Scroll down to load more villages (${filteredVillages.length - visibleVillages.length} remaining).`}
                    variant="Secondary"
                    center
                    fontSize={12}
                    style={styles.loadMoreHint}
                  />
                ) : null}
                {/* <TouchableOpacity onPress={() => router.push('/Modals/RequestVillage')} style={styles.requestLinkWrap}>
                  <ThemedTxt text="Don't see your village? Request it." color={MainColor} center fontSize={15} />
                </TouchableOpacity> */}
                <ThemedBtnTxt text="Close" buttonStyle={styles.closeButton} onPress={() => router.back()} rem={1.5} />
              </View>
            }
          />
        )}
      </ThemedView>
    </SafeInsetsWrapper>
  );
}

const styles = StyleSheet.create({
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
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  headerBlock: {
    paddingBottom: 12,
  },
  columnWrap: {
    gap: 12,
  },
  tileWrap: {
    flex: 1,
    marginBottom: 12,
  },
  tile: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  emptyState: {
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
  },
  footerBlock: {
    paddingTop: 8,
  },
  loadMoreHint: {
    marginBottom: 8,
  },
  requestLinkWrap: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButton: {
    borderRadius: 12,
    marginTop: 8,
    padding: 12,
  },
});
