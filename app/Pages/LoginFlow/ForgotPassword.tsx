import { Card, KeyboardScreenWrapper, SafeInsetsWrapper, Scroll, TextInputIcon, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import ModalHeader from '@/components/basic/Header';
import { Mail } from '@/components/basic/Icons';
import { ValidateEmail } from '@/constants/Validation';
import { useAppDialog } from '@/hooks';
import { RequestPasswordReset } from '@/services';
import { GlobalStyle } from '@/styles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

const getForgotPasswordErrorMessage = (code?: string, fallbackMessage?: string) => {
  switch (code) {
    case 'VALIDATION_ERROR':
      return 'Please enter a valid email address.';
    case 'INTERNAL_SERVER_ERROR':
      return 'The server is having trouble right now. Please try again in a moment.';
    default:
      return fallbackMessage || 'Unable to send the reset request right now.';
  }
};

export default function ForgotPasswordScreen() {
  const { showDialog, closeDialog, dialogNode } = useAppDialog();
  const [email, setEmail] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!ValidateEmail(email)) {
      showDialog({ title: 'Invalid email', message: 'Enter a valid email address.' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await RequestPasswordReset(email.trim().toLowerCase());
      if (!response.success) {
        showDialog({ title: 'Reset failed', message: getForgotPasswordErrorMessage(response.error.code, response.error.message) });
        return;
      }

      showDialog({
        title: 'Check your email',
        message: 'If an account exists for this email, a password reset link has been sent.',
        primaryLabel: 'Back to login',
        onPrimary: () => {
          closeDialog();
          router.replace('/Pages/LoginFlow/Login');
        },
        secondaryLabel: 'Close',
        onSecondary: closeDialog,
      });
    } catch (error) {
      const code = typeof error === 'object' && error && 'error' in error ? (error as any).error?.code : undefined;
      const fallbackMessage =
        typeof error === 'object' && error && 'error' in error
          ? (error as any).error?.message
          : error instanceof Error
            ? error.message
            : 'Unable to send the reset request right now.';
      showDialog({ title: 'Reset failed', message: getForgotPasswordErrorMessage(code, fallbackMessage) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeInsetsWrapper>
      <KeyboardScreenWrapper>
        <ThemedView variant="Container" style={GlobalStyle.flex}>
          <ModalHeader />
          <Scroll>
            <View style={GlobalStyle.tMar16}>
              <ThemedTxt text="Forgot Password" fontWeight="800" rem={2.25} />
              <ThemedTxt
                text="Enter your email and we will send you a reset link if the account exists."
                variant="Secondary"
                rem={1}
                style={GlobalStyle.tMar4}
              />
            </View>
            <Card style={GlobalStyle.tMar24} showBorder>
              <ThemedTxt text="Email Address" fontWeight="700" rem={1.25} style={GlobalStyle.bMar8} />
              <TextInputIcon
                placeholder="Enter your email"
                Icon={Mail}
                value={email}
                validate={ValidateEmail}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <ThemedBtnTxt
                text={isSubmitting ? 'Sending Reset Link...' : 'Send Reset Link'}
                buttonStyle={[GlobalStyle.pad12, GlobalStyle.tMar8]}
                rem={1}
                onPress={handleSubmit}
                disabled={isSubmitting}
                enabled={!isSubmitting}
              />
            </Card>
          </Scroll>
        </ThemedView>
      </KeyboardScreenWrapper>
      {dialogNode}
    </SafeInsetsWrapper>
  );
}
