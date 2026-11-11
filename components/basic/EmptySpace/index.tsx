import { GlobalStyle } from '@/styles';
import React from 'react';
import { View, ViewProps } from 'react-native';
export const EmptySpace: React.FC<{ width?: number; height?: number } & ViewProps> = ({ width, height, style, ...prps }) => (
  <View style={[GlobalStyle.flex, { width, height }, style]} pointerEvents="box-none" {...prps} />
);
