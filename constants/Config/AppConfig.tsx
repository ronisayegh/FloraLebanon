import { Platform } from 'react-native';
import config from '../../default.config.json';
export const APP_BUILD = config.app.build;
export const APP_VERSION = config.app.version;
export const APP_BASE_NAME = config.app.baseName;
export const IS_ANDROID = Platform.OS === 'android'; //config.app.platform === "android";
export const IS_IOS = Platform.OS === 'ios'; // config.app.platform === "ios"
export const IS_DEV = config.app.dev;
export const DEV_TAB = config.app.tabs.dev_tab;
export const SHOWCASE_TAB = config.app.tabs.showcase_tab;
export const MainColor = config.app.MainColor;
export const SUBMISSION_IMAGES_CONVERT_TO_JPEG = config.app.submissionImages?.convertToJpeg ?? true;
export const API_BASE_URL = config.app.apis[IS_DEV ? 'dev' : 'master'];
// export const API_BASE_URL = config.app.apis['master'];
export const LOG_ENABLED = config.app.log_enabled;
export const DISABLE_WARNING = !IS_DEV;
export const PHONE_FRAME_PREVIEW_ENABLE = config.app.phone_frame_preview_enable;
