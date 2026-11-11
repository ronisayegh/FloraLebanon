import { AccessoryHeaderRow, Card, Scroll, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import { MagnifyingGlass, MapMark, Target } from '@/components/basic/Icons';
import { MainColor } from '@/constants/Config';
import { Normalize, NormalizeRemFont } from '@/constants/Helper';
import { GlobalStyle } from '@/styles';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function MissionsScreen() {
  const router = useRouter();

  return (
    <ThemedView variant="Container" style={GlobalStyle.flex}>
      <Scroll>
        <View>
          <View style={GlobalStyle.alignStart}>
            <ThemedTxt text="Missions" rem={1.5} fontWeight="700" style={styles.headerTitle} nowwarp />
          </View>
          <ThemedTxt
            text="Ready for a challenge? Complete missions, earn badges, and make a real impact."
            variant="Secondary"
            style={[GlobalStyle.tMar12, NormalizeRemFont(0.875, 1.4)]}
          />
          <ThemedTxt
            text="These are the current missions, adjusted over time to improve data coverage across Lebanon."
            variant="Tertiary"
            style={[GlobalStyle.tMar8, NormalizeRemFont(0.75, 1.4)]}
          />
        </View>

        <Card style={styles.missionCard} showBorder>
          <AccessoryHeaderRow
            title="Plants With Missing Photos"
            icon={<Target filled size={Normalize(20)} strokeWidth={2} />}
            accessory={<ThemedTxt text="⭐ +5 pts" color={MainColor} fontWeight="600" rem={1} />}
          />
          <ThemedTxt text="Go on a plant hunt to help complete Lebanon's plant photo collection." variant="Secondary" rem={0.875} style={GlobalStyle.vMar12} />
          <ThemedBtnTxt
            text="See all Plants With Missing Photos >"
            buttonStyle={styles.actionButton}
            rem={1}
            onPress={() => router.push('/Modals/MissionMissingPlants')}
          />
        </Card>

        <Card style={styles.missionCard} showBorder>
          <AccessoryHeaderRow
            title="Villages With Few Photos"
            icon={<MapMark filled={false} size={Normalize(20)} strokeWidth={2} />}
            accessory={<ThemedTxt text="⭐ +5 pts" color={MainColor} fontWeight="600" rem={1} />}
          />
          <ThemedTxt text="Go on a plant hunt in villages with few photos." variant="Secondary" style={GlobalStyle.vMar12} rem={0.875} />
          <ThemedBtnTxt
            text="See all Villages With Few Photos >"
            buttonStyle={styles.actionButton}
            rem={1}
            onPress={() => router.push('/Modals/MissionFewVillages')}
          />
        </Card>

        <Card style={styles.missionCard} showBorder>
          <AccessoryHeaderRow
            title="Help Improve Plant Identification by AI"
            icon={<MagnifyingGlass filled={false} size={Normalize(20)} strokeWidth={2} />}
            accessory={
              <View style={styles.pilotBadge}>
                <ThemedTxt text="Pilot" color={MainColor} fontWeight="600" rem={0.6} />
              </View>
            }
          />
          <ThemedTxt
            text="Try our pilot plant identification feature and help us understand where it works best."
            variant="Secondary"
            style={GlobalStyle.vMar12}
            rem={0.875}
          />
          <ThemedBtnTxt text="Submit a photo & check identification by AI" buttonStyle={styles.actionButton} rem={1} onPress={() => {}} />
        </Card>
      </Scroll>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    borderBottomWidth: 1,
    borderColor: MainColor,
    paddingBottom: 8,
  },
  missionCard: {
    borderColor: MainColor,
    borderWidth: 2,
    borderRadius: 18,
    marginTop: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: MainColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pilotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: MainColor,
  },
  actionButton: {
    backgroundColor: MainColor,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
