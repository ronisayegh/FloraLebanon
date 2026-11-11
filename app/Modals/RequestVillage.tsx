import { Card, SafeInsetsWrapper, Scroll, TextInputIcon, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import ModalHeader from '@/components/basic/Header';
import { MainColor } from '@/constants/Config';
import { useAppDialog, useDefaultContext } from '@/hooks';
import { CreateVillageRequest } from '@/services';
import { GlobalStyle } from '@/styles';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function RequestVillageScreen() {
  const router = useRouter();
  const { SessionContext } = useDefaultContext();
  const { showDialog, closeDialog, dialogNode } = useAppDialog();
  const [nameEn, setNameEn] = React.useState('');
  const [nameFr, setNameFr] = React.useState('');
  const [nameAr, setNameAr] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setSubmitting] = React.useState(false);

  const canSubmit = nameEn.trim().length > 0 && sessionCanRequest(SessionContext.value.status) && !isSubmitting;

  const handleSubmit = async () => {
    if (!nameEn.trim()) {
      showDialog({ title: 'Missing name', message: 'English village name is required.' });
      return;
    }
    if (SessionContext.value.status !== 'authenticated') {
      showDialog({ title: 'Login required', message: 'You need to log in before requesting a village.' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await CreateVillageRequest({
        nameEn: nameEn.trim(),
        nameFr: nameFr.trim() || undefined,
        nameAr: nameAr.trim() || undefined,
        description: description.trim() || undefined,
      });
      if (!response.success) {
        showDialog({ title: 'Request failed', message: response.error.message });
        return;
      }
      showDialog({
        title: 'Village requested',
        message: 'Your village request was submitted for review.',
        primaryLabel: 'Close',
        onPrimary: () => {
          closeDialog();
          router.back();
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit the village request right now.';
      showDialog({ title: 'Request failed', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeInsetsWrapper>
      <ThemedView style={GlobalStyle.flex} variant="Container">
        <ModalHeader />
        <Scroll contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <Card showBorder borderColor={MainColor} style={styles.card}>
            <ThemedTxt text="Request a Village" color={MainColor} fontWeight="700" fontSize={20} />
            <ThemedTxt
              text="If your village is missing from the list, send it here and the team can review it."
              variant="Secondary"
              fontSize={13}
              style={GlobalStyle.tMar8}
            />

            <View style={GlobalStyle.tMar16}>
              <ThemedTxt text="Village name in English" fontWeight="600" fontSize={13} style={GlobalStyle.bMar8} />
              <TextInputIcon value={nameEn} onChangeText={setNameEn} placeholder="Example: Ain Dara" />
            </View>
            <View style={GlobalStyle.tMar12}>
              <ThemedTxt text="Village name in French" fontWeight="600" fontSize={13} style={GlobalStyle.bMar8} />
              <TextInputIcon value={nameFr} onChangeText={setNameFr} placeholder="Optional" />
            </View>
            <View style={GlobalStyle.tMar12}>
              <ThemedTxt text="Village name in Arabic" fontWeight="600" fontSize={13} style={GlobalStyle.bMar8} />
              <TextInputIcon value={nameAr} onChangeText={setNameAr} placeholder="Optional" />
            </View>
            <View style={GlobalStyle.tMar12}>
              <ThemedTxt text="Notes" fontWeight="600" fontSize={13} style={GlobalStyle.bMar8} />
              <TextInputIcon value={description} onChangeText={setDescription} placeholder="Optional context about the village" isTextarea height={120} />
            </View>

            {SessionContext.value.status !== 'authenticated' ? (
              <ThemedTxt text="Login is required to submit a village request." variant="Secondary" fontSize={12} style={GlobalStyle.tMar16} />
            ) : null}
          </Card>
        </Scroll>
        <View style={styles.content}>
          <ThemedBtnTxt text={isSubmitting ? 'Submitting...' : 'Submit Request'} buttonStyle={styles.submitBtn} enabled={canSubmit} onPress={handleSubmit} />
          <ThemedBtnTxt text="Close" variant="OutLine" buttonStyle={styles.closeBtn} onPress={() => router.back()} />
        </View>
      </ThemedView>
      {dialogNode}
    </SafeInsetsWrapper>
  );
}

function sessionCanRequest(status: 'guest' | 'authenticated' | 'local_guest') {
  return status === 'authenticated';
}

const styles = StyleSheet.create({
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    borderWidth: 1.5,
    borderColor: MainColor,
    borderRadius: 18,
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    marginTop: 20,
  },
  closeBtn: {
    height: 52,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: MainColor,
    backgroundColor: 'transparent',
  },
});
