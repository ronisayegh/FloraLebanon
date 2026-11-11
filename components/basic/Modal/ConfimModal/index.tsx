import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedBtnTxt } from '../../ThemedBtn';
import { ThemedTxt } from '../../ThemedTxt';
import { ThemedView } from '../../ThemedView';
import { ModalWithX } from '../ModalWithX';
export interface ConfimModalProps {
  isVisible: boolean;
  onAccept: () => void;
  onReject: () => void;
  Text: string;
}
export const ConfimModal: React.FC<ConfimModalProps> = props => {
  const { isVisible, onAccept, onReject, Text } = props;
  return (
    <ModalWithX isVisible={isVisible} closeModal={onReject} style={styles.modal} hideX>
      <View style={styles.modalContainer}>
        <ThemedView style={styles.modalContent}>
          <ThemedTxt text={Text} fontSize={18} fontWeight="700" center style={styles.modalText} />
          <View style={styles.buttonContainer}>
            <ThemedBtnTxt text="No" onPress={onReject} buttonStyle={styles.noBtn} bold />
            <ThemedBtnTxt text="Yes" onPress={onAccept} buttonStyle={styles.yesBtn} bold />
          </View>
        </ThemedView>
      </View>
    </ModalWithX>
  );
};
const styles = StyleSheet.create({
  modal: {
    padding: 20,
  },
  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 8,
    padding: 20,
  },
  modalText: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yesBtn: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    width: '65%',
    alignItems: 'center',
  },
  noBtn: {
    padding: 10,
    borderRadius: 8,
    width: '30%',
    alignItems: 'center',
  },
});
