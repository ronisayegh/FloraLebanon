import { useDefaultContext } from '@/hooks';
import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SafeInsetsWrapperProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  includeTopInset?: boolean;
  includeBottomInset?: boolean;
};
export const SafeInsetsWrapper: React.FC<SafeInsetsWrapperProps> = props => {
  const { children, style, includeTopInset = true, includeBottomInset = true } = props;
  const theme = useDefaultContext().ThemeContext.value;
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: theme.containerBg,
          paddingTop: (includeTopInset ? insets.top : 0) + 4,
          paddingBottom: includeBottomInset ? insets.bottom : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
