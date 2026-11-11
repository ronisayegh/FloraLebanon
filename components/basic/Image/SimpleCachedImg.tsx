import { isString, isStringNotEmpty } from '@/constants/Static';
import { GetCachedURI, subscribeToCacheUpdates } from '@/constants/Stores';
import { useFetch } from '@/hooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ImageErrorEvent, ImageLoadEvent, ImageProps, View } from 'react-native';
export type ImgError = string | ImageErrorEvent | Error | undefined | null;
export type SimpleCachedImgProps = Omit<Omit<ImageProps, 'source'>, 'onError'> & {
  url?: string;
  force?: boolean;
  TempNode?: React.ReactNode;
  onError?: (error: ImgError) => void;
  onUri?: (url: string, uri: string) => void;
  timeout?: number;
};
export const SimpleCachedImg: React.FC<SimpleCachedImgProps> = props => {
  const { url, force = false, onError, onLoad, onUri, timeout, TempNode, ...prps } = props;
  const [error, setError] = useState<ImgError>();
  const [uri, setUri] = useState<string | null>();
  const hasUrl = isStringNotEmpty(url);
  const isLocalFile = isString(url) && url.startsWith('file://');
  const shouldLoadRemote = hasUrl && !isLocalFile;
  const onErrorRef = useRef(onError);
  const onLoadRef = useRef(onLoad);
  const onUriRef = useRef(onUri);
  useEffect(() => {
    onErrorRef.current = onError;
    onLoadRef.current = onLoad;
    onUriRef.current = onUri;
  }, [onError, onLoad, onUri]);
  const handleError = useCallback((error: ImgError) => {
    setError(error);
    onErrorRef.current?.(error);
  }, []);
  const handleLoad = useCallback(
    (event: ImageLoadEvent) => {
      handleError(undefined);
      onLoadRef.current?.(event);
    },
    [handleError],
  );
  const fetchFC = useCallback(() => GetCachedURI(url, force, timeout), [url, force, timeout]);
  const { data, isLoading, error: err } = useFetch<string | null>({ fetchFC, raw: true, caller: `simplecachedimage ${url}`, load: shouldLoadRemote });
  useEffect(() => {
    if (!shouldLoadRemote) return;
    handleError(err);
  }, [err, handleError, shouldLoadRemote]);
  useEffect(() => {
    if (!shouldLoadRemote || !url) return;
    return subscribeToCacheUpdates(url, nextUri => {
      setUri(current => (current === nextUri ? current : nextUri));
      onUriRef.current?.(url, nextUri);
    });
  }, [shouldLoadRemote, url]);
  useEffect(() => {
    if (!hasUrl) {
      setUri(null);
      handleError(undefined);
      return;
    }
    if (isLocalFile && url) {
      setUri(current => (current === url ? current : url));
      handleError(undefined);
      onUriRef.current?.(url, url);
      return;
    }

    if (url && data) {
      setUri(current => (current === data ? current : data));
      onUriRef.current?.(url, data);
    }
  }, [data, handleError, hasUrl, isLocalFile, url]);
  if (error || !isStringNotEmpty(url)) return TempNode || <View />;
  if (isLoading || !isString(uri)) return <ActivityIndicator size="small" color="#ccc" />;
  return <Image source={{ uri }} onError={handleError} onLoad={handleLoad} {...prps} />;
};
