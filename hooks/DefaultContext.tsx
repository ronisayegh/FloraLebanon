import type { AuthSession } from '@/@Types';
import { CustomSplashScreen } from '@/components/CustomSplashScreen';
import type { FileType } from '@/constants/Helper';
import { SecureStoreManager, StoreManager, ThemeKey } from '@/constants/Stores';
import { ThemeKeys, ThemeProps, ThemeType, Themes } from '@/constants/Themes';
import NetInfo from '@react-native-community/netinfo';
import { SplashScreen } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import React, { Dispatch, SetStateAction, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, useColorScheme } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GetMe, GuestAccess, createLocalGuestSession, createSessionSnapshot, persistSessionSnapshot } from '../services';
import {
  QueueSyncSummary,
  QueuedSubmission,
  SubmissionAttemptResult,
  getQueuedSubmissions,
  removeQueuedSubmission,
  retryAllQueuedSubmissions,
  retryQueuedSubmission,
} from '../services/submission-queue';
import { registerNotificationDeviceTokenForSession, unregisterCurrentNotificationDeviceToken } from '../services/notifications';
import useCachedResources from './LoadResources';
import { usePhoneFramePreview } from './usePhoneFramePreview';

SplashScreen.preventAutoHideAsync();

export type CacheType = { images: Map<string, { uri: string; size?: { w: number; h: number } }> };
export type RandomDataType = {
  TempCameraRoll?: any;
  TempCameraRollCrop?: {
    image: FileType;
    width: number;
    height: number;
    ratio?: [number, number];
  };
};
export type SessionStateType = {
  value: AuthSession;
  Set: Dispatch<SetStateAction<AuthSession>>;
  setSession: (session: AuthSession) => Promise<AuthSession>;
  refreshSession: () => Promise<AuthSession>;
  logout: () => Promise<AuthSession>;
};
export type ThemeStateType = { value: ThemeType; Set: (theme?: ThemeKeys) => void };
export type RandomDataStateType = { value: RandomDataType; Set: Dispatch<SetStateAction<RandomDataType>> };
export type SubmissionQueueStateType = {
  value: QueuedSubmission[];
  isSyncing: boolean;
  refreshQueue: () => Promise<QueuedSubmission[]>;
  retryAll: () => Promise<QueueSyncSummary>;
  retryOne: (queueId: string) => Promise<SubmissionAttemptResult | null>;
  removeOne: (queueId: string) => Promise<void>;
};
export type DefaultContextType = {
  SessionContext: SessionStateType;
  ThemeContext: ThemeStateType;
  RandomContext: RandomDataStateType;
  SubmissionQueueContext: SubmissionQueueStateType;
  isLoaded: boolean;
};

export const DefaultContext = createContext<DefaultContextType | undefined>(undefined);

export function useDefaultContext() {
  const context = useContext(DefaultContext);
  if (context === undefined) throw new Error('useDefaultContext must be used within a DefaultContextProvider');
  return context;
}

