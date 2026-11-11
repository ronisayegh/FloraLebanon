import AsyncStorage from '@react-native-async-storage/async-storage';
import { Request } from '../../@Types';
import Logging from '../Logging';
import { isUndefined } from '../Static';
export const StoreManager = {
  async setItem(key: string, value: string) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      Logging.Logger.error('Error saving data', e);
    }
  },
  async getItem<T = string>(key: string): Promise<T | null> {
    try {
      return (await AsyncStorage.getItem(key)) as T;
    } catch (e) {
      Logging.Logger.error('Error retrieving data', e);
      return null;
    }
  },
  async deleteItem(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      Logging.Logger.error('Error deleting data', e);
    }
  },
  async setJson(key: string, value: object) {
    try {
      await this.setItem(key, JSON.stringify(value));
    } catch (e) {
      Logging.Logger.error('Error deleting data', e);
    }
  },
  async getJson(key: string) {
    const value = await this.getItem(key);
    if (value)
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
  },
  async fetchAndCacheData<T>(key: string, fetchData: () => Promise<T>, force = false): Promise<{ data: T | undefined; error: Error | undefined }> {
    let data: T | undefined;
    let error;
    try {
      if (!force) {
        data = (await this.getJson(key)) as T;
      }
      if (isUndefined(data)) {
        const newData = (await fetchData()) as Request<T>;
        if (!newData.success) throw new Error(newData.message);
        await this.setJson(key, newData.data as any);
        data = newData.data;
      }
    } catch (e) {
      error = e instanceof Error ? e : new Error('An error occurred');
    }
    return { data, error };
  },
  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      Logging.Logger.error('Error clearing data', e);
    }
  },
};
