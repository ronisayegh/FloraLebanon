import { Card, SafeInsetsWrapper, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import { MainColor } from '@/constants/Config';
import { GlobalStyle } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import type { SubmitResultState } from '../types';

type SubmitResultViewProps = {
  submitResult: SubmitResultState;
  onBack: () => void;
  onReset: () => void;
};

const renderMessageWithLinks = (message: string) => {
  const parts = message.split(/(%[^%]+%)/g);
  const router = useRouter();
  return (
    <View style={[GlobalStyle.row, GlobalStyle.tMar8, GlobalStyle.flexCenter, GlobalStyle.wrap, { gap: 1 }]}>
      {parts.map((part, index) => {
        const isLink = part.startsWith('%') && part.endsWith('%');
        const label = isLink ? part.slice(1, -1) : part;
        if (!isLink) return <ThemedTxt key={index} text={label} variant="Secondary" rem={0.875} />;
        return (
          <TouchableOpacity key={index} onPress={() => router.replace('/Modals/Submissions')}>
            <ThemedTxt text={label} color={MainColor} rem={0.875} fontWeight="700" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const renderResultHint = (kind: SubmitResultState['kind']) => {
  if (kind === 'queued') {
    return (
      <ThemedView style={[styles.resultHint, styles.queueReminder]}>
        <ThemedTxt text="Your observation is saved, but not submitted yet." color={MainColor} fontWeight="700" rem={1} center />
        <ThemedTxt text="Log in or sign up later to submit it from your queue." variant="Secondary" center rem={0.875} style={styles.queueReminderText} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.resultHint}>
      <ThemedTxt
        text={kind === 'success' ? '🎉 Thank you for contributing to Lebanon biodiversity research.' : 'You can continue after fixing the issue above.'}
        variant="Secondary"
        center
        rem={0.75}
      />
    </ThemedView>
  );
};

const SubmitResultView = ({ submitResult, onBack, onReset }: SubmitResultViewProps) => {
  const router = useRouter();
  const primaryLabel = submitResult.kind === 'error' ? 'Back' : 'Done';

  return (
    <SafeInsetsWrapper>
      <ThemedView style={[GlobalStyle.flex, styles.submitStateScreen]} variant="Container">
        <Card style={styles.submitResultCard}>
          <Ionicons
            name={submitResult.kind === 'success' ? 'checkmark-circle' : submitResult.kind === 'queued' ? 'time-outline' : 'alert-circle-outline'}
            size={56}
            color={submitResult.kind === 'success' ? '#2E9B4B' : submitResult.kind === 'queued' ? MainColor : '#B42318'}
            style={styles.submitStateIcon}
          />
          <ThemedTxt text={submitResult.title} color={MainColor} fontWeight="700" rem={1.25} center />
          {renderMessageWithLinks(submitResult.message)}

          <View style={styles.resultDivider} />

          <Card showBorder borderColor={MainColor} style={styles.resultDetailsCard} shadow={false}>
            <ThemedTxt text="Observation Details" color={MainColor} rem={1.1} style={GlobalStyle.bMar12} />
            {submitResult.detailRows.map(row => (
              <View key={row.label} style={styles.resultDetailRow}>
                <ThemedTxt text={`${row.label}:`} variant="Secondary" fontSize={15} />
                <ThemedTxt text={row.value} color={MainColor} fontSize={15} style={styles.resultDetailValue} />
              </View>
            ))}
          </Card>

          {renderResultHint(submitResult.kind)}

          <View style={styles.resultActions}>
            {submitResult.kind === 'queued' && submitResult.queueReasonCode === 'NO_USER' ? (
              <ThemedBtnTxt
                text="Log In"
                variant="OutLine"
                buttonStyle={styles.resultLoginButton}
                onPress={() => router.replace('/Pages/LoginFlow/Login')}
                rem={1.1}
              />
            ) : null}
            <ThemedBtnTxt
              text={primaryLabel}
              buttonStyle={styles.resultPrimaryButton}
              onPress={() => {
                if (submitResult.kind === 'success' || submitResult.kind === 'queued') router.replace('/Modals/Submissions');
                else onBack();
              }}
              rem={1.2}
            />
            <ThemedBtnTxt text="Take Photos of Another Plant" rem={1.1} variant="OutLine" buttonStyle={styles.resultSecondaryButton} onPress={onReset} />
          </View>
        </Card>
      </ThemedView>
    </SafeInsetsWrapper>
  );
};

const styles = StyleSheet.create({
  submitStateScreen: {
    justifyContent: 'center',
    padding: 20,
  },
  submitResultCard: {
    borderRadius: 22,
    paddingHorizontal: 0,
    paddingVertical: 24,
    overflow: 'hidden',
  },
  submitStateIcon: {
    marginBottom: 12,
    alignSelf: 'center',
  },
  resultDivider: {
    marginTop: 20,
    borderTopWidth: 1.5,
    borderTopColor: MainColor,
  },
  resultDetailsCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 1.5,
    borderRadius: 18,
  },
  resultDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
    gap: 12,
  },
  resultDetailValue: {
    flex: 1,
    textAlign: 'right',
  },
  resultHint: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 2,
    paddingVertical: 12,
  },
  queueReminder: {
    borderWidth: 1.5,
    borderColor: MainColor,
    paddingHorizontal: 12,
    backgroundColor: '#FFF7F9',
  },
  queueReminderText: {
    marginTop: 6,
  },
  resultActions: {
    marginTop: 24,
    borderTopWidth: 1.5,
    borderTopColor: MainColor,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  resultPrimaryButton: {
    marginBottom: 12,
    padding: 12,
  },
  resultLoginButton: {
    marginBottom: 12,
    padding: 12,
  },
  resultSecondaryButton: {
    padding: 12,
  },
});

export default SubmitResultView;
