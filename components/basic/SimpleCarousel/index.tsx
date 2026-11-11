import { MainColor } from '@/constants/Config';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { FlatList, ListRenderItem, ScrollViewProps, StyleSheet, TouchableOpacity, View } from 'react-native';

interface CarouselProps<T> extends ScrollViewProps {
  data: T[];
  renderItem: ListRenderItem<T> | null | undefined;
  itemWidth?: number;
  hideNav?: boolean;
}

export const SimpleCarousel = <T,>(props: CarouselProps<T>) => {
  const { data, renderItem, itemWidth = 200, hideNav, ...prps } = props;
  const flatListRef = useRef<FlatList>(null);
  const [currentOffset, setCurrentOffset] = useState(0);

  const scrollLeft = () => {
    flatListRef.current?.scrollToOffset({
      offset: currentOffset - itemWidth,
      animated: true,
    });
  };

  const scrollRight = () => {
    flatListRef.current?.scrollToOffset({
      offset: currentOffset + itemWidth,
      animated: true,
    });
  };

  return (
    <View style={styles.carouselWrapper}>
      {!hideNav && (
        <TouchableOpacity style={styles.navArrow} onPress={scrollLeft}>
          <Ionicons name="chevron-back" size={20} color={MainColor} />
        </TouchableOpacity>
      )}
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        onScroll={e => setCurrentOffset(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
        {...prps}
      />
      {!hideNav && (
        <TouchableOpacity style={[styles.navArrow, styles.right]} onPress={scrollRight}>
          <Ionicons name="chevron-forward" size={20} color={MainColor} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  carouselWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: MainColor,
    borderWidth: 1,
    zIndex: 10,
    position: 'absolute',
  },
  right: {
    right: 0,
  },
});
