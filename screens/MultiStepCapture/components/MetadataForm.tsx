import { Scroll, TextInputIcon, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import { buildFieldCodePreview } from '@/constants/Helper';
import { useDefaultContext } from '@/hooks';
import { GlobalStyle } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Keyboard, StyleSheet, TouchableOpacity, View } from 'react-native';

export type SubmissionMetadata = {
  notes?: string;
  latitude: number;
  longitude: number;
  villageId?: string;
};

interface MetadataProps {
  onSubmit: (data: SubmissionMetadata) => void;
  isSubmitting?: boolean;
  latitude: number | null;
  longitude: number | null;
  resolvedVillageId?: string | null;
  resolvedVillageName?: string | null;
  isFetchingLocation?: boolean;
  isResolvingVillage?: boolean;
  onRefreshLocation: () => void;
  locationInfoText: string;
  locationActionLabel?: string;
  onLocationActionPress?: () => void;
  villageInfoText: string;
  villageActionLabel?: string;
  onVillageActionPress?: () => void;
}

export const MetadataForm = (props: MetadataProps) => {
  const {
    onSubmit,
    isSubmitting,
    latitude,
    longitude,
    resolvedVillageId,
    resolvedVillageName,
    isFetchingLocation,
    isResolvingVillage,
    onRefreshLocation,
    locationInfoText,
    locationActionLabel,
    onLocationActionPress,
    villageInfoText,
    villageActionLabel,
    onVillageActionPress,
  } = props;
  const { ThemeContext, SessionContext } = useDefaultContext();
  const theme = ThemeContext.value;
  const session = SessionContext.value;
  const [notes, setNotes] = useState('');
  const [submissionDate] = useState(() => new Date());
  const date = useMemo(() => submissionDate.toLocaleDateString(), [submissionDate]);
  const hasLocation = useMemo(() => Number.isFinite(latitude) && Number.isFinite(longitude), [latitude, longitude]);
  const fieldCodePreview = useMemo(() => buildFieldCodePreview({ date: submissionDate, user: session.user }), [session.user, submissionDate]);
  const renderInfoRow = (text: string, actionLabel?: string, onPress?: () => void) => (
    <View style={styles.infoRow}>
      <ThemedTxt text={text} variant="Secondary" fontSize={11} style={styles.infoText} />
      {actionLabel && onPress ? (
        <TouchableOpacity onPress={onPress}>
          <ThemedTxt text={actionLabel} color={theme.primary} fontSize={11} style={styles.infoLink} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <View style={GlobalStyle.flex}>
      <Scroll keyboardDismissMode="interactive" style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {/* <EmptySpace height={200} /> */}
        <ThemedTxt text="Location" variant="Primary" fontWeight="700" style={GlobalStyle.vMar8} />
        <ThemedBtnTxt
          variant="OutLine"
          buttonStyle={[styles.locationBtn, { borderColor: theme.primary }]}
          text={isFetchingLocation ? 'Getting current location...' : hasLocation ? 'Refresh My Location' : 'Use My Location'}
          onPress={() => {
            Keyboard.dismiss();
            onRefreshLocation();
          }}
          disabled={isFetchingLocation}
        >
          <Ionicons name="location-outline" size={20} color={theme.primary} />
        </ThemedBtnTxt>
        <View style={styles.coordRow}>
          <View style={GlobalStyle.flex}>
            <ThemedTxt text="Latitude" variant="Secondary" fontSize={12} style={GlobalStyle.bMar8} />
            <ThemedView style={styles.inputContainer} variant="Secondary">
              <Ionicons name="locate-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
              <ThemedTxt text={latitude?.toFixed(6) || 'Not captured yet'} variant="Secondary" />
            </ThemedView>
          </View>
          <View style={GlobalStyle.flex}>
            <ThemedTxt text="Longitude" variant="Secondary" fontSize={12} style={GlobalStyle.bMar8} />
            <ThemedView style={styles.inputContainer} variant="Secondary">
              <Ionicons name="locate-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
              <ThemedTxt text={longitude?.toFixed(6) || 'Not captured yet'} variant="Secondary" />
            </ThemedView>
          </View>
        </View>
        {renderInfoRow(locationInfoText, locationActionLabel, onLocationActionPress)}
        <ThemedTxt text="Detected Village" variant="Primary" fontWeight="700" style={GlobalStyle.vMar8} />
        <ThemedView style={styles.inputContainer} variant="Secondary">
          <Ionicons name="business-outline" size={18} color={theme.primary} style={{ marginRight: 8 }} />
          <ThemedTxt
            text={isResolvingVillage ? 'Finding village...' : resolvedVillageName || (hasLocation ? 'No village match yet' : 'Waiting for location')}
            variant="Secondary"
          />
        </ThemedView>
        {renderInfoRow(villageInfoText, villageActionLabel, onVillageActionPress)}
        <ThemedTxt text="Date" variant="Primary" fontWeight="700" style={GlobalStyle.vMar8} />
        <ThemedView style={styles.inputContainer} variant="Secondary">
          <Ionicons name="calendar-outline" size={20} color={theme.primary} style={{ marginRight: 10 }} />
          <ThemedTxt text={date} variant="Secondary" />
        </ThemedView>
        <ThemedTxt text="Field Code (auto-generated)" variant="Primary" fontWeight="700" style={GlobalStyle.vMar8} />
        <ThemedView style={styles.fieldCodeContainer} variant="Secondary">
          <ThemedTxt text={fieldCodePreview.code} fontSize={18} variant="Secondary" />
          <ThemedTxt text={`Format: ${fieldCodePreview.format}`} color={theme.tertiaryText} fontSize={12} style={GlobalStyle.tMar8} />
        </ThemedView>
        <ThemedTxt text="Field Notes (optional)" variant="Primary" fontWeight="700" style={GlobalStyle.vMar8} />
        <TextInputIcon
          multiline
          isTextarea
          numberOfLines={4}
          placeholder="Optional - Add habitat notes, plant condition..."
          placeholderTextColor={theme.onSecondary}
          inputStyle={[styles.textArea, { borderColor: theme.primary, color: theme.onSecondary }]}
          containerStyle={[{ backgroundColor: theme.secondaryBg }]}
          value={notes}
          onChangeText={setNotes}
          maxLength={350}
          onSubmitEditing={Keyboard.dismiss}
        />
        <View style={[GlobalStyle.row, styles.noteFooter]}>
          <ThemedTxt text={`${notes.length} / 350`} variant="Secondary" fontSize={11} />
        </View>
      </Scroll>
      <View style={styles.footer}>
        <ThemedBtnTxt
          text={isSubmitting ? 'Submitting...' : 'Submit Observation'}
          buttonStyle={{ height: 56 }}
          onPress={() => {
            if (!hasLocation) return;
            Keyboard.dismiss();
            onSubmit({
              notes: notes.trim() || undefined,
              latitude: latitude as number,
              longitude: longitude as number,
              villageId: resolvedVillageId || undefined,
            });
          }}
          disabled={isSubmitting || !hasLocation}
          enabled={!isSubmitting && hasLocation}
          rem={1.25}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  coordRow: { flexDirection: 'row', gap: 12 },
  locationBtn: {
    flexDirection: 'row',
    minHeight: 50,
    borderWidth: 1.5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    minHeight: 50,
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  fieldCodeContainer: {
    minHeight: 74,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  footer: { paddingHorizontal: 16, paddingVertical: 8 },
  noteFooter: { justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  infoRow: { marginTop: 8, gap: 4 },
  infoText: { lineHeight: 16 },
  infoLink: { textDecorationLine: 'underline' },
});
