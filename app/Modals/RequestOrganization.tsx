import { Card, SafeInsetsWrapper, Scroll, TextInputIcon, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import ModalHeader from '@/components/basic/Header';
import { MainColor } from '@/constants/Config';
import { useAppDialog, useDefaultContext } from '@/hooks';
import { CreateOrganizationRequest } from '@/services';
import { GlobalStyle } from '@/styles';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function RequestOrganizationScreen() {
  const router = useRouter();
  const { ThemeContext, SessionContext } = useDefaultContext();
  const { showDialog, closeDialog, dialogNode } = useAppDialog();
  const theme = ThemeContext.value;
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setSubmitting] = React.useState(false);

  const canSubmit = name.trim().length > 0 && SessionContext.value.status === 'authenticated' && !isSubmitting;

  const handleSubmit = async () => {
    if (!name.trim()) {
      showDialog({ title: 'Missing name', message: 'Organization name is required.' });
      return;
    }
    if (SessionContext.value.status !== 'authenticated') {
      showDialog({ title: 'Login required', message: 'You need to log in before requesting an organization.' });
      return;
    }

    setSubmitting(true);
    try {
      const response = await CreateOrganizationRequest({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      if (!response.success) {
        showDialog({ title: 'Request failed', message: response.error.message });
        return;
      }
      showDialog({
        title: 'Request submitted',
        message: 'Your organization request was sent for review.',
        primaryLabel: 'Close',
        onPrimary: () => {
          closeDialog();
          router.back();
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit the organization request right now.';
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
            <ThemedTxt text="Request an Organization" variant="Primary" fontWeight="700" rem={1.5} />
            <ThemedTxt
              text="If your group is not listed yet, send the request here. Once approved, you become its manager and can invite members by email."
              variant="Secondary"
              rem={1}
              style={GlobalStyle.tMar8}
            />

            <View style={GlobalStyle.tMar16}>
              <ThemedTxt text="Organization name" fontWeight="600" rem={1.25} style={GlobalStyle.bMar8} />
              <TextInputIcon value={name} onChangeText={setName} placeholder="Example: Flora Lebanon Club" />
            </View>
            <View style={GlobalStyle.tMar12}>
              <ThemedTxt text="Notes" fontWeight="600" rem={1.25} style={GlobalStyle.bMar8} />
              <TextInputIcon value={description} onChangeText={setDescription} placeholder="Optional details about the organization" isTextarea height={120} />
            </View>

            {SessionContext.value.status !== 'authenticated' ? (
              <ThemedTxt text="Login is required to submit an organization request." variant="Secondary" fontSize={12} style={GlobalStyle.tMar16} />
            ) : null}
          </Card>
        </Scroll>
        <View style={styles.content}>
          <ThemedBtnTxt
            text={isSubmitting ? 'Submitting...' : 'Submit Request'}
            enabled={canSubmit}
            buttonStyle={styles.submitBtn}
            rem={1.5}
            onPress={handleSubmit}
          />
          <ThemedBtnTxt text="Close" variant="OutLine" buttonStyle={styles.closeBtn} onPress={() => router.back()} rem={1.5} />
        </View>
      </ThemedView>
      {dialogNode}
    </SafeInsetsWrapper>
  );
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
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  closeBtn: {
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: MainColor,
    backgroundColor: 'transparent',
  },
});
