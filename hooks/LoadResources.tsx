import { STEP_PLACEHOLDER_IMAGES } from '@/constants/Assets/stepPlaceholders';
import { CreateCacheFolder, SecureStoreManager } from '@/constants/Stores';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import * as React from 'react';
import type { AuthSession } from '../@Types';
import { EmptyAuthSession } from '../@Types';
import { createLocalGuestSession, createSessionSnapshot, GetMe, getStoredSessionSnapshot, GuestAccess, persistSessionSnapshot } from '../services';

export default function useCachedResources() {
  const [isLoaded, setLoaded] = React.useState(false);
  const [isFontLoaded, setFontLoaded] = React.useState(false);
  const [isCacheLoaded, setCacheLoaded] = React.useState(false);
  const [isSessionLoaded, setSessionLoaded] = React.useState(false);
  const [sessionData, setSessionData] = React.useState<AuthSession>(EmptyAuthSession);

  React.useEffect(() => {
    setLoaded(isFontLoaded && isCacheLoaded && isSessionLoaded);
  }, [isFontLoaded, isCacheLoaded, isSessionLoaded]);

  React.useEffect(() => {
    async function loadFontAsync() {
      try {
        await Font.loadAsync({
          ...Ionicons.font,
          SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),

          Montserrat: require('../assets/fonts/Montserrat/Montserrat-Regular.ttf'),
          MontserratItalic: require('../assets/fonts/Montserrat/Montserrat-Italic.ttf'),
          MontserratBold: require('../assets/fonts/Montserrat/Montserrat-Bold.ttf'),
          MontserratBoldItalic: require('../assets/fonts/Montserrat/Montserrat-BoldItalic.ttf'),
          MontserratLight: require('../assets/fonts/Montserrat/Montserrat-Light.ttf'),
          MontserratLightItalic: require('../assets/fonts/Montserrat/Montserrat-LightItalic.ttf'),
          MontserratMedium: require('../assets/fonts/Montserrat/Montserrat-Medium.ttf'),
          MontserratMediumItalic: require('../assets/fonts/Montserrat/Montserrat-MediumItalic.ttf'),
          MontserratSemiBold: require('../assets/fonts/Montserrat/Montserrat-SemiBold.ttf'),
          MontserratSemiBoldItalic: require('../assets/fonts/Montserrat/Montserrat-SemiBoldItalic.ttf'),
          MontserratExtraBold: require('../assets/fonts/Montserrat/Montserrat-ExtraBold.ttf'),
          MontserratExtraBoldItalic: require('../assets/fonts/Montserrat/Montserrat-ExtraBoldItalic.ttf'),
          MontserratExtraLight: require('../assets/fonts/Montserrat/Montserrat-ExtraLight.ttf'),
          MontserratExtraLightItalic: require('../assets/fonts/Montserrat/Montserrat-ExtraLightItalic.ttf'),
          MontserratBlack: require('../assets/fonts/Montserrat/Montserrat-Black.ttf'),
          MontserratBlackItalic: require('../assets/fonts/Montserrat/Montserrat-BlackItalic.ttf'),
          MontserratThin: require('../assets/fonts/Montserrat/Montserrat-Thin.ttf'),
          MontserratThinItalic: require('../assets/fonts/Montserrat/Montserrat-ThinItalic.ttf'),
        });
      } catch (_error) {
      } finally {
        setFontLoaded(true);
      }
    }

    async function loadCacheAsync() {
      try {
        await CreateCacheFolder();
      } catch (_error) {
      } finally {
        setCacheLoaded(true);
      }
    }

    async function preloadStepAssetsAsync() {
      try {
        await Asset.loadAsync(STEP_PLACEHOLDER_IMAGES as any);
      } catch (_error) {}
    }

    async function loadSessionAsync() {
      let resolvedSession = createLocalGuestSession();

      try {
        const cachedSession = await getStoredSessionSnapshot();
        if (cachedSession) {
          resolvedSession = cachedSession;
          setSessionData(cachedSession);
        }

        const token = await SecureStoreManager.getToken();
        if (token) {
          const response = await GetMe();
          if (response.success) {
            resolvedSession = createSessionSnapshot(response.data.user);
            await persistSessionSnapshot(resolvedSession);
            setSessionData(resolvedSession);
            return;
          }
        }

        const deviceId = await SecureStoreManager.getSessionUUID();
        const guestResponse = await GuestAccess(deviceId);
        if (guestResponse.success) {
          resolvedSession = createSessionSnapshot(guestResponse.data.user);
          setSessionData(resolvedSession);
          return;
        }
      } catch (_error) {
      } finally {
        if (resolvedSession.status === 'local_guest' && !resolvedSession.user) await persistSessionSnapshot(resolvedSession);
        setSessionData(resolvedSession);
        setSessionLoaded(true);
      }
    }

    loadSessionAsync();
    loadFontAsync();
    loadCacheAsync();
    void preloadStepAssetsAsync();
  }, []);

  return { isLoaded, sessionData };
}
