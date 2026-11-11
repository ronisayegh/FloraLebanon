import type { AuthSession } from '@/@Types';
import { IS_ANDROID, IS_IOS } from '@/constants/Config';
import Logging from '@/constants/Logging';
import { SecureStoreManager } from '@/constants/Stores';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { RegisterNotificationDeviceToken, UnregisterNotificationDeviceToken } from './index';

const NOTIFICATION_CHANNEL_ID = 'default';
const EXPO_PUSH_TOKEN_TIMEOUT_MS = 10000;
const EXPO_PROJECT_ID = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type DeviceTokenInput = {
  token: string;
  platform: 'ANDROID' | 'IOS';
  deviceId: string;
};

let lastRegisteredToken: string | null = null;
let registrationPromise: Promise<Awaited<ReturnType<typeof RegisterNotificationDeviceToken>> | null> | null = null;

const toErrorInfo = (error: unknown) => {
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack };
  return error;
};

async function getExpoPushTokenWithTimeout() {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      Notifications.getExpoPushTokenAsync({ projectId: EXPO_PROJECT_ID }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Expo push token creation timed out after ${EXPO_PUSH_TOKEN_TIMEOUT_MS}ms.`)),
          EXPO_PUSH_TOKEN_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function getCurrentDeviceNotificationToken(options?: { requestPermission?: boolean }): Promise<DeviceTokenInput | null> {
  if (!IS_ANDROID && !IS_IOS) return null;

  if (IS_ANDROID) {
    try {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'Default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    } catch (error) {
      Logging.Logger.warn('NOTIFICATION_ANDROID_CHANNEL_FAILED', toErrorInfo(error));
      throw error;
    }
  }

  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted && options?.requestPermission) {
    permissions = await Notifications.requestPermissionsAsync();
  }

  if (!permissions.granted) {
    Logging.Logger.warn('NOTIFICATION_PERMISSION_NOT_GRANTED', permissions);
    return null;
  }

  if (!EXPO_PROJECT_ID) {
    Logging.Logger.warn('NOTIFICATION_MISSING_EXPO_PROJECT_ID');
    return null;
  }

  let token: Notifications.ExpoPushToken;
  try {
    token = await getExpoPushTokenWithTimeout();
  } catch (error) {
    Logging.Logger.warn('NOTIFICATION_EXPO_TOKEN_FAILED', toErrorInfo(error));
    throw error;
  }

  const deviceId = await SecureStoreManager.getSessionUUID();

  return {
    token: String(token.data),
    platform: IS_IOS ? 'IOS' : 'ANDROID',
    deviceId,
  };
}

export async function registerNotificationDeviceTokenForSession(session: AuthSession) {
  if (registrationPromise) {
    return registrationPromise;
  }

  if (session.status !== 'authenticated' || !session.user || session.user.role === 'GUEST') {
    return null;
  }

  registrationPromise = (async () => {
    const input = await getCurrentDeviceNotificationToken({ requestPermission: true });
    if (!input) return null;

    const response = await RegisterNotificationDeviceToken(input);
    if (response.success) {
      lastRegisteredToken = input.token;
    } else {
      Logging.Logger.warn('NOTIFICATION_REGISTER_API_FAILED', response);
    }
    return response;
  })()
    .catch(error => {
      Logging.Logger.warn('NOTIFICATION_REGISTER_FAILED', toErrorInfo(error));
      Logging.Logger.warn('Failed to register notification device token.', error);
      return null;
    })
    .finally(() => {
      registrationPromise = null;
    });

  return registrationPromise;
}

export async function unregisterCurrentNotificationDeviceToken() {
  try {
    const input = await getCurrentDeviceNotificationToken({ requestPermission: false });
    const token = input?.token || lastRegisteredToken;
    if (!input || !token) {
      return null;
    }

    const response = await UnregisterNotificationDeviceToken({ ...input, token });
    if (response.success) {
      lastRegisteredToken = null;
    } else {
      Logging.Logger.warn('NOTIFICATION_UNREGISTER_API_FAILED', response);
    }
    return response;
  } catch (error) {
    Logging.Logger.warn('NOTIFICATION_UNREGISTER_FAILED', toErrorInfo(error));
    Logging.Logger.warn('Failed to unregister notification device token.', error);
    return null;
  }
}