export const DefaultContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, sessionData } = useCachedResources();
  const colorScheme = useColorScheme();
  const PhoneFramePreview = usePhoneFramePreview();
  const [theme, setTheme] = useState<ThemeType>(Themes.light);
  const [randomData, setRandomData] = useState<RandomDataType>({});
  const [session, setSessionState] = useState<AuthSession>(sessionData);
  const [queuedSubmissions, setQueuedSubmissions] = useState<QueuedSubmission[]>([]);
  const [isQueueSyncing, setQueueSyncing] = useState(false);
  const [isCustomSplashMinimumDone, setCustomSplashMinimumDone] = useState(false);
  const sessionRef = useRef(session);
  const hasUserSessionOverrideRef = useRef(false);
  const isLoggingOutRef = useRef(false);
  const sessionWriteVersionRef = useRef(0);
  const queueSyncRef = useRef(false);
  const lastAutoQueueSyncAtRef = useRef(0);

  const setSession = useCallback(async (nextSession: AuthSession) => {
    hasUserSessionOverrideRef.current = true;
    sessionWriteVersionRef.current += 1;
    await persistSessionSnapshot(nextSession);
    setSessionState(nextSession);
    return nextSession;
  }, []);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const refreshQueue = useCallback(async () => {
    const queue = await getQueuedSubmissions();
    setQueuedSubmissions(queue);
    return queue;
  }, []);

  const retryAll = useCallback(async () => {
    if (queueSyncRef.current) return { attempted: 0, succeeded: 0, queued: queuedSubmissions.length };
    queueSyncRef.current = true;
    setQueueSyncing(true);
    try {
      const summary = await retryAllQueuedSubmissions(sessionRef.current);
      await refreshQueue();
      return summary;
    } finally {
      queueSyncRef.current = false;
      setQueueSyncing(false);
    }
  }, [queuedSubmissions.length, refreshQueue]);

  const retryDueQueuedSubmissions = useCallback(async (options?: { bypassThrottle?: boolean }) => {
    const AUTO_RETRY_THROTTLE_MS = 15_000;
    const now = Date.now();
    if (sessionRef.current.status !== 'authenticated') return;
    if (queueSyncRef.current || (!options?.bypassThrottle && now - lastAutoQueueSyncAtRef.current < AUTO_RETRY_THROTTLE_MS)) return;
    lastAutoQueueSyncAtRef.current = now;
    queueSyncRef.current = true;
    setQueueSyncing(true);
    try {
      await retryAllQueuedSubmissions(sessionRef.current, { onlyDue: true });
      await refreshQueue();
    } finally {
      queueSyncRef.current = false;
      setQueueSyncing(false);
    }
  }, [refreshQueue]);

  const retryOne = useCallback(
    async (queueId: string) => {
      setQueueSyncing(true);
      try {
        const result = await retryQueuedSubmission(queueId, sessionRef.current);
        await refreshQueue();
        return result;
      } finally {
        setQueueSyncing(false);
      }
    },
    [refreshQueue],
  );

  const removeOne = useCallback(
    async (queueId: string) => {
      await removeQueuedSubmission(queueId);
      await refreshQueue();
    },
    [refreshQueue],
  );

  const refreshSession = useCallback(async () => {
    if (isLoggingOutRef.current) return await setSession(createLocalGuestSession());

    const refreshVersion = sessionWriteVersionRef.current;
    const currentSession = sessionRef.current;
    const isRefreshStale = () => refreshVersion !== sessionWriteVersionRef.current || isLoggingOutRef.current;

    try {
      const token = await SecureStoreManager.getToken();
      if (token) {
        const response = await GetMe();
        if (isRefreshStale()) return sessionRef.current;
        if (response.success) return await setSession(createSessionSnapshot(response.data.user));
        const stillHasToken = await SecureStoreManager.getToken();
        if (stillHasToken && currentSession.status === 'authenticated') return await setSession(currentSession);
        return await setSession(createLocalGuestSession());
      }

      const deviceId = await SecureStoreManager.getSessionUUID();
      const guestResponse = await GuestAccess(deviceId);
      if (isRefreshStale()) return sessionRef.current;
      if (guestResponse.success) return await setSession(createSessionSnapshot(guestResponse.data.user));
    } catch (_error) {}

    if (isRefreshStale()) return sessionRef.current;
    return await setSession(createLocalGuestSession());
  }, [setSession]);

  const logout = useCallback(async (): Promise<AuthSession> => {
    const fallbackSession = createLocalGuestSession();
    isLoggingOutRef.current = true;

    try {
      await SecureStoreManager.clearToken();
      await setSession(fallbackSession);
    } finally {
      isLoggingOutRef.current = false;
    }

    void (async () => {
      try {
        await unregisterCurrentNotificationDeviceToken();
      } catch (_error) {}
    })();

    return fallbackSession;
  }, [setSession]);

  const SetTheme = (theme?: ThemeKeys) => {
    let result: keyof ThemeProps = 'light';
    switch (theme) {
      case 'light':
      case 'dark':
        result = theme;
        break;
      case 'auto':
        result = colorScheme === 'dark' ? 'dark' : 'light';
        break;
    }
    StoreManager.setItem(ThemeKey, theme === 'auto' ? 'auto' : result);
    setTheme(prev => {
      const newTheme = Themes[result];
      return newTheme === prev ? prev : newTheme;
    });
  };

  const SessionContext: SessionStateType = useMemo(
    () => ({ value: session, Set: setSessionState, setSession, refreshSession, logout }),
    [logout, refreshSession, session, setSession],
  );
  const ThemeContext: ThemeStateType = useMemo(() => ({ value: theme, Set: SetTheme }), [theme]);
  const RandomContext: RandomDataStateType = useMemo(() => ({ value: randomData, Set: setRandomData }), [randomData]);
  const SubmissionQueueContext: SubmissionQueueStateType = useMemo(
    () => ({ value: queuedSubmissions, isSyncing: isQueueSyncing, refreshQueue, retryAll, retryOne, removeOne }),
    [isQueueSyncing, queuedSubmissions, refreshQueue, removeOne, retryAll, retryOne],
  );
  const contextValue = useMemo(
    () => ({ SessionContext, ThemeContext, RandomContext, SubmissionQueueContext, isLoaded }),
    [RandomContext, SessionContext, SubmissionQueueContext, ThemeContext, isLoaded],
  );

  useEffect(() => {
    if (hasUserSessionOverrideRef.current) return;
    setSessionState(sessionData);
  }, [sessionData]);

  useEffect(() => {
    void refreshQueue();
  }, [refreshQueue]);

  useEffect(() => {
    if (session.status === 'authenticated' && queuedSubmissions.length > 0) {
      void retryDueQueuedSubmissions();
    }
  }, [queuedSubmissions.length, retryDueQueuedSubmissions, session.status]);

  useEffect(() => {
    if (session.status === 'authenticated') {
      void registerNotificationDeviceTokenForSession(session);
    }
  }, [session]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') void retryDueQueuedSubmissions();
    });
    return () => subscription.remove();
  }, [retryDueQueuedSubmissions]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable !== false) void retryDueQueuedSubmissions();
    });
    return unsubscribe;
  }, [retryDueQueuedSubmissions]);

  useEffect(() => {
    if (session.status !== 'authenticated' || queuedSubmissions.length === 0) return;

    const dueTimes = queuedSubmissions
      .filter(item => item.retryable && item.photosAvailable)
      .map(item => (item.nextAttemptAt ? new Date(item.nextAttemptAt).getTime() : Date.now()))
      .filter(time => Number.isFinite(time));

    if (dueTimes.length === 0) return;

    const nextDueAt = Math.min(...dueTimes);
    const delay = Math.max(1000, nextDueAt - Date.now());
    const timer = setTimeout(() => {
      void retryDueQueuedSubmissions({ bypassThrottle: true });
    }, delay);

    return () => clearTimeout(timer);
  }, [queuedSubmissions, retryDueQueuedSubmissions, session.status]);

  useEffect(() => {
    const timer = setTimeout(() => setCustomSplashMinimumDone(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    (async function InitTheme() {
      try {
        const store = await StoreManager.getItem(ThemeKey);
        if (store) {
          const storedTheme = Themes[store as keyof ThemeProps];
          if (storedTheme) return storedTheme;
        }
      } catch (_error) {}
      return colorScheme === 'dark' ? Themes.light : Themes.light;
    })()
      .then(theme => setTheme(theme))
      .catch();
  }, []);
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.containerBg);
  }, [theme]);

  const handleCustomSplashReady = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [isLoaded]);

  if (!isLoaded || !isCustomSplashMinimumDone) {
    return <CustomSplashScreen onReady={handleCustomSplashReady} />;
  }

  return (
    <DefaultContext.Provider value={contextValue}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <SystemBars style={theme.isDark ? 'light' : 'dark'} />
          <PhoneFramePreview backgroundColor={theme.containerBg}>{children}</PhoneFramePreview>
        </SafeAreaProvider>
      </KeyboardProvider>
    </DefaultContext.Provider>
  );
};
