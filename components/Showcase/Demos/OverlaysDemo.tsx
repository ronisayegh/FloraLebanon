import { Card, ConfimModal, ImgViewer, ImgWithDef, ModalWithX, ThemedBtnTxt, ThemedTxt } from '@/components/basic';
import { GlobalStyle } from '@/styles';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const sampleImages = [
  'https://picsum.photos/seed/core-showcase-1/800/800',
  'https://picsum.photos/seed/core-showcase-2/800/800',
  'https://picsum.photos/seed/core-showcase-3/800/800',
];

const ShowcaseDemoCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <Card title={title} showBorder style={styles.demoCard}>
    <ThemedTxt text={description} variant="Secondary" style={styles.demoDescription} />
    {children}
  </Card>
);

export default function OverlaysDemo() {
  const [middleVisible, setMiddleVisible] = useState(false);
  const [bottomVisible, setBottomVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmResult, setConfirmResult] = useState('No action yet');
  const [viewerVisible, setViewerVisible] = useState(false);
  const viewerImages = useMemo(() => sampleImages.map(url => ({ url })), []);

  return (
    <View>
      <ShowcaseDemoCard title="ModalWithX" description="Middle and bottom modal positions with open and close controls.">
        <View style={styles.buttonRow}>
          <ThemedBtnTxt text="Open middle modal" buttonStyle={styles.showcaseButton} onPress={() => setMiddleVisible(true)} />
          <ThemedBtnTxt text="Open bottom sheet" variant="OutLine" buttonStyle={styles.showcaseButton} onPress={() => setBottomVisible(true)} />
        </View>

        <ModalWithX isVisible={middleVisible} closeModal={() => setMiddleVisible(false)} position="middle">
          <View style={styles.modalBody}>
            <ThemedTxt text="Middle modal demo" fontWeight="700" fontSize={18} />
            <ThemedTxt text="This uses the shared close affordance and centered layout." variant="Secondary" style={GlobalStyle.tMar8} />
            <ThemedBtnTxt text="Close" buttonStyle={[styles.showcaseButton, GlobalStyle.tMar16]} onPress={() => setMiddleVisible(false)} />
          </View>
        </ModalWithX>

        <ModalWithX isVisible={bottomVisible} closeModal={() => setBottomVisible(false)} position="bottom" swipeToClose>
          <View style={styles.modalBody}>
            <ThemedTxt text="Bottom modal demo" fontWeight="700" fontSize={18} />
            <ThemedTxt text="Swipe down or use the button to dismiss." variant="Secondary" style={GlobalStyle.tMar8} />
            <ThemedBtnTxt text="Close bottom sheet" buttonStyle={[styles.showcaseButton, GlobalStyle.tMar16]} onPress={() => setBottomVisible(false)} />
          </View>
        </ModalWithX>
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="ConfimModal" description="Confirmation modal with accept and reject outcomes shown back on the screen.">
        <ThemedBtnTxt text="Open confirm modal" buttonStyle={styles.showcaseButton} onPress={() => setConfirmVisible(true)} />
        <ThemedTxt text={`Result: ${confirmResult}`} variant="Secondary" style={GlobalStyle.tMar8} />
        <ConfimModal
          isVisible={confirmVisible}
          Text="Do you want to keep this showcase interaction?"
          onReject={() => {
            setConfirmResult('Rejected');
            setConfirmVisible(false);
          }}
          onAccept={() => {
            setConfirmResult('Accepted');
            setConfirmVisible(false);
          }}
        />
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="ImgViewer" description="Tap a preview tile or the button to launch the image viewer modal.">
        <View style={styles.rowWrap}>
          {sampleImages.map(url => (
            <Pressable key={url} onPress={() => setViewerVisible(true)}>
              <ImgWithDef url={url} style={styles.viewerThumb} />
            </Pressable>
          ))}
        </View>
        <ThemedBtnTxt text="Open image viewer" buttonStyle={[styles.showcaseButton, GlobalStyle.tMar12]} onPress={() => setViewerVisible(true)} />
        <ImgViewer isVisible={viewerVisible} closeModal={() => setViewerVisible(false)} imageUrls={viewerImages} currentUrl={sampleImages[0]} enableSwipeDown />
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
  modalBody: {
    width: '100%',
    padding: 24,
    alignItems: 'flex-start',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  viewerThumb: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
