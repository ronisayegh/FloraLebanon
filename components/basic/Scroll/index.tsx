import { GlobalStyle } from '@/styles';
import React, { RefAttributes, useImperativeHandle, useRef } from 'react';
import { RefreshControl, ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
export type ScrollProps = ScrollViewProps & {
  refresh?: {
    onRefresh: () => void;
    isLoading: boolean;
  };
  flex?: boolean;
  leaveKeyboard?: boolean;
  keyboardAware?: boolean;
};

export const Scroll = React.forwardRef<ScrollView, ScrollProps>((props, ref) => {
  const { refresh, flex = true, contentContainerStyle, keyboardAware = true, ...prps } = props;
  const r = useRef<any>(null);
  const flattenedContentContainerStyle = StyleSheet.flatten(contentContainerStyle) || {};
  useImperativeHandle(ref, () => r.current as ScrollView);
  if (refresh) prps.refreshControl = <RefreshControl refreshing={refresh.isLoading} onRefresh={refresh.onRefresh} />;
  const scrollProps: ScrollProps & RefAttributes<ScrollView> = {
    ref: r,
    scrollEventThrottle: 16,
    keyboardShouldPersistTaps: props.keyboardShouldPersistTaps ?? (props.leaveKeyboard ? 'always' : 'never'),
    contentContainerStyle: { paddingHorizontal: 16, ...flattenedContentContainerStyle },
    ...prps,
    style: [flex && GlobalStyle.flex, props.style],
  };
  return keyboardAware ? <KeyboardAwareScrollView bottomOffset={80} {...scrollProps} /> : <ScrollView {...scrollProps} />;
});
