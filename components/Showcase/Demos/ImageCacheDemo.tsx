import { Card, Scroll, SimpleCachedImg, TextInputIcon, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import { Cog } from '@/components/basic/Icons';
import { MainColor } from '@/constants/Config';
import { ClearCache, ClearMonthOld, GetCachedURI, subscribeToCacheUpdates } from '@/constants/Stores';
import { GlobalStyle } from '@/styles';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

const DEFAULT_URL = 'https://picsum.photos/id/237/900/900';

type LogEntry = {
  id: string;
  text: string;
};

const formatTime = () => new Date().toLocaleTimeString();

export default function ImageCacheDemo() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [activeUrl, setActiveUrl] = useState(DEFAULT_URL);
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);
  const [previousUri, setPreviousUri] = useState<string | null>(null);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const appendLog = useCallback((text: string) => {
    setLogs(prev => [{ id: `${Date.now()}-${Math.random()}`, text: `[${formatTime()}] ${text}` }, ...prev].slice(0, 20));
  }, []);

  useEffect(() => {
    return subscribeToCacheUpdates(activeUrl, uri => {
      setPreviousUri(current => current ?? resolvedUri);
      setResolvedUri(uri);
      appendLog(`Background refresh updated local file: ${uri}`);
    });
  }, [activeUrl, appendLog, resolvedUri]);

  const runResolve = useCallback(
    async (force = false) => {
      try {
        setIsBusy(true);
        appendLog(force ? 'Force refresh requested.' : 'Resolving cached URI.');
        const nextUri = await GetCachedURI(activeUrl, force, 8000);
        setPreviousUri(resolvedUri);
        setResolvedUri(nextUri);
        appendLog(`${force ? 'Force refresh resolved' : 'Cache resolved'} to: ${nextUri}`);
      } catch (error) {
        appendLog(`Resolve failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsBusy(false);
      }
    },
    [activeUrl, appendLog, resolvedUri],
  );

  const applyUrl = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      appendLog('URL is empty.');
      return;
    }
    setActiveUrl(trimmed);
    setResolvedUri(null);
    setPreviousUri(null);
    setPreviewNonce(prev => prev + 1);
    appendLog(`Active URL set to: ${trimmed}`);
  }, [appendLog, url]);

  const clearAll = useCallback(async () => {
    try {
      setIsBusy(true);
      await ClearCache();
      setResolvedUri(null);
      setPreviousUri(null);
      appendLog('Cleared all cached files.');
    } catch (error) {
      appendLog(`Clear cache failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsBusy(false);
    }
  }, [appendLog]);

  const clearMonthOld = useCallback(async () => {
    try {
      setIsBusy(true);
      await ClearMonthOld();
      appendLog('Cleared month-old cached files.');
    } catch (error) {
      appendLog(`Clear month-old failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsBusy(false);
    }
  }, [appendLog]);

  const testChecklist = useMemo(
    () => [
      '1. Tap Resolve Cache twice and confirm the local URI stays the same.',
      '2. Tap Force Refresh and confirm a new local URI appears when a refresh downloads a replacement.',
      '3. Watch the preview and log output for background refresh updates.',
      '4. Test one of your server file URLs here to verify ETag-backed validation.',
      '5. Test a third-party URL here to verify fallback behavior when validators are missing.',
    ],
    [],
  );

  return (
    <ThemedView variant="Container" style={GlobalStyle.flex}>
      <Scroll contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.headerRow}>
            <Cog size={28} filled strokeWidth={2} />
            <ThemedTxt text="Dev Cache Test" fontSize={28} fontWeight="700" color={MainColor} style={styles.title} />
          </View>
          <ThemedTxt
            text="Manual test surface for file and image caching. It resolves local cache, listens for background refreshes, and lets you force or clear the cache."
            variant="Secondary"
            style={styles.subtitle}
          />
        </Card>

        <Card title="URL" showBorder>
          <TextInputIcon value={url} onChangeText={setUrl} placeholder="Paste a file or image URL" filled />
          <View style={styles.buttonRow}>
            <ThemedBtnTxt text="Use URL" onPress={applyUrl} buttonStyle={styles.button} />
            <ThemedBtnTxt text="Reset Sample" onPress={() => setUrl(DEFAULT_URL)} variant="OutLine" buttonStyle={styles.button} />
          </View>
          <ThemedTxt text={`Active URL: ${activeUrl}`} variant="Secondary" style={styles.metaText} />
        </Card>

        <Card title="Actions" showBorder>
          <View style={styles.buttonRow}>
            <ThemedBtnTxt text="Resolve Cache" onPress={() => runResolve(false)} buttonStyle={styles.button} enabled={!isBusy} />
            <ThemedBtnTxt text="Force Refresh" onPress={() => runResolve(true)} buttonStyle={styles.button} variant="Warning" enabled={!isBusy} />
          </View>
          <View style={styles.buttonRow}>
            <ThemedBtnTxt text="Clear All Cache" onPress={clearAll} buttonStyle={styles.button} variant="OutLine" enabled={!isBusy} />
            <ThemedBtnTxt text="Clear Month Old" onPress={clearMonthOld} buttonStyle={styles.button} variant="OutLine" enabled={!isBusy} />
          </View>
        </Card>

        <Card title="Resolved State" showBorder>
          <ThemedTxt text={`Current URI: ${resolvedUri ?? 'Not resolved yet'}`} fontSize={14} />
          <ThemedTxt text={`Previous URI: ${previousUri ?? 'None yet'}`} variant="Secondary" fontSize={14} style={styles.metaText} />
        </Card>
        <Card title="Cached Preview" showBorder>
          <SimpleCachedImg
            key={`${activeUrl}-${previewNonce}`}
            url={activeUrl}
            style={styles.previewImage}
            timeout={8000}
            onUri={(sourceUrl, uri) => {
              setPreviousUri(current => current ?? resolvedUri);
              setResolvedUri(uri);
              appendLog(`SimpleCachedImg using local URI for ${sourceUrl}: ${uri}`);
            }}
            TempNode={
              <View style={styles.previewFallback}>
                <ThemedTxt text="Image unavailable" variant="Secondary" />
              </View>
            }
          />
        </Card>
        <Card title="Normal Preview" showBorder>
          <Image src={DEFAULT_URL} style={styles.previewImage} />
        </Card>
        <Card title="Checklist" showBorder>
          {testChecklist.map(item => (
            <ThemedTxt key={item} text={item} style={styles.checkItem} />
          ))}
        </Card>

        <Card title="Log" showBorder>
          {logs.length ? (
            logs.map(entry => <ThemedTxt key={entry.id} text={entry.text} variant="Secondary" style={styles.logLine} />)
          ) : (
            <ThemedTxt text="No cache events yet." variant="Secondary" />
          )}
        </Card>
      </Scroll>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flexShrink: 1,
  },
  subtitle: {
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  button: {
    minWidth: 140,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  metaText: {
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    backgroundColor: '#ddd',
  },
  previewFallback: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkItem: {
    marginBottom: 8,
  },
  logLine: {
    marginBottom: 8,
  },
});
