import type { FloweringPlantItem, HomeSummary, LeaderboardEntry } from '@/@Types';
import { AnimatedNumber, AppBrandTitle, Card, ImgInfos, ImgViewer, Scroll, SimpleCarousel, ThemedTxt, ThemedView } from '@/components/basic';
import { CircleCheck, Leaf, ThemeIconProps, Trophy, Users } from '@/components/basic/Icons';
import { MainColor } from '@/constants/Config';
import { GetCurrentFloweringPlants, GetHomeSummary } from '@/services';
import { GlobalStyle } from '@/styles';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

type LeaderboardTab = 'Top Villages' | 'Top Organizations' | 'Top Individuals';

interface StatItem {
  icon: React.FC<ThemeIconProps>;
  value: number;
  label: string;
}

interface LeaderboardProps {
  categoryData: Record<LeaderboardTab, LeaderboardEntry[]>;
}
const Leaderboard = (props: LeaderboardProps) => {
  const { categoryData } = props;
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('Top Villages');
  const tabs: LeaderboardTab[] = ['Top Villages', 'Top Organizations', 'Top Individuals'];
  const currentData = useMemo(() => categoryData[activeTab] || [], [activeTab, categoryData]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return rank + '';
    }
  };

  return (
    <View>
      <View style={styles.tabBar}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}>
            <ThemedTxt text={tab} rem={0.75} fontWeight={activeTab === tab ? '400' : '600'} color={activeTab === tab ? MainColor : '#999'} center nowwarp />
          </TouchableOpacity>
        ))}
      </View>

      {currentData.length === 0 ? (
        <ThemedTxt text="No leaderboard data yet." variant="Secondary" fontSize={13} />
      ) : (
        currentData.slice(0, 5).map(item => (
          <View key={item.id} style={styles.leaderboardRow}>
            <View style={styles.leaderboardLeft}>
              <ThemedTxt text={getRankIcon(item.rank)} rem={0.875} style={styles.rankNumber} />
              <ThemedTxt text={item.name} rem={0.875} variant="Secondary" style={GlobalStyle.lMar8} />
            </View>
            <ThemedTxt text={`${item.points} pts`} rem={0.875} fontWeight="600" style={GlobalStyle.lMar8} />
          </View>
        ))
      )}
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [containerWidth, setContainerWidth] = useState(0);
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [floweringPlants, setFloweringPlants] = useState<FloweringPlantItem[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imagesUrls, setImageUrls] = useState<ImgInfos[]>([]);

  const loadHome = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }

    try {
      const [summaryResponse, floweringResponse] = await Promise.all([GetHomeSummary(), GetCurrentFloweringPlants()]);
      if (summaryResponse.success) setSummary(summaryResponse.data);
      if (floweringResponse.success) setFloweringPlants(floweringResponse.data.items);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHome({ silent: true });
    }, [loadHome]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadHome();
    } finally {
      setRefreshing(false);
    }
  }, [loadHome]);

  const stats: StatItem[] = [
    { icon: CircleCheck, value: summary?.stats.verifiedPlantPhotos ?? 0, label: 'Verified plant photos' },
    { icon: Users, value: summary?.stats.contributors ?? 0, label: 'Number of contributors' },
    { icon: Leaf, value: summary?.stats.verifiedPlantSpecies ?? 0, label: 'Verified plant species' },
  ];

  const leaderboardCategories: Record<LeaderboardTab, LeaderboardEntry[]> = {
    'Top Villages': summary?.leaderboards.villages ?? [],
    'Top Organizations': summary?.leaderboards.organizations ?? [],
    'Top Individuals': summary?.leaderboards.individuals ?? [],
  };

  return (
    <ThemedView style={GlobalStyle.flex}>
      <Scroll refresh={{ onRefresh: handleRefresh, isLoading: isRefreshing }}>
        <Card style={GlobalStyle.tMar5}>
          <AppBrandTitle />
          <ThemedTxt text="Welcome" variant="Secondary" rem={1} style={styles.headerSubtitle} />
        </Card>
        <Card title="🌸 What's flowering this month" noBackground txtProps={{ rem: 1.1, fontWeight: '600' }}>
          {isLoading && floweringPlants.length === 0 ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={MainColor} />
            </View>
          ) : floweringPlants.length === 0 ? (
            <ThemedTxt text="No featured flowering plants were set for this month yet." variant="Secondary" />
          ) : (
            <SimpleCarousel
              data={floweringPlants}
              renderItem={cell => (
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.plantItemContainer}
                  // onPress={() => router.push({ pathname: '/Modals/PlantDetail', params: { plantId: cell.item.plant.id } })}
                  onPress={() => {
                    const image = cell.item.plant.image;
                    if (image) {
                      setImageUrls([{ url: image.url, originUrl: image.url }]);
                      setShowModal(true);
                    }
                  }}
                >
                  <ThemedView variant="Transparent">
                    {cell.item.plant.image?.url ? (
                      <Image source={{ uri: cell.item.plant.image.url }} style={styles.plantImage} />
                    ) : (
                      <ThemedView style={[styles.plantImage, styles.plantPlaceholder]} variant="Secondary">
                        <Leaf size={36} strokeWidth={1.5} />
                      </ThemedView>
                    )}
                    <ThemedTxt text={cell.item.plant.scientificName || cell.item.plant.nameEn} rem={0.75} center italic nowwarp />
                    <ThemedTxt text={cell.item.plant.nameEn || cell.item.plant.nameAr || 'Wild plant'} rem={0.75} center variant="Secondary" nowwarp />
                  </ThemedView>
                </TouchableOpacity>
              )}
            />
          )}
        </Card>
        <Card title="FloraLebanon in Action" noBackground txtProps={{ rem: 1.1, fontWeight: '600' }}>
          <SimpleCarousel
            data={stats}
            onLayout={e => setContainerWidth(e.nativeEvent.layout.width / 3 - 8)}
            renderItem={cell => (
              <ThemedView key={cell.index} style={[styles.statBox, { width: containerWidth }]} variant="Primary">
                <cell.item.icon size={24} strokeWidth={1.5} strokeFill filled />
                <AnimatedNumber value={cell.item.value} rem={1.5} bold nowwarp />
                <ThemedTxt text={cell.item.label} rem={0.75} variant="Secondary" style={GlobalStyle.tMar8} center fontWeight="500" preventWordBreak />
              </ThemedView>
            )}
            contentContainerStyle={{ paddingVertical: 5 }}
            hideNav
          />
        </Card>
        <Card
          title="Weekly Leaderboard"
          Icon={<Trophy size={20} strokeWidth={2} strokeFill filled style={{ marginRight: 8 }} />}
          txtProps={{ rem: 1.1, fontWeight: '500' }}
          showBorder
        >
          {isLoading && !summary ? <ActivityIndicator color={MainColor} /> : <Leaderboard categoryData={leaderboardCategories} />}
        </Card>
      </Scroll>
      <ImgViewer closeModal={() => setShowModal(false)} isVisible={showModal} imageUrls={imagesUrls} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerSubtitle: {
    marginTop: 12,
  },
  cardHeaderIcon: {
    marginRight: 8,
  },
  plantItemContainer: {
    width: 144,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  plantImage: {
    width: 144,
    height: 144,
    borderRadius: 12,
    marginBottom: 8,
  },
  plantPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBox: {
    borderRadius: 14,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabItem: {
    backgroundColor: '#8000200d',
  },

  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankNumber: {
    width: 24,
    color: '#99a1af',
  },
  loadingBlock: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
