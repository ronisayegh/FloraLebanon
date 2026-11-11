import { MainColor } from '@/constants/Config';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedTxt, ThemedTxtProps } from '../ThemedTxt';
import { ThemedView } from '../ThemedView';

interface BaseCardProps {
  children: React.ReactNode;
  title?: string;
  Icon?: React.ReactNode;
  showBorder?: boolean;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  noBackground?: boolean;
  shadow?: boolean;
  txtProps?: ThemedTxtProps;
}

export const Card = (props: BaseCardProps) => {
  const { children, title, Icon, showBorder, noBackground, style, txtProps, shadow = true } = props;
  return (
    <ThemedView
      style={[styles.cardBase, showBorder && { borderWidth: 1, borderColor: MainColor }, style]}
      shadow={shadow}
      variant={noBackground ? 'Transparent' : 'Primary'}
    >
      {title && (
        <View style={styles.cardHeader}>
          {Icon}
          <ThemedTxt text={title} color={MainColor} rem={1} fontWeight="500" style={styles.cardTitle} {...txtProps} />
        </View>
      )}
      {children}
    </ThemedView>
  );
};
const styles = StyleSheet.create({
  cardBase: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    flexShrink: 1,
  },
});
