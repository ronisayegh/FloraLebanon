import { ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import { MainColor } from '@/constants/Config';
import { GlobalStyle } from '@/styles';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export const ProfileBadgeInfoModalContent: React.FC<{ onClose: () => void }> = props => {
  const { onClose } = props;

  return (
    <View style={styles.content}>
      <ThemedTxt text="How badges work" fontSize={24} color={MainColor} style={styles.title} />
      <ThemedTxt
        text="Badges are earned by contributing verified observations and completing missions."
        fontSize={16}
        variant="Secondary"
        style={styles.intro}
      />

      <View style={styles.section}>
        <ThemedTxt text="Species badges" fontSize={18} color={MainColor} style={styles.sectionTitle} />
        <ThemedView variant="Secondary" style={styles.infoCard}>
          <ThemedTxt text="Each verified species = 1 point" fontSize={16} variant="Secondary" />
          <ThemedTxt text="Every 20 points earns 1 Species badge" fontSize={16} variant="Secondary" style={GlobalStyle.tMar8} />
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedTxt text="Rare species badges" fontSize={18} color={MainColor} style={styles.sectionTitle} />
        <ThemedView variant="Secondary" style={styles.infoCard}>
          <ThemedTxt text="Each verified rare species = 10 points" fontSize={16} variant="Secondary" />
          <ThemedTxt text="Every 30 points earns 1 Rare Species badge" fontSize={16} variant="Secondary" style={GlobalStyle.tMar8} />
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedTxt text="Mission badges" fontSize={18} color={MainColor} style={styles.sectionTitle} />
        <ThemedView variant="Secondary" style={styles.infoCard}>
          <ThemedTxt text="Each completed mission = 5 points" fontSize={16} variant="Secondary" />
          <ThemedTxt text="Every 25 points earns 1 Mission badge" fontSize={16} variant="Secondary" style={GlobalStyle.tMar8} />
        </ThemedView>
      </View>

      <ThemedBtnTxt text="Close" buttonStyle={styles.closeBtn} onPress={onClose} fontSize={18} />
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    borderBottomWidth: 1,
    borderColor: MainColor,
    paddingBottom: 10,
    paddingRight: 36,
  },
  intro: {
    marginTop: 20,
    lineHeight: 24,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  infoCard: {
    borderRadius: 12,
    padding: 14,
  },
  closeBtn: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 12,
  },
});
