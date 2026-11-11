import { useDefaultContext } from '@/hooks/DefaultContext';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

type VariantType = 'Container' | 'Primary' | 'Secondary' | 'Transparent';

interface ThemedViewProps extends ViewProps {
  shadow?: boolean;
  container?: boolean;
  variant?: VariantType;
}
export const ThemedView: React.FC<ThemedViewProps> = props => {
  const { shadow, style, variant, ...prps } = props;
  const Theme = useDefaultContext().ThemeContext.value;
  const bgColor = {
    Container: Theme.containerBg,
    Primary: Theme.primaryBg,
    Secondary: Theme.secondaryBg,
    Transparent: shadow ? Theme.containerBg : undefined,
  }[variant || 'Container'];
  return <View style={[{ backgroundColor: bgColor }, shadow && [styles.shadow, { shadowColor: Theme.shadowColor }], style]} {...prps} />;
};
const styles = StyleSheet.create({
  shadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
