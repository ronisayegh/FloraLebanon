import Logging from '../Logging';

export const CreateCacheFolder = async () => {};

export const ClearCache = async (_daysOld?: number) => {};

export const ClearMonthOld = async () => {};

export const GetCachedURI = async (url?: string) => {
  if (!url) {
    return Promise.reject('Invalid or empty URL provided for GetLocalFileURI: ' + url);
  }

  return url;
};

export const subscribeToCacheUpdates = (_url: string, _listener: (uri: string) => void) => () => {};

export const ShareURL = async (_url: string) => {
  Logging.Logger.warn('ShareURL is not supported on web.');
};

export const ShareDownloadedURI = async (_localUri: string) => {
  Logging.Logger.warn('ShareDownloadedURI is not supported on web.');
};

export const SaveURIToLibrary = async (_uri: string) => {
  Logging.Logger.warn('SaveURIToLibrary is not supported on web.');
  return false;
};
