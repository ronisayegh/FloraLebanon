import type { MissingPlantPhotosMissionDetail } from '@/@Types';
import { AccessoryHeaderRow, Card, ImgViewer, SafeInsetsWrapper, Scroll, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import ModalHeader from '@/components/basic/Header';
import { InfoCircle, MapMark } from '@/components/basic/Icons';
import { MainColor } from '@/constants/Config';
import { Normalize, NormalizeRem, NormalizeRemFont } from '@/constants/Helper';
import { useDefaultContext } from '@/hooks';
import { GetPlantMissingPhotosMissionDetail } from '@/services';
import { GlobalStyle } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

const GALLERY_TILES = 4;

type LanguageCode = 'en' | 'fr' | 'ar';

const LANGUAGE_TABS: Array<{ code: LanguageCode; label: string; emptyLabel: string }> = [
  { code: 'en', label: 'English', emptyLabel: 'No English content yet.' },
  { code: 'fr', label: 'French', emptyLabel: 'No French content yet.' },
  { code: 'ar', label: 'Arabic', emptyLabel: 'No Arabic content yet.' },
];

const renderGalleryTile = (uri?: string | null, key?: string | number, onPress?: () => void) => (
  <View key={String(key)} style={styles.galleryTile}>
    {uri ? (
      <TouchableOpacity style={styles.galleryImage} onPress={onPress}>
        <Image source={{ uri }} style={styles.galleryImage} resizeMode="cover" />
      </TouchableOpacity>
    ) : (
      <View style={[styles.galleryImage, styles.galleryPlaceholder]}>
        <Ionicons name="image-outline" size={52} color="#ADADAD" />
      </View>
    )}
  </View>
);

const LocalizedTextTabs = ({
  activeLanguage,
  values,
  onChangeLanguage,
}: {
  activeLanguage: LanguageCode;
  values: Record<LanguageCode, string | null | undefined>;
  onChangeLanguage: (language: LanguageCode) => void;
}) => {
  const activeTab = LANGUAGE_TABS.find(tab => tab.code === activeLanguage) || LANGUAGE_TABS[0];
  const activeText = values[activeLanguage]?.trim();

  return (
    <View style={styles.localizedBlock}>
      <View style={styles.languageTabs}>
        {LANGUAGE_TABS.map(tab => {
          const isActive = tab.code === activeLanguage;

          return (
            <TouchableOpacity
              key={tab.code}
              activeOpacity={0.85}
              onPress={() => onChangeLanguage(tab.code)}
              style={[styles.languageTab, isActive ? styles.languageTabActive : null]}>
              <ThemedTxt text={tab.label} color={isActive ? '#FFFFFF' : MainColor} rem={0.75} fontWeight="600" />
            </TouchableOpacity>
          );
        })}
      </View>
      <ThemedTxt
        text={activeText || activeTab.emptyLabel}
        variant="Secondary"
        style={[styles.localizedText, activeLanguage === 'ar' ? styles.arabicText : null]}
      />
    </View>
  );
};

export default function PlantDetailScreen() {
  const theme = useDefaultContext().ThemeContext.value;
  const router = useRouter();
  const params = useLocalSearchParams<{ plantId?: string }>();
  const plantId = typeof params.plantId === 'string' ? params.plantId : '';
  const [detail, setDetail] = React.useState<MissingPlantPhotosMissionDetail | null>(null);
  const [isLoading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>();
  const [descriptionLanguage, setDescriptionLanguage] = useState<LanguageCode>('en');
  const [funFactLanguage, setFunFactLanguage] = useState<LanguageCode>('en');

  const loadDetail = React.useCallback(async () => {
    if (!plantId) {
      setError('Plant id is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await GetPlantMissingPhotosMissionDetail(plantId);
      if (!response.success) {
        setError(response.error.message);
        return;
      }
      setDetail(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load this plant mission.');
    } finally {
      setLoading(false);
    }
  }, [plantId]);

  useFocusEffect(
    React.useCallback(() => {
      loadDetail();
    }, [loadDetail]),
  );

  const galleryImages = React.useMemo(() => {
    const gallery = detail?.gallery.map(item => item.browserUrl || item.url) || [];
    return gallery.filter((value, index, array) => Boolean(value) && array.indexOf(value) === index).slice(0, GALLERY_TILES);
  }, [detail]);

  const locationText =
    detail?.locations
      .map(item => item.nameEn || item.nameFr || item.nameAr)
      .filter(Boolean)
      .join(', ') || 'No verified location yet.';
  const contributorMax = detail?.stepCoverage.requiredStepsCount || 15;
  const contributorCount = Math.min(detail?.contributorCount || 0, contributorMax);

  return (
    <SafeInsetsWrapper>
      <ThemedView style={GlobalStyle.flex} variant="Container">
        <ModalHeader />
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={MainColor} />
            <ThemedTxt text="Loading plant details..." variant="Secondary" style={GlobalStyle.tMar12} />
          </View>
        ) : error || !detail ? (
          <View style={styles.centerState}>
            <ThemedTxt text={error || 'Plant mission not found.'} variant="Secondary" center />
            <ThemedBtnTxt text="Retry" buttonStyle={[GlobalStyle.tMar16, styles.retryButton]} onPress={loadDetail} />
          </View>
        ) : (
          <>
            <Scroll contentContainerStyle={styles.scrollContent} leaveKeyboard>
              <View style={styles.titleBlock}>
                <ThemedTxt
                  text={detail.scientificName || detail.nameEn}
                  variant="Primary"
                  italic
                  style={[NormalizeRemFont(1.25, 1.5), GlobalStyle.bMar4]}
                  fontWeight="600"
                />
                {detail.nameEn ? <ThemedTxt variant="Secondary" text={detail.nameEn} style={NormalizeRemFont(0.875, 1.4)} /> : null}
                {detail.nameFr ? <ThemedTxt variant="Secondary" text={detail.nameFr} style={NormalizeRemFont(0.875, 1.4)} /> : null}
                {detail.nameAr ? <ThemedTxt variant="Secondary" text={detail.nameAr} style={NormalizeRemFont(0.875, 1.4)} /> : null}
              </View>

              <Card showBorder borderColor={MainColor} style={styles.sectionCard}>
                <ThemedTxt text="How It Looks Through The Year" variant="Primary" rem={1.1} fontWeight="500" />
                <View style={styles.galleryGrid}>
                  {Array.from({ length: GALLERY_TILES }, (_, index) =>
                    renderGalleryTile(galleryImages[index], index, () => {
                      setCurrentUrl(galleryImages[index]);
                      setShowModal(true);
                    }),
                  )}
                </View>
              </Card>

              <Card showBorder borderColor={MainColor} style={styles.sectionCard}>
                <AccessoryHeaderRow
                  title=" Where to Find It"
                  variant="Primary"
                  rem={1.1}
                  fontWeight="500"
                  icon={<MapMark size={NormalizeRem(1.2)} strokeWidth={2} />}
                />
                <ThemedView style={styles.infoPanel}>
                  <ThemedTxt text="📍 Often found in:" rem={0.75} variant="Secondary" />
                  <ThemedTxt text={locationText} color={MainColor} rem={0.875} style={GlobalStyle.tMar8} />
                  <ThemedTxt text="These are areas where other users have spotted this plant." variant="Secondary" rem={0.75} style={GlobalStyle.tMar8} />
                </ThemedView>
              </Card>

              <Card showBorder borderColor={MainColor} style={styles.sectionCard}>
                <AccessoryHeaderRow
                  title="People with verified submissions"
                  rem={0.75}
                  color={theme.onSecondary}
                  accessory={<ThemedTxt text={`${contributorCount} / ${contributorMax}`} color={MainColor} rem={0.75} fontWeight="500" />}
                />
                <View style={styles.peopleRow}>
                  {Array.from({ length: contributorMax }, (_, index) => (
                    <Ionicons
                      key={index}
                      name="people"
                      size={Normalize(16)}
                      color={index < contributorCount ? MainColor : '#D9D9D9'}
                      style={styles.peopleIcon}
                    />
                  ))}
                </View>
              </Card>

              <Card showBorder borderColor={MainColor} style={styles.sectionCard}>
                <AccessoryHeaderRow title="About This Plant" rem={1.1} fontWeight="500" icon={<InfoCircle size={NormalizeRem(1.2)} />} />
                <LocalizedTextTabs
                  activeLanguage={descriptionLanguage}
                  onChangeLanguage={setDescriptionLanguage}
                  values={{ en: detail.description, fr: detail.descriptionFr, ar: detail.descriptionAr }}
                />
              </Card>

              {detail.funFact || detail.funFactFr || detail.funFactAr ? (
                <Card showBorder borderColor={MainColor} style={styles.sectionCard}>
                  <AccessoryHeaderRow title="✨ Did You Know?" rem={1} fontWeight="700" />
                  <LocalizedTextTabs
                    activeLanguage={funFactLanguage}
                    onChangeLanguage={setFunFactLanguage}
                    values={{ en: detail.funFact, fr: detail.funFactFr, ar: detail.funFactAr }}
                  />
                </Card>
              ) : null}
            </Scroll>

            <View style={styles.footer}>
              <ThemedBtnTxt
                text="Take Photos of This Plant"
                buttonStyle={styles.primaryButton}
                onPress={() =>
                  router.push({
                    pathname: '/Modals/MultiStepCapture',
                    params: {
                      plantId: detail.id,
                      missionCode: 'MISSING_PLANT_PHOTOS',
                      missingStepNumbers: JSON.stringify(detail.stepCoverage.missingStepNumbers),
                    },
                  })
                }
                rem={1.5}
              />
              <ThemedBtnTxt text="Close" buttonStyle={styles.secondaryButton} variant="OutLine" rem={1.5} onPress={() => router.back()} />
            </View>
          </>
        )}
        <ImgViewer
          closeModal={() => setShowModal(false)}
          isVisible={showModal}
          imageUrls={galleryImages.filter(e => !!e).map(e => ({ url: e, originalUrl: e }))}
          currentUrl={currentUrl}
        />
      </ThemedView>
    </SafeInsetsWrapper>
  );
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    minWidth: 120,
    height: 44,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  titleBlock: {
    marginBottom: 20,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 18,
    borderColor: MainColor,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  galleryTile: {
    width: '47%',
    aspectRatio: 1.15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F2F2F2',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  infoPanel: {
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
  },
  peopleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  peopleIcon: {
    marginRight: 4,
    marginBottom: 4,
  },
  localizedBlock: {
    marginTop: 10,
  },
  languageTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  languageTab: {
    borderWidth: 1,
    borderColor: MainColor,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  languageTabActive: {
    backgroundColor: MainColor,
  },
  localizedText: {
    ...NormalizeRemFont(0.875, 1.4),
  },
  arabicText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  primaryButton: {
    marginBottom: 12,
    padding: 12,
  },
  secondaryButton: {
    padding: 12,
  },
});
