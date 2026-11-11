import { IS_DEV } from '@/constants/Config';
import { Redirect } from 'expo-router';
import React from 'react';
import DevScreen from '../Pages/Dev';

export default function DevTab() {
  if (!IS_DEV) return <Redirect href="/(tabs)" />;
  return <DevScreen />;
}
