import { Card, SafeInsetsWrapper, ThemedTxt, ThemedView } from '@/components/basic';
import { MainColor } from '@/constants/Config';
import { GlobalStyle } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const SubmitLoadingView = () => {
  return (
    <SafeInsetsWrapper>
      <ThemedView style={[GlobalStyle.flex, styles.submitStateScreen]} variant="Container">
        <Card style={styles.submitStateCard}>
          <Ionicons name="cloud-upload-outline" size={48} color={MainColor} style={styles.submitStateIcon} />
          <ThemedTxt text="Uploading observation..." color={MainColor} fontWeight="700" fontSize={24} center />
          <ThemedTxt text="Please wait while we process your observation data." variant="Secondary" center style={GlobalStyle.tMar8} />
          <View style={styles.progressTrack}>
            <View style={styles.progressValue} />
          </View>
          <ActivityIndicator color={MainColor} style={GlobalStyle.tMar16} />
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
  submitStateCard: {
    borderRadius: 22,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  submitStateIcon: {
    marginBottom: 12,
    alignSelf: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#EFECEF',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 24,
  },
  progressValue: {
    width: '70%',
    height: '100%',
    backgroundColor: '#C58B9D',
    borderRadius: 999,
  },
});

export default SubmitLoadingView;
