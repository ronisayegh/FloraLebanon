import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Logging from '../Logging';
import { GetRandomUUID } from '../Static';
import { CurrentSessionUUIDKey, TokenKey } from './keys';

// expo-secure-store has no web implementation, so on web every save silently
// failed and the auth token was lost (users got logged out on the next
// authenticated request). Web is only used as a dev preview, so fall back to
// localStorage there. Native platforms keep using the OS keychain/keystore.
const webStorage = Platform.OS === 'web' && typeof window !== 'undefined' ? window.localStorage : null;

export const SecureStoreManager = {
  async setItem(key: string, value: string) {
    try {
      if (webStorage) webStorage.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch (e) {
      Logging.Logger.error('Error saving data', e);
    }
  },
  async getItem(key: string) {
    try {
      if (webStorage) return webStorage.getItem(key);
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (e) {
      Logging.Logger.error('Error retrieving data', e);
      return null;
    }
  },
  async deleteItem(key: string) {
    try {
      if (webStorage) webStorage.removeItem(key);
      else await SecureStore.deleteItemAsync(key);
    } catch (e) {
      Logging.Logger.error('Error deleting data', e);
    }
  },
  async setToken(token: string) {
    await this.setItem(TokenKey, token);
  },
  async getToken() {
    return await this.getItem(TokenKey);
  },
  async clearToken() {
    await this.deleteItem(TokenKey);
  },
  async setSessionUUID(uuid?: string) {
    await this.setItem(CurrentSessionUUIDKey, uuid || GetRandomUUID());
  },
  async getSessionUUID() {
    const value = await this.getItem(CurrentSessionUUIDKey);
    if (value) return value;
    let uuid = GetRandomUUID();
    await this.setSessionUUID(uuid);
    return uuid;
  },
};
