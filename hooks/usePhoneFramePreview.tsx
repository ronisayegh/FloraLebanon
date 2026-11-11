import { IS_DEV, PHONE_FRAME_PREVIEW_ENABLE } from '@/constants/Config';
import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

export const PHONE_FRAME_PREVIEW = {
  enabled: IS_DEV && PHONE_FRAME_PREVIEW_ENABLE,
  width: 300 as number | null,
  height: 800 as number | null,
  backgroundColor: '#222222',
};

type PhoneFramePreviewProps = {
  children: React.ReactNode;
  backgroundColor?: string;
};

export function usePhoneFramePreview() {
  const windowSize = useWindowDimensions();

  const frameStyle = useMemo(() => {
    if (!IS_DEV || !PHONE_FRAME_PREVIEW.enabled) return null;
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
