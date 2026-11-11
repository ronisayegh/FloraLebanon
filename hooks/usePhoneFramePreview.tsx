import { IS_DEV, PHONE_FRAME_PREVIEW_ENABLE } from '@/constants/Config';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

// On web the UI scales with window width (see ResolutionHelper), so a desktop
// browser renders everything ~3x too large. Always frame web at phone size.
const IS_WEB = Platform.OS === 'web';

export const PHONE_FRAME_PREVIEW = {
  enabled: IS_WEB || (IS_DEV && PHONE_FRAME_PREVIEW_ENABLE),
  width: (IS_WEB ? 412 : 300) as number | null,
  height: (IS_WEB ? 880 : 800) as number | null,
  backgroundColor: '#222222',
};

type PhoneFramePreviewProps = {
  children: React.ReactNode;
  backgroundColor?: string;
};

export function usePhoneFramePreview() {
  const windowSize = useWindowDimensions();

  const frameStyle = useMemo(() => {
    if (!PHONE_FRAME_PREVIEW.enabled) return null;
    if (PHONE_FRAME_PREVIEW.width == null && PHONE_FRAME_PREVIEW.height == null) return null;

    return {
      width: PHONE_FRAME_PREVIEW.width == null ? windowSize.width : Math.min(PHONE_FRAME_PREVIEW.width, windowSize.width),
      height: PHONE_FRAME_PREVIEW.height == null ? windowSize.height : Math.min(PHONE_FRAME_PREVIEW.height, windowSize.height),
    };
  }, [windowSize.height, windowSize.width]);

  const PhoneFramePreview = useMemo(
    () =>
      function PhoneFramePreview({ children, backgroundColor }: PhoneFramePreviewProps) {
        if (!frameStyle) return <>{children}</>;

        return (
          <View style={[styles.outer, { backgroundColor: PHONE_FRAME_PREVIEW.backgroundColor }]}>
            <View style={[styles.inner, frameStyle, { backgroundColor }]}>{children}</View>
          </View>
        );
      },
    [frameStyle],
  );

  return PhoneFramePreview;
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inner: {
    overflow: 'hidden',
  },
});
