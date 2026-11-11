import { Card, EmptySpace, ThemedBtn, ThemedBtnTxt, ThemedTxt, ThemedView, ThemeSelector } from '@/components/basic';
import { SafeInsetsWrapper } from '@/components/basic/SafeInsetsWrapper';
import { MainColor } from '@/constants/Config';
import { GlobalStyle } from '@/styles';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

const ShowcaseDemoCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <Card title={title} showBorder style={styles.demoCard}>
    <ThemedTxt text={description} variant="Secondary" style={styles.demoDescription} />
    {children}
  </Card>
);

export default function FoundationsDemo() {
  const [lastButton, setLastButton] = useState('None');

  return (
    <View>
      <ShowcaseDemoCard title="ThemeSelector" description="Switch between light, dark and auto theme.">
        <ThemeSelector />
      </ShowcaseDemoCard>
      <ShowcaseDemoCard title="ThemedTxt" description="Typography variants, weights, casing, and inline emphasis.">
        <ThemedTxt text="Default text sample" fontSize={16} />
        <ThemedTxt text="Primary emphasis" variant="Primary" fontWeight="700" style={GlobalStyle.tMar8} />
        <ThemedTxt text="Secondary helper copy" variant="Secondary" italic style={GlobalStyle.tMar8} />
        <ThemedTxt text="uppercase label" uppercase fontSize={12} style={GlobalStyle.tMar8} />
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="ThemedView" description="Surface variants with spacing and shadow treatment.">
        <View style={styles.rowWrap}>
          <ThemedView variant="Primary" shadow style={styles.surfaceBox}>
            <ThemedTxt text="Primary" bold />
          </ThemedView>
          <ThemedView variant="Secondary" style={styles.surfaceBox}>
            <ThemedTxt text="Secondary" bold />
          </ThemedView>
          <ThemedView variant="Transparent" shadow style={styles.surfaceBox}>
            <ThemedTxt text="Transparent" bold />
          </ThemedView>
        </View>
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="ThemedBtn" description="Default, outline, and warning button variants with live actions.">
        <View style={styles.buttonRow}>
          <ThemedBtnTxt text="Default" buttonStyle={styles.showcaseButton} onPress={() => setLastButton('Default')} />
          <ThemedBtnTxt text="Outline" variant="OutLine" buttonStyle={styles.showcaseButton} onPress={() => setLastButton('Outline')} />
          <ThemedBtnTxt text="Warning" variant="Warning" buttonStyle={styles.showcaseButton} onPress={() => setLastButton('Warning')} />
        </View>
        <ThemedBtn style={styles.rawButton}>
          <ThemedTxt text="Raw ThemedBtn child" color="#fff" bold />
        </ThemedBtn>
        <ThemedTxt text={`Last button pressed: ${lastButton}`} variant="Secondary" style={GlobalStyle.tMar8} />
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="Card" description="The card container used across the app shell.">
        <Card title="Nested card" showBorder style={styles.innerCard}>
          <ThemedTxt text="Cards support headers, icons, optional background removal, and shadow." variant="Secondary" />
        </Card>
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="EmptySpace" description="Flexible filler for row layouts and spacing experiments.">
        <View style={[GlobalStyle.row, GlobalStyle.alignCenter]}>
          <ThemedTxt text="Left" bold />
          <EmptySpace />
          <ThemedTxt text="Center via spacer" variant="Secondary" />
          <EmptySpace />
          <ThemedTxt text="Right" bold />
        </View>
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="SafeInsetsWrapper " description="Wrappers previewed inside fixed-height samples instead of replacing the full route layout.">
        <SafeInsetsWrapper includeTopInset={false} includeBottomInset={false} style={styles.wrapperSample}>
          <ThemedTxt text="SafeInsetsWrapper sample" bold />
        </SafeInsetsWrapper>
      </ShowcaseDemoCard>
    </View>
  );
}

const styles = StyleSheet.create({
  demoCard: {
    marginBottom: 12,
  },
  demoDescription: {
    marginBottom: 12,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  showcaseButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rawButton: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    backgroundColor: MainColor,
  },
  surfaceBox: {
    minWidth: 98,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  innerCard: {
    marginBottom: 0,
  },
  wrapperSample: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: MainColor,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
});
