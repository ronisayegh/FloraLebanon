import type { ProfileBadgeSummary } from '@/@Types';
import { ThemedTxt, ThemedView } from '@/components/basic';
import { IS_DEV, MainColor } from '@/constants/Config';
import { Normalize } from '@/constants/Helper';
import { GlobalStyle } from '@/styles';
import { Asset } from 'expo-asset';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SvgCssUri } from 'react-native-svg/css';

type BadgeCategoryKey = keyof Omit<ProfileBadgeSummary, 'totalBadges'>;

type BadgeRowConfig = {
  key: BadgeCategoryKey;
  title: string;
  description: string;
  icon: number;
  lockedIcon: number;
};

const BADGES_PER_PAGE = 5;
const MIN_BADGE_COUNT = 10;
const DEV_PREVIEW_EARNED_BADGES = 0;
const BADGE_SIZE = Normalize(38);
const BADGE_GAP = Normalize(7);
const BADGE_PAGE_WIDTH = BADGE_SIZE * BADGES_PER_PAGE + BADGE_GAP * (BADGES_PER_PAGE - 1);

const BADGE_ROWS: BadgeRowConfig[] = [
  {
    key: 'species',
    title: 'Species',
    description: 'Earn badges by discovering species',
    icon: require('../../assets/images/emoji/cherry-blossom.svg'),
    lockedIcon: require('../../assets/images/emoji/cherry-blossom-grey.svg'),
  },
  {
    key: 'missions',
    title: 'Missions',
    description: 'Earn badges by completing missions',
    icon: require('../../assets/images/emoji/bullseye.svg'),
    lockedIcon: require('../../assets/images/emoji/bullseye-grey.svg'),
  },
  {
    key: 'rareSpecies',
    title: 'Rare Species',
    description: 'Earn badges by finding rare species',
    icon: require('../../assets/images/emoji/gem-stone.svg'),
    lockedIcon: require('../../assets/images/emoji/gem-stone-grey.svg'),
  },
];

function getVisibleBadgeCount(earnedCount: number) {
  return Math.max(MIN_BADGE_COUNT, Math.ceil(Math.max(earnedCount + 1, 1) / BADGES_PER_PAGE) * BADGES_PER_PAGE);
}

export const EmptyProfileBadgeSummary: ProfileBadgeSummary = {
  species: { points: 0, badgesEarned: 0, threshold: 20 },
  rareSpecies: { points: 0, badgesEarned: 0, threshold: 30 },
  missions: { points: 0, badgesEarned: 0, threshold: 25 },
  totalBadges: 0,
};

export const ProfileBadges: React.FC<{
  summary?: ProfileBadgeSummary | null;
  isAuthenticated: boolean;
}> = props => {
  const { summary, isAuthenticated } = props;
  const resolvedSummary = summary ?? EmptyProfileBadgeSummary;

  if (!isAuthenticated) {
    return (
      <ThemedView variant="Secondary" style={styles.emptyStateCard}>
        <ThemedTxt text="Login to start earning badges and keep your collection synced." variant="Secondary" fontSize={13} center />
      </ThemedView>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.divider} />
      <ThemedTxt text="My Progress" color={MainColor} rem={0.875} center fontWeight="700" style={styles.progressTitle} />

      {BADGE_ROWS.map((row, rowIndex) => {
        const earnedCount = IS_DEV ? Math.max(DEV_PREVIEW_EARNED_BADGES, resolvedSummary[row.key].badgesEarned) : resolvedSummary[row.key].badgesEarned;
        const visibleBadgeCount = getVisibleBadgeCount(earnedCount);

        return (
          <View key={row.key} style={[styles.badgeRow, rowIndex > 0 && styles.badgeRowBorder]}>
            <View style={styles.badgeRowText}>
              <ThemedTxt text={row.title} rem={0.875} fontWeight="700" variant="Secondary" />
              <ThemedTxt text={row.description} rem={0.75} variant="Secondary" style={styles.badgeDescription} />
            </View>

            <View style={styles.badgeViewport}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={BADGE_PAGE_WIDTH}
                snapToAlignment="start"
                disableIntervalMomentum
                contentContainerStyle={styles.badgeScrollContent}
              >
                {Array.from({ length: visibleBadgeCount }).map((_, index) => (
                  <BadgeCircle key={`${row.key}-${index}`} icon={row.icon} lockedIcon={row.lockedIcon} isEarned={index < earnedCount} />
                ))}
              </ScrollView>
            </View>
          </View>
        );
      })}

      <View style={[styles.totalSection, GlobalStyle.alignCenter]}>
        <ThemedTxt text="BADGES EARNED" rem={0.75} center variant="Secondary" />
        <ThemedTxt text={String(resolvedSummary.totalBadges)} rem={2} fontWeight="700" color={MainColor} center />
      </View>
    </View>
  );
};

const BadgeCircle: React.FC<{ icon: number; lockedIcon: number; isEarned: boolean }> = props => {
  const { icon, lockedIcon, isEarned } = props;
  const [iconUri, setIconUri] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    Asset.fromModule(isEarned ? icon : lockedIcon)
      .downloadAsync()
      .then(asset => {
        if (isMounted) {
          setIconUri(asset.localUri ?? asset.uri);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIconUri(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [icon, lockedIcon, isEarned]);

  return (
    <View style={[styles.badgeCircle, isEarned ? styles.badgeCircleEarned : styles.badgeCircleLocked]}>
      {iconUri ? <SvgCssUri uri={iconUri} width={Normalize(22)} height={Normalize(22)} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 12,
  },
  emptyStateCard: {
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },
  divider: {
    borderTopWidth: 1,
    borderColor: '#E1E1E1',
    marginBottom: 18,
  },
  progressTitle: {
    marginBottom: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  badgeRowBorder: {
    borderTopWidth: 1,
    borderColor: '#E1E1E1',
  },
  badgeRowText: {
    flex: 1,
    paddingRight: 12,
  },
  badgeDescription: {
    marginTop: 2,
  },
  badgeViewport: {
    width: BADGE_PAGE_WIDTH,
    overflow: 'hidden',
  },
  badgeScrollContent: {
    columnGap: BADGE_GAP,
  },
  badgeCircle: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badgeCircleEarned: {
    backgroundColor: MainColor,
    borderColor: MainColor,
  },
  badgeCircleLocked: {
    backgroundColor: '#F1F1F1',
    borderColor: '#D8D8D8',
  },
  totalSection: {
    borderTopWidth: 1,
    borderColor: '#E1E1E1',
    paddingTop: 16,
    marginTop: 12,
  },
});

export { ProfileBadgeInfoModalContent } from './InfoModalContent';
