import { AnimatedNumber, Card, Scroll, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import { GetFileIcon, SVGIcons } from '@/components/basic/Icons';
import type { SimpleMime } from '@/constants/Helper';
import { useDefaultContext } from '@/hooks';
import { GlobalStyle } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const fileTypes: SimpleMime[] = ['image', 'pdf', 'zip', 'word', 'excel', 'video'];
const showcaseIconNames = Object.keys(SVGIcons) as (keyof typeof SVGIcons)[];

const ShowcaseDemoCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <Card title={title} showBorder style={styles.demoCard}>
    <ThemedTxt text={description} variant="Secondary" style={styles.demoDescription} />
    {children}
  </Card>
);

export default function UtilitiesDemo() {
  const [counter, setCounter] = useState(1280);
  const theme = useDefaultContext().ThemeContext.value;
  const iconEntries = useMemo(() => showcaseIconNames.map(name => [name, SVGIcons[name]] as const), []);
  const ioniconNames = Object.keys(Ionicons.glyphMap) as Array<keyof typeof Ionicons.glyphMap>;

  return (
    <View>
      <ShowcaseDemoCard title="AnimatedNumber" description="Animated numeric transition on value updates.">
        <AnimatedNumber value={counter} />
        <View style={styles.buttonRow}>
          <ThemedBtnTxt text="Increase" buttonStyle={styles.showcaseButton} onPress={() => setCounter(value => value + 375)} />
          <ThemedBtnTxt text="Reset" variant="OutLine" buttonStyle={styles.showcaseButton} onPress={() => setCounter(1280)} />
        </View>
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="Scroll" description="Shared scroll container used here for a horizontal utility list.">
        <Scroll horizontal flex={false} style={styles.utilityScroll}>
          {['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map(label => (
            <ThemedView key={label} variant="Secondary" style={styles.utilityChip}>
              <ThemedTxt text={label} bold />
            </ThemedView>
          ))}
        </Scroll>
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="Icons and File Icons" description="Compact icon gallery using the shared SVG exports and file-icon helper mapping.">
        <ThemedTxt text="SVG Icons" variant="Secondary" fontSize={16} bold style={GlobalStyle.vMar8} />
        <View style={styles.iconGrid}>
          {iconEntries.map(([name, Icon]) => (
            <View key={name} style={styles.iconCell}>
              <Icon size={24} style={styles.iconGraphic} fill={theme.primary} filled={false} />
              <ThemedTxt text={name} variant="Secondary" fontSize={10} center style={GlobalStyle.tMar4} />
            </View>
          ))}
        </View>
        <ThemedTxt text="Files Icons" variant="Secondary" fontSize={16} bold style={GlobalStyle.vMar8} />
        <View style={[styles.iconGrid, GlobalStyle.tMar12]}>
          {fileTypes.map(type => (
            <View key={type} style={styles.iconCell}>
              {GetFileIcon(type, 24, { style: styles.iconGraphic })}
              <ThemedTxt text={type} variant="Secondary" fontSize={10} center style={GlobalStyle.tMar4} />
            </View>
          ))}
        </View>
        <ThemedTxt text="Ionicons Icons" variant="Secondary" fontSize={16} bold style={GlobalStyle.vMar8} />
        <View style={styles.iconGrid}>
          {ioniconNames.map(name => (
            <View key={name} style={styles.iconCell}>
              <Ionicons name={name} size={24} style={styles.iconGraphic} color={theme.primary} filled={false} />
              <ThemedTxt text={name} variant="Secondary" fontSize={10} center style={GlobalStyle.tMar4} />
            </View>
          ))}
        </View>
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
  utilityScroll: {
    maxHeight: 52,
  },
  utilityChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 10,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  iconCell: {
    width: 74,
    minHeight: 72,
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginHorizontal: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d6d6d6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGraphic: {
    width: 24,
    height: 24,
  },
});
