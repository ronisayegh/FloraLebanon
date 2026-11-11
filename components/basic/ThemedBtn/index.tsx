import { ThemeType } from '@/constants/Themes';
import { useDefaultContext } from '@/hooks/DefaultContext';
import React from 'react';
import { StyleProp, TextStyle, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import { VariantType as TextVariant, ThemedTxt, ThemedTxtProps } from '../ThemedTxt';

export type VariantType = 'Default' | 'OutLine' | 'Warning';

export interface ThemedBtnProps extends TouchableOpacityProps {
  variant?: VariantType;
  enabled?: boolean;
  children?: React.ReactNode;
}
export interface ThemedBtnTxtProps extends Omit<Omit<ThemedBtnProps & ThemedTxtProps, 'variant'>, 'style'> {
  textStyle?: StyleProp<TextStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  textVariant?: TextVariant;
  variant?: VariantType;
}
function getTextColor(buttonType: VariantType, Theme: ThemeType, enabled: boolean = true) {
  if (!enabled) return Theme.onDisabled;
  switch (buttonType) {
    case 'OutLine':
      return Theme.onSecondary;
    case 'Warning':
      return Theme.onPrimary;
    case 'Default':
    default:
      return Theme.onPrimary;
  }
}
function getStyle(buttonType: VariantType, Theme: ThemeType, enabled: boolean = true) {
  switch (buttonType) {
    case 'OutLine':
      return { borderWidth: 1, backgroundColor: 'transparent', borderColor: Theme.primary };
    case 'Warning':
      return { backgroundColor: enabled ? Theme.warning : Theme.disabledbg };
    case 'Default':
    default:
      return { backgroundColor: enabled ? Theme.primary : Theme.disabledbg };
  }
}
export const ThemedBtn: React.FC<ThemedBtnProps> = props => {
  const Theme = useDefaultContext().ThemeContext.value;
  return (
    <TouchableOpacity
      {...props}
      style={[getStyle(props.variant || 'Default', Theme, props.enabled), { borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, props.style]}
    >
      {props.children}
    </TouchableOpacity>
  );
};
export const ThemedBtnTxt: React.FC<ThemedBtnTxtProps> = props => {
  const { children, buttonStyle, variant, textStyle, textVariant } = props;
  const { onPress, onLongPress, onPressIn, onPressOut, onLayout, onFocus, onBlur, ...prps } = props;
  const Theme = useDefaultContext().ThemeContext.value;
  return (
    <ThemedBtn {...props} style={buttonStyle}>
      {children}
      <ThemedTxt {...prps} color={getTextColor(variant || 'Default', Theme, props.enabled)} style={textStyle} variant={textVariant} />
    </ThemedBtn>
  );
};
