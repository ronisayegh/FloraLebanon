const edgeToEdge = require('react-native-edge-to-edge/expo').default;
const config = require('./default.config.json');
const { ThemeValues } = require('./constants/Themes/theme-values');

module.exports = {
  expo: {
    name: 'FloraLebanon Collect',
    slug: 'flora_lebanon_app',
    version: config.app.version,
    orientation: 'portrait',
    icon: './assets/images/app-icon-2.png',
    scheme: 'floralebanon',
    userInterfaceStyle: 'automatic',
    owner: 'flora-lebanon',
    splash: {
      image: './assets/images/app-splash-icon-2.png',
      resizeMode: 'contain',
      backgroundColor: ThemeValues.light.primary,
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/app-adaptive-icon-2.png',
        backgroundColor: ThemeValues.light.containerBg,
      },
      predictiveBackGestureEnabled: false,
      softwareKeyboardLayoutMode: 'pan',
      permissions: [
        'android.permission.CAMERA',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
      package: 'com.floralebanon.flora_lebanon_app',
      versionCode: config.app.build,
      googleServicesFile: './google-services.json',
    },
    plugins: [
      'expo-router',
      'expo-notifications',
      [
        'expo-media-library',
        {
          photosPermission: 'Allow FloraLebanon Collect to access observation photos from your photo library.',
          savePhotosPermission: 'Allow FloraLebanon Collect to save observation photos to your photo library.',
          granularPermissions: ['photo'],
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow FloraLebanon Collect to select observation photos from your photo library.',
          cameraPermission: 'Allow FloraLebanon Collect to take plant observation photos.',
          microphonePermission: false,
        },
      ],
      'expo-secure-store',
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'Allow FloraLebanon Collect to use your location for submission coordinates.',
        },
      ],
      '@react-native-community/datetimepicker',
      edgeToEdge({
        android: {
          parentTheme: 'Default',
          enforceNavigationBarContrast: false,
        },
      }),
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '7594bff4-1804-4244-aa48-c063f5672a97',
      },
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/7594bff4-1804-4244-aa48-c063f5672a97',
    },
  },
};
