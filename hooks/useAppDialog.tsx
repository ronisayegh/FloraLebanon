import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ModalWithX } from '@/components/basic/Modal/ModalWithX';
import { ThemedBtnTxt } from '@/components/basic/ThemedBtn';
import { ThemedTxt } from '@/components/basic/ThemedTxt';

type AppDialogConfig = {
  title: string;
  message: string;
  primaryLabel?: string;
  onPrimary?: () => void | Promise<void>;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function useAppDialog() {
  const [dialog, setDialog] = useState<AppDialogConfig | null>(null);

  const closeDialog = useCallback(() => setDialog(null), []);

  const showDialog = useCallback((config: AppDialogConfig) => {
    setDialog({
      primaryLabel: 'OK',
      ...config,
    });
  }, []);

  const dialogNode = useMemo(
    () => (
      <ModalWithX isVisible={Boolean(dialog)} closeModal={closeDialog} position="middle" style={styles.modal} innerStyle={styles.modalInner}>
        {dialog ? (
          <View style={styles.content}>
            <ThemedTxt text={dialog.title} fontSize={20} fontWeight="700" center style={styles.title} />
            <ThemedTxt text={dialog.message} variant="Secondary" center style={styles.message} />
            <View style={styles.actions}>
              {dialog.secondaryLabel ? (
                <ThemedBtnTxt
                  text={dialog.secondaryLabel}
                  variant="OutLine"
                  buttonStyle={styles.secondaryBtn}
                  onPress={dialog.onSecondary ?? closeDialog}
                />
              ) : null}
              <ThemedBtnTxt
                text={dialog.primaryLabel || 'OK'}
                buttonStyle={styles.primaryBtn}
                onPress={() => void (dialog.onPrimary ?? closeDialog)()}
              />
            </View>
          </View>
        ) : null}
      </ModalWithX>
    ),
    [closeDialog, dialog],
  );

  return {
    showDialog,
    closeDialog,
    dialogNode,
  };
}

const styles = StyleSheet.create({
  modal: {
    padding: 20,
  },
  modalInner: {
    alignItems: 'stretch',
    borderRadius: 18,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  title: {
    marginBottom: 12,
  },
  message: {
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 48,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 48,
  },
});
