import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

export const useIsKeyboardVisible = (useWillEvents = false) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(useWillEvents ? 'keyboardWillShow' : 'keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(useWillEvents ? 'keyboardWillHide' : 'keyboardDidHide', () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [useWillEvents]);

  return isKeyboardVisible;
};
