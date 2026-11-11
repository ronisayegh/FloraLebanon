import { DefaultContextProvider } from '@/hooks';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';
export const unstable_settings = {
  initialRouteName: '(tabs)',
};
export default function RootLayoutNav() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DefaultContextProvider>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="Pages/LoginFlow/Login" />
          <Stack.Screen name="Pages/LoginFlow/Signup" />
          <Stack.Screen name="Pages/LoginFlow/ForgotPassword" />
          <Stack.Screen name="Modals" />
        </Stack>
      </DefaultContextProvider>
    </GestureHandlerRootView>
  );
}
