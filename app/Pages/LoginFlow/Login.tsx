import { Card, KeyboardScreenWrapper, SafeInsetsWrapper, Scroll, TextInputIcon, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import ModalHeader from '@/components/basic/Header';
import { Key, Mail } from '@/components/basic/Icons';
import { MainColor } from '@/constants/Config';
import { isStringNotEmpty } from '@/constants/Static';
import { ValidateEmail } from '@/constants/Validation';
import { useAppDialog, useDefaultContext } from '@/hooks';
import { createSessionSnapshot, Login } from '@/services';
import { GlobalStyle } from '@/styles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

const getLoginErrorMessage = (code?: string, fallbackMessage?: string) => {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 'The email or password you entered is incorrect.';
    case 'ACCOUNT_INACTIVE':
      return 'Your account is inactive. Please contact support or an administrator.';
    case 'VALIDATION_ERROR':
      return 'Please check your email and password and try again.';
    case 'AUTH_INVALID':
      return 'Your login session is invalid. Please try signing in again.';
    case 'AUTH_TOKEN_EXPIRED':
      return 'Your session expired. Please sign in again.';
    case 'AUTH_TOKEN_MISSING':
    case 'AUTH_REQUIRED':
      return 'Please sign in to continue.';
    case 'INTERNAL_SERVER_ERROR':
      return 'The server is having trouble right now. Please try again in a moment.';
    default:
      return fallbackMessage || 'Unable to login right now.';
  }
};

export default function LoginScreen() {
  const { SessionContext } = useDefaultContext();
  const { showDialog, dialogNode } = useAppDialog();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!ValidateEmail(email)) {
      showDialog({ title: 'Invalid email', message: 'Enter a valid email address.' });
      return;
    }
    if (!isStringNotEmpty(password)) {
      showDialog({ title: 'Invalid password', message: 'Enter your password.' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await Login(email.trim().toLowerCase(), password);
      if (!response.success) {
        showDialog({ title: 'Login failed', message: getLoginErrorMessage(response.error.code, response.error.message) });
        return;
      }
      await SessionContext.setSession(createSessionSnapshot(response.data.user));
      router.replace('/');
    } catch (error) {
      const code = typeof error === 'object' && error && 'error' in error ? (error as any).error?.code : undefined;
      const fallbackMessage =
        typeof error === 'object' && error && 'error' in error
          ? (error as any).error?.message
          : error instanceof Error
            ? error.message
            : 'Unable to login right now.';
      const message = getLoginErrorMessage(code, fallbackMessage);
      showDialog({ title: 'Login failed', message });
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
              <ThemedTxt text="Welcome to" fontWeight="800" rem={2.25} />
              <ThemedTxt text="FloraLebanon Collect" variant="Secondary" rem={1.25} style={GlobalStyle.tMar4} />
            </View>
            <Card style={GlobalStyle.tMar24} showBorder>
              <ThemedTxt text="Email or Phone" fontWeight="700" rem={1.25} style={GlobalStyle.bMar8} />
              <TextInputIcon
                placeholder="Enter your email"
                Icon={Mail}
                value={email}
                validate={ValidateEmail}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <ThemedTxt text="Password" fontWeight="700" rem={1.25} style={[GlobalStyle.tMar16, GlobalStyle.bMar8]} />
              <TextInputIcon
                placeholder="Enter your password"
                Icon={Key}
                validate={isStringNotEmpty}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity style={GlobalStyle.tMar12} onPress={() => router.push('/Pages/LoginFlow/ForgotPassword')}>
                <ThemedTxt text="Forgot Password?" color={MainColor} fontWeight="600" right fontSize={14} />
              </TouchableOpacity>
              <ThemedBtnTxt
                text={isSubmitting ? 'Logging In...' : 'Login'}
                buttonStyle={[GlobalStyle.pad12, GlobalStyle.tMar8]}
                rem={1}
                onPress={handleLogin}
                disabled={isSubmitting}
                enabled={!isSubmitting}
              />
            </Card>
            <View style={[GlobalStyle.row, GlobalStyle.flexCenter]}>
              <ThemedTxt text="Don't have an account? " variant="Secondary" />
              <TouchableOpacity onPress={() => router.push('/Pages/LoginFlow/Signup')}>
                <ThemedTxt text="Sign Up" color={MainColor} fontWeight="700" />
              </TouchableOpacity>
            </View>
          </Scroll>
        </ThemedView>
      </KeyboardScreenWrapper>
      {dialogNode}
    </SafeInsetsWrapper>
  );
}
