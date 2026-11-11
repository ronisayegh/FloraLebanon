import { MainColor } from '@/constants/Config';
import { Normalize } from '@/constants/Helper';
import { GlobalStyle } from '@/styles';
import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedTxt } from '../ThemedTxt';

type AppBrandTitleProps = {
  style?: StyleProp<ViewStyle>;
  showBorder?: boolean;
};

export const AppBrandTitle: React.FC<AppBrandTitleProps> = ({ style, showBorder }) => (
  <View style={[GlobalStyle.alignStart]}>
    <View style={[styles.container, showBorder && styles.border, style]}>
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <ThemedTxt text="FloraLebanon" rem={1.5} fontWeight="700" nowwarp />
      <ThemedTxt text="Collect" rem={1.125} fontWeight="700" italic nowwarp style={styles.collectText} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  border: {
    borderBottomWidth: 1,
    borderColor: MainColor,
  },
  logo: {
    width: Normalize(32),
    height: Normalize(32),
    marginRight: Normalize(8),
  },
  collectText: {
    marginLeft: Normalize(8),
  },
});
