import { Card, KeyboardScreenWrapper, SafeInsetsWrapper, Scroll, TextInputIcon, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import ModalHeader from '@/components/basic/Header';
import { Key, Mail, UserCirlce } from '@/components/basic/Icons';
import { MainColor } from '@/constants/Config';
import { ValidateEmail, ValidateFullName, ValidatePassword } from '@/constants/Validation';
import { useAppDialog, useDefaultContext } from '@/hooks';
import { createSessionSnapshot, Register } from '@/services';
import { GlobalStyle } from '@/styles';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

const getSignupErrorMessage = (code?: string, fallbackMessage?: string) => {
  switch (code) {
    case 'EMAIL_ALREADY_EXISTS':
      return 'An account with this email already exists.';
    case 'VALIDATION_ERROR':
      return 'Please check your details and try again.';
    case 'ACCOUNT_INACTIVE':
      return 'This account exists but is inactive. Please contact support or an administrator.';
    case 'INTERNAL_SERVER_ERROR':
      return 'The server is having trouble right now. Please try again in a moment.';
    default:
      return fallbackMessage || 'Unable to create the account right now.';
  }
};

export default function SignupScreen() {
  const { SessionContext } = useDefaultContext();
  const { showDialog, dialogNode } = useAppDialog();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const splitFullName = (value: string) => {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || undefined };
  };

  const handleSignup = async () => {
    if (!ValidateFullName(fullName)) {
      showDialog({ title: 'Invalid name', message: 'Enter your full name.' });
      return;
    }
    if (!ValidateEmail(email)) {
      showDialog({ title: 'Invalid email', message: 'Enter a valid email address.' });
      return;
    }
    if (!ValidatePassword(password)) {
      showDialog({ title: 'Invalid password', message: 'Enter a stronger password.' });
      return;
    }

    const { firstName, lastName } = splitFullName(fullName);
    setSubmitting(true);
    try {
      const response = await Register(email.trim().toLowerCase(), password, firstName, lastName);
      if (!response.success) {
        showDialog({ title: 'Signup failed', message: getSignupErrorMessage(response.error.code, response.error.message) });
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
            : 'Unable to create the account right now.';
      const message = getSignupErrorMessage(code, fallbackMessage);
      showDialog({ title: 'Signup failed', message });
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
              <ThemedTxt text="Create an account" fontWeight="800" rem={2.25} />
            </View>
            <Card style={GlobalStyle.tMar24} showBorder>
              <ThemedTxt text="Full Name" fontWeight="700" rem={1.25} style={GlobalStyle.bMar8} />
              <TextInputIcon placeholder="Enter your full name" Icon={UserCirlce} value={fullName} validate={ValidateFullName} onChangeText={setFullName} />
              <ThemedTxt text="Email Address" fontWeight="700" rem={1.25} style={[GlobalStyle.tMar16, GlobalStyle.bMar8]} />
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
                validate={ValidatePassword}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                passwordProps={{ show: true }}
              />
              <ThemedBtnTxt
                text={isSubmitting ? 'Creating Account...' : 'Create Account'}
                buttonStyle={[GlobalStyle.pad12, GlobalStyle.tMar8]}
                rem={1}
                onPress={handleSignup}
                disabled={isSubmitting}
                enabled={!isSubmitting}
              />
            </Card>
            <View style={[GlobalStyle.row, GlobalStyle.flexCenter]}>
              <ThemedTxt text="Already have an account? " variant="Secondary" />
              <TouchableOpacity onPress={() => router.push('/Pages/LoginFlow/Login')}>
                <ThemedTxt text="Login" color={MainColor} fontWeight="700" />
              </TouchableOpacity>
            </View>
          </Scroll>
        </ThemedView>
      </KeyboardScreenWrapper>
      {dialogNode}
    </SafeInsetsWrapper>
  );
}
