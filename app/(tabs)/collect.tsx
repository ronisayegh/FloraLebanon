import { AppBrandTitle, Card, ThemedBtnTxt, ThemedTxt, ThemedView } from '@/components/basic';
import { Camera } from '@/components/basic/Icons';
import { Normalize, NormalizeRemFont } from '@/constants/Helper';
import { GlobalStyle } from '@/styles';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function CollectScreen() {
  return (
    <ThemedView variant="Container" style={styles.container}>
      <Card style={GlobalStyle.tMar5}>
        <View style={[GlobalStyle.row, GlobalStyle.spaceBetween, GlobalStyle.alignCenter]}>
          <AppBrandTitle style={[{ paddingBottom: 0 }]} />
          <Camera size={Normalize(48)} filled strokeWidth={2} />
        </View>
        <ThemedTxt text="Take photos" rem={1.25} style={[GlobalStyle.tMar12]} />
        <ThemedTxt
          text="This citizen science project aims to engage people in taking many wild plant photos all over Lebanon and at different times of the year. With this data, we will use AI to build an app that helps conservationists document where wild plants grow in Lebanon and how their presence is shifting over time."
          variant="Secondary"
          rem={0.875}
          style={[GlobalStyle.tMar4, NormalizeRemFont(0.875, 1.625)]}
        />
        <ThemedTxt
          text={{ url: 'https://sites.aub.edu.lb/slbcenterincubator/identifying-plant-species/', urlText: 'website.', textBefore: 'Learn more on our  ' }}
          rem={0.875}
          style={[GlobalStyle.tMar8]}
          variant="Secondary"
        />
      </Card>
      <Card style={[GlobalStyle.alignCenter]}>
        <View style={GlobalStyle.maxRow}>
          <ThemedTxt text="🌿   Citizen Science Data Collection" style={[NormalizeRemFont(1.25, 1.5), { fontWeight: 600 }]} />
        </View>
        <ThemedTxt text="Take 14 photos of the SAME plant" rem={1.125} fontWeight="600" center style={[GlobalStyle.tMar24]} />
        <ThemedTxt text="Follow the guide to photograph the same wild plant from different angles." variant="Secondary" rem={0.875} center style={[GlobalStyle.tMar8]} />
        <ThemedBtnTxt
          text="+ Take Photos"
          buttonStyle={[GlobalStyle.tMar16, { paddingHorizontal: 24, paddingVertical: 12 }]}
          rem={1.25}
          onPress={() => router.push('/Modals/MultiStepCapture')}
        />
      </Card>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
