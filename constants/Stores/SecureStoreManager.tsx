import * as SecureStore from 'expo-secure-store';
import Logging from '../Logging';
import { GetRandomUUID } from '../Static';
import { CurrentSessionUUIDKey, TokenKey } from './keys';
export const SecureStoreManager = {
  async setItem(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      Logging.Logger.error('Error saving data', e);
    }
  },
  async getItem(key: string) {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (e) {
      Logging.Logger.error('Error retrieving data', e);
      return null;
    }
  },
  async deleteItem(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
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
