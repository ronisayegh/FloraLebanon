import { Card, Scroll, ThemedTxt, ThemedView } from '@/components/basic';
import { MainColor } from '@/constants/Config';
import { GlobalStyle } from '@/styles';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import FoundationsDemo from './Demos/FoundationsDemo';
import InputsDemo from './Demos/InputsDemo';
import MediaDemo from './Demos/MediaDemo';
import OverlaysDemo from './Demos/OverlaysDemo';
import UtilitiesDemo from './Demos/UtilitiesDemo';

const ShowcaseSection = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <ThemedTxt text={title} fontWeight="700" fontSize={22} color={MainColor} />
    <ThemedTxt text={description} variant="Secondary" style={styles.sectionDescription} />
    {children}
  </View>
);

export default function ShowcaseScreen() {
  return (
    <ThemedView variant="Container" style={GlobalStyle.flex}>
      <Scroll>
        <Card>
          <View>
            <ThemedTxt text="Core Showcase" fontSize={32} fontWeight="700" style={styles.headerTitle} nowwarp />
          </View>
          <ThemedTxt
            text="A live catalog of the shared app_core components with real interactions for tabs, inputs, media, modals, and utility wrappers."
            variant="Secondary"
            fontSize={16}
            style={styles.headerSubtitle}
          />
        </Card>

        <ShowcaseSection title="Foundations" description="Core presentation primitives, wrappers, and layout surfaces.">
          <FoundationsDemo />
        </ShowcaseSection>

        <ShowcaseSection title="Inputs and Selection" description="Input widgets, selectors, toggles, and date/time controls.">
          <InputsDemo />
        </ShowcaseSection>

        <ShowcaseSection title="Media and Files" description="Image, carousel, and file-selection components.">
          <MediaDemo />
        </ShowcaseSection>

        <ShowcaseSection title="Overlays" description="Modal helpers and image viewer behavior.">
          <OverlaysDemo />
        </ShowcaseSection>

        <ShowcaseSection title="Utilities and Feedback" description="Animated, scrolling, and icon-focused support components.">
          <UtilitiesDemo />
        </ShowcaseSection>
      </Scroll>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    borderBottomWidth: 3,
    borderColor: MainColor,
    paddingBottom: 8,
  },
  headerSubtitle: {
    marginTop: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionDescription: {
    marginTop: 8,
    marginBottom: 12,
  },
});
