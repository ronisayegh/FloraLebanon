import { IS_IOS, MainColor } from '@/constants/Config';
import React, { useCallback } from 'react';
import { StyleProp, StyleSheet, Switch, SwitchProps, View, ViewStyle } from 'react-native';
import { ThemedTxt, ThemedTxtProps } from '../ThemedTxt';

export interface SwitchToggleProps {
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
  labelProps?: ThemedTxtProps;
  switchProps?: SwitchProps;
  style?: StyleProp<ViewStyle>;
  reverse?: boolean;
}
export const SwitchToggle: React.FC<SwitchToggleProps> = props => {
  const { label, value, onValueChange, labelProps, switchProps, style, reverse } = props;
  const toggleSwitch = useCallback(() => {
    onValueChange(!value);
  }, [onValueChange, value]);
  return (
    <View style={[styles.container, style]}>
      {label && reverse && <ThemedTxt text={label} fontSize={14} {...labelProps} />}
      <Switch
        trackColor={{ false: 'grey', true: MainColor }}
        thumbColor="lightgray"
        onValueChange={toggleSwitch}
        value={value}
        {...switchProps}
        style={IS_IOS && { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
      />
      {label && !reverse && <ThemedTxt text={label} fontSize={14} {...labelProps} variant="Secondary" />}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
