import { IS_IOS } from '@/constants/Config';
import { Normalize } from '@/constants/Helper';
import { useDefaultContext } from '@/hooks/DefaultContext';
import React from 'react';
import { Dimensions, StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ModalProps, ReactNativeModal } from 'react-native-modal';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { XCircle } from '../../Icons/SVGs';
import { ThemedView } from '../../ThemedView';
export interface ModalWithXProps extends Partial<ModalProps> {
  isVisible: boolean;
  closeModal: () => void;
  hideX?: boolean;
  innerStyle?: StyleProp<ViewStyle>;
  position?: 'bottom' | 'top' | 'middle';
  swipeToClose?: boolean;
  out?: boolean;
  ignoreSafeInsets?: boolean;
}
export const ModalWithX: React.FC<ModalWithXProps> = props => {
  const { closeModal, innerStyle, hideX, position, swipeToClose, out, ignoreSafeInsets = true, children, style, ...prps } = props;
  const Theme = useDefaultContext().ThemeContext.value;
  const screen = Dimensions.get('screen');
  let innerBorder = {};
  let justifyContent: 'center' | 'flex-start' | 'flex-end';
  switch (position) {
    case 'bottom':
      innerBorder = {
        borderTopStartRadius: 15,
        borderTopEndRadius: 15,
      };
      justifyContent = 'flex-end';
      break;
    case 'top':
      innerBorder = {
        borderBottomStartRadius: 15,
        borderBottomEndRadius: 15,
      };
      justifyContent = 'flex-start';
      break;
    case 'middle':
    default:
      innerBorder = {
        borderTopStartRadius: 15,
        borderTopEndRadius: 15,
        borderBottomStartRadius: 15,
        borderBottomEndRadius: 15,
      };
      justifyContent = 'center';
      break;
  }
  const swipeProps: Partial<ModalProps> = swipeToClose
    ? { onSwipeComplete: closeModal, swipeDirection: 'down', swipeThreshold: 200, propagateSwipe: true }
    : {};
  return (
    <SafeAreaInsetsContext.Consumer>
      {insets => (
        <ReactNativeModal
          onBackdropPress={closeModal}
          onBackButtonPress={closeModal}
          backdropOpacity={0.6}
          deviceHeight={screen.height}
          deviceWidth={screen.width}
          statusBarTranslucent={!IS_IOS}
          style={[
            styles.modal,
            {
              justifyContent,
              paddingTop: ignoreSafeInsets ? 0 : IS_IOS ? insets?.top : 0,
              marginTop: ignoreSafeInsets ? 0 : IS_IOS ? insets?.top : 0,
              marginBottom: 0,
              backgroundColor: Theme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.5)',
            },
            style,
          ]}
          {...swipeProps}
          {...prps}
        >
          <ThemedView style={[styles.modalContent, innerBorder, innerStyle]}>
            {children}
            {!hideX && (
              <TouchableOpacity style={[styles.closeButton, { top: 10 }]} onPress={closeModal}>
                <XCircle size={Normalize(30)} />
              </TouchableOpacity>
            )}
          </ThemedView>
          {out && (
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  top: (ignoreSafeInsets && IS_IOS ? (insets?.top ?? 0) : 0) + 10,
                },
              ]}
              onPress={closeModal}
            >
              <XCircle size={30} />
            </TouchableOpacity>
          )}
        </ReactNativeModal>
      )}
    </SafeAreaInsetsContext.Consumer>
  );
};
const styles = StyleSheet.create({
  modal: {
    ...StyleSheet.absoluteFillObject,
    margin: 0,
    padding: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 999,
    zIndex: 999,
    margin: 3,
    padding: 3,
  },
  modalContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
