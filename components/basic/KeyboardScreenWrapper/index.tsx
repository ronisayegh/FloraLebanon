import React from 'react';
import { KeyboardAvoidingView, KeyboardAvoidingViewProps } from 'react-native-keyboard-controller';

export const KeyboardScreenWrapper: React.FC<KeyboardAvoidingViewProps> = props => {
  const { children, style, ...o } = props;
  return (
    <KeyboardAvoidingView style={[{ flex: 1 }, style]} {...o}>
      {children}
    </KeyboardAvoidingView>
  );
};
