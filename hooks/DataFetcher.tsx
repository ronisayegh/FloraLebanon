import { Request } from '@/@Types';
import Logging from '@/constants/Logging';
import { StoreManager } from '@/constants/Stores';
import { useCallback, useEffect, useState } from 'react';
export type FetchFC<T> = {
  data: T | null;
  isLoading: boolean;
  onRefresh: (showLoading?: boolean) => Promise<void>;
  error: Error | null;
};
export type FetchCacheFC<T> = FetchFC<T> & {
  save: (data: T) => Promise<void>;
};
export type FetchProps<T> = {
  key: string;
  fetchFC: () => Promise<T>;
  hideLoading?: boolean;
  raw?: boolean;
  caller?: string | 'user';
  load?: boolean;
  map?: (data: any) => T;
  cache?: boolean;
};
export const useFetchAndCache = <T,>(props: FetchProps<T>): FetchCacheFC<T> => {
  const { key, fetchFC, hideLoading, caller, raw, map, load = true, cache = true } = props;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const save = (data: T) => data && StoreManager.setJson(key, data as any);
  const fetchAndUpdateData = useCallback(
    async (showLoading = true) => {
      try {
        Logging.Logger.logColorFirst('BgYellow', 'useFetchAndCache', caller);
        if (!hideLoading && showLoading) setIsLoading(true);
        const response = await fetchFC();
        let data: T | null = null;
        if (raw) data = response as T;
        else {
          const request = response as Request<T>;
          if (!request.success) throw new Error(request.message);
          if (!request.data) throw new Error('No data');
          data = map ? map(request.data) : request.data;
        }
        setData(data);
        if (cache && data) await save(data);
      } catch (err) {
        Logging.Logger.logColorFirst('BgRed', 'useFetchAndCache error1', err);
        setError(err instanceof Error ? err : new Error('Error fetching data'));
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFC, key],
  );
  const loadCachedData = useCallback(async () => {
    try {
      setIsLoading(true);
      const cachedData = await StoreManager.getJson(key);
      if (cachedData !== null) setData(cachedData);
    } catch (err) {
      Logging.Logger.logColorFirst('BgRed', 'useFetchAndCache error2', err);
      setError(err instanceof Error ? err : new Error('Error loading cached data'));
    } finally {
      setIsLoading(false);
    }
    if (load) fetchAndUpdateData();
  }, [key, load]);
  useEffect(() => {
    loadCachedData();
  }, [fetchAndUpdateData]);
  const onRefresh = (showLoading = true) => fetchAndUpdateData(showLoading);
  return { data, isLoading, onRefresh, error, save };
};
export const useFetch = <T,>(props: Omit<FetchProps<T>, 'key'>): FetchFC<T> => {
  const { fetchFC, hideLoading, caller, raw, map, load = true } = props;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const fetch = useCallback(
    async (showLoading = true) => {
      try {
        Logging.Logger.logColorFirst('BgYellow', 'useFetch', caller);
        if (!hideLoading && showLoading) setIsLoading(true);
        const response = await fetchFC();
        if (raw) {
          setData(response as T);
          return;
        }
        const request = response as Request<T>;
        if (!request.success) throw new Error(request.message);
        setData(map ? map(request.data) : request.data);
      } catch (err) {
        Logging.Logger.logColorFirst('BgRed', 'useFetch error', err);
        setError(err instanceof Error ? err : new Error('Error fetching data'));
      } finally {
        setIsLoading(false);
      }
    },
    [fetchFC, hideLoading],
  );
  useEffect(() => {
    if (load) fetch();
  }, [fetch]);
  const onRefresh = (showLoading = true) => fetch(showLoading);
  return { data, isLoading, onRefresh, error };
};
