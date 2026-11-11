import { ThemedTxt, ThemedView } from '@/components/basic';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg';

const MAX_WEEKLY_TREES = 12;
const TREE_WIDTH = 50;
const TREE_SPACING = 20;

export const WeeklyForest: React.FC<{ treeCount: number }> = props => {
  const { treeCount } = props;
  // One starter tree, plus one tree per verified submission this week.
  const visibleTreeCount = Math.min(Math.max(0, treeCount) + 1, MAX_WEEKLY_TREES);
  // Center the row of trees (each tree is 50 wide, spaced 20 apart) in the 320-wide viewBox.
  const firstTreeX = 160 - ((visibleTreeCount - 1) * TREE_SPACING + TREE_WIDTH) / 2;
  const trunkHeightIncreases = React.useMemo(() => Array.from({ length: visibleTreeCount }, () => Math.random() * 80), [visibleTreeCount]);

  return (
    <ThemedView variant="Container" style={styles.forestCard}>
      <Svg width="100%" height="100%" viewBox="0 0 320 220">
        <Ellipse cx="160" cy="165" rx="120" ry="12" fill="#b8aa8a" />
        <Rect x="40" y="165" width="240" height="8" fill="#a19170" rx="2" />
        {Array.from({ length: visibleTreeCount }).map((_, index) => {
          const x = firstTreeX + index * TREE_SPACING;
          const trunkStretch = trunkHeightIncreases[index] ?? 0;
          return <TreeSvg key={index} x={x} trunkStretch={trunkStretch} />;
        })}
      </Svg>
      <View style={styles.forestCaption}>
        <ThemedTxt
          text={treeCount === 0 ? 'Keep taking photos to grow a forest' : `${treeCount} verified submission${treeCount === 1 ? '' : 's'} in the last 7 days`}
          variant="Secondary"
          rem={0.75}
          center
          nowwarp
        />
      </View>
    </ThemedView>
  );
};

const TreeSvg: React.FC<{ x: number; trunkStretch: number }> = props => {
  const { x, trunkStretch } = props;
  return (
    <G transform={`translate(${x} ${40 + trunkStretch})`}>
      <Path d={`M25 ${128 - trunkStretch} V40`} stroke="#6b5344" strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M25 33 Q15 28 10 23" stroke="#6b5344" strokeWidth={2} fill="none" />
      <Path d="M25 33 Q35 28 40 23" stroke="#6b5344" strokeWidth={2} fill="none" />
      <Path d="M25 46 Q17 40 13 36" stroke="#6b5344" strokeWidth={1.5} fill="none" />
      <Path d="M25 46 Q33 40 37 36" stroke="#6b5344" strokeWidth={1.5} fill="none" />
      <Ellipse cx={25} cy={18} rx={22} ry={18} fill="#5a8f47" opacity={0.9} />
      <Ellipse cx={15} cy={23} rx={15} ry={13} fill="#6ba555" opacity={0.85} />
      <Ellipse cx={35} cy={23} rx={15} ry={13} fill="#6ba555" opacity={0.85} />
      <Ellipse cx={25} cy={28} rx={18} ry={12} fill="#7abf65" opacity={0.8} />
    </G>
  );
};

const styles = StyleSheet.create({
  forestCard: {
    width: '100%',
    aspectRatio: 1.45,
    borderRadius: 18,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  forestCaption: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
    paddingHorizontal: 16,
  },
});
