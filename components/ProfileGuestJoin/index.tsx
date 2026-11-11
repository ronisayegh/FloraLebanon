import { AppBrandTitle, Card, ThemedBtnTxt, ThemedTxt } from '@/components/basic';
import { MainColor } from '@/constants/Config';
import { Normalize } from '@/constants/Helper';
import { GlobalStyle } from '@/styles';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const whyJoinItems = [
  {
    icon: '🌿',
    title: 'Contribute to Science',
    description: "Help document Lebanon's plant biodiversity",
  },
  {
    icon: '🏆',
    title: 'Earn Badges & Points',
    description: 'Compete on leaderboards and unlock achievements',
  },
  {
    icon: '📚',
    title: 'Learn About Plants',
    description: "Discover Lebanon's unique flora and traditional uses",
  },
];

export const ProfileGuestJoin: React.FC = () => (
  <>
    <Card style={GlobalStyle.tMar5}>
      <AppBrandTitle showBorder={false} />
    </Card>
    <Card>
      <View style={styles.logoBlock}>
        <Image source={require('@/assets/images/logo.png')} resizeMode="contain" style={styles.logo} />
      </View>

      <ThemedTxt text="Welcome to FloraLebanon Collect" rem={1.25} fontWeight="700" color={MainColor} center style={GlobalStyle.tMar32} />
      <ThemedTxt
        text="Join our community and contribute to Lebanon's biodiversity research"
        rem={0.875}
        variant="Secondary"
        center
        style={[GlobalStyle.tMar8, styles.welcomeText]}
      />

      <ThemedBtnTxt
        text="Log In"
        rem={1}
        fontWeight="700"
        buttonStyle={[styles.authButton, GlobalStyle.tMar20]}
        onPress={() => router.navigate('/Pages/LoginFlow/Login')}
      />
      <ThemedBtnTxt
        text="Sign Up"
        rem={1}
        fontWeight="700"
        variant="OutLine"
        buttonStyle={[styles.authButton, GlobalStyle.tMar12]}
        onPress={() => router.navigate('/Pages/LoginFlow/Signup')}
      />

      <ThemedTxt text="By continuing, you agree to our Terms of Service and Privacy Policy" rem={0.75} variant="Secondary" center style={GlobalStyle.tMar16} />
    </Card>

    <Card>
      <ThemedTxt text="Why Join?" rem={1} fontWeight="700" color={MainColor} />
      <View style={GlobalStyle.tMar16}>
        {whyJoinItems.map(item => (
          <View key={item.title} style={[GlobalStyle.row, styles.whyJoinRow]}>
            <ThemedTxt text={item.icon} rem={1.25} style={styles.whyJoinIcon} />
            <View style={GlobalStyle.flex}>
              <ThemedTxt text={item.title} rem={0.875} fontWeight="700" variant="Secondary" />
              <ThemedTxt text={item.description} rem={0.75} variant="Secondary" />
            </View>
          </View>
        ))}
      </View>
    </Card>
  </>
);

const styles = StyleSheet.create({
  logoBlock: {
    alignItems: 'center',
    marginTop: Normalize(8),
  },
  logo: {
    width: Normalize(96),
    height: Normalize(96),
  },
  welcomeText: {
    paddingHorizontal: Normalize(16),
  },
  authButton: {
    minHeight: Normalize(48),
    borderRadius: Normalize(8),
  },
  whyJoinRow: {
    alignItems: 'flex-start',
    marginBottom: Normalize(16),
  },
  whyJoinIcon: {
    width: Normalize(34),
    marginRight: Normalize(4),
  },
});
