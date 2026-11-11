import { CameraRoll, CameraRollProps } from '@/components/basic';
import { useDefaultContext } from '@/hooks';
import { router } from 'expo-router';
import React from 'react';

const CameraRollPage = () => {
  const { RandomContext } = useDefaultContext();

  React.useEffect(() => {
    if (!RandomContext.value.TempCameraRoll) router.back();
  }, [RandomContext.value.TempCameraRoll]);

  if (!RandomContext.value.TempCameraRoll) return null;

  const { onCapture, ratio, enableBuiltCrop, skipUseConfirmation, closeBeforeCapture } = RandomContext.value.TempCameraRoll as CameraRollProps;
  return (
    <CameraRoll
      onCapture={onCapture}
      ratio={ratio}
      enableBuiltCrop={enableBuiltCrop}
      skipUseConfirmation={skipUseConfirmation}
      closeBeforeCapture={closeBeforeCapture}
    />
  );
};

export default CameraRollPage;
