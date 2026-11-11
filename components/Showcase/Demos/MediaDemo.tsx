import { Card, CircleImage, Card as DemoCard, FilePicker, ImgWithDef, SimpleCachedImg, SimpleCarousel, ThemedTxt, ThemedView } from '@/components/basic';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

const sampleImages = [
  'https://picsum.photos/seed/core-showcase-1/800/800',
  'https://picsum.photos/seed/core-showcase-2/800/800',
  'https://picsum.photos/seed/core-showcase-3/800/800',
];

const carouselCards = [
  { id: 'c1', title: 'Primary card', body: 'A compact card inside the horizontal carousel.' },
  { id: 'c2', title: 'Media card', body: 'Useful for lightweight galleries and previews.' },
  { id: 'c3', title: 'Feature card', body: 'The arrows come from the shared carousel component.' },
];

const ShowcaseDemoCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <DemoCard title={title} showBorder style={styles.demoCard}>
    <ThemedTxt text={description} variant="Secondary" style={styles.demoDescription} />
    {children}
  </DemoCard>
);

export default function MediaDemo() {
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);

  return (
    <View>
      <ShowcaseDemoCard title="ImgWithDef and CircleImage" description="Avatar-style fallbacks, initials, and remote image rendering.">
        <View style={styles.rowWrap}>
          <CircleImage userName="Core User" style={styles.circleSample} />
          <CircleImage url={sampleImages[0]} userName="Loaded User" style={styles.circleSample} />
          <ImgWithDef url={sampleImages[1]} style={styles.squareImage} />
        </View>
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="SimpleCachedImg" description="Direct cached image loading with an explicit fallback node.">
        <SimpleCachedImg
          url={sampleImages[2]}
          style={styles.cachedImage}
          TempNode={
            <ThemedView variant="Secondary" style={styles.cachedFallback}>
              <ThemedTxt text="Loading fallback" variant="Secondary" />
            </ThemedView>
          }
        />
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="SimpleCarousel" description="Horizontal card carousel with built-in navigation arrows.">
        <SimpleCarousel
          data={carouselCards}
          itemWidth={220}
          renderItem={({ item }) => (
            <View style={styles.carouselItem}>
              <Card title={item.title} showBorder style={styles.carouselCard}>
                <ThemedTxt text={item.body} variant="Secondary" />
              </Card>
            </View>
          )}
        />
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="FilePicker" description="Real file and media picker flow with selected file previews.">
        <FilePicker selectedFiles={selectedFiles} onFilesChanged={setSelectedFiles} fileTypes={['image', 'pdf', 'zip', 'text']} />
        <ThemedTxt text={`Selected files: ${selectedFiles.length}`} variant="Secondary" />
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
  circleSample: {
    width: 72,
    height: 72,
  },
  squareImage: {
    width: 120,
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cachedImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cachedFallback: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselItem: {
    width: 220,
    paddingHorizontal: 16,
  },
  carouselCard: {
    marginBottom: 0,
  },
});
