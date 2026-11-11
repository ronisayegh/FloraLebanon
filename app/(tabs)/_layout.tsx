import { SafeInsetsWrapper, ThemedTxt } from '@/components/basic';
import { Camera, Cog, Home, Sparkles, Target, User } from '@/components/basic/Icons';
import { DEV_TAB, IS_DEV, SHOWCASE_TAB } from '@/constants/Config';
import { MainColor } from '@/constants/Themes/theme-values';
import { useDefaultContext } from '@/hooks';
import { GlobalStyle } from '@/styles';
import { Tabs, router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {
  const Theme = useDefaultContext().ThemeContext.value;
  const [captureSlotSize, setCaptureSlotSize] = React.useState({ width: 60, height: 60 });
  const captureButtonSize = Math.max(44, Math.min(60, captureSlotSize.width * 0.72));
  const captureButtonTranslateY = captureSlotSize.height > 0 ? captureButtonSize * 0.2 - captureSlotSize.height / 2 : -captureButtonSize * 0.25;
  const capturePlusSize = captureButtonSize * 0.38;
  const capturePlusStroke = Math.max(3, captureButtonSize * 0.065);
  const getTabBarLabel = (title: string, focused: boolean) => (
    <ThemedTxt text={title} color={focused ? Theme.primary : Theme.secondary} fontWeight="500" style={{ paddingBottom: 10 }} />
  );
  const getBarIconProps = (props: { focused: boolean; size: number }) => ({ size: props.size, filled: props.focused, strokeWidth: 2 });
  return (
    <SafeInsetsWrapper includeBottomInset={false} style={GlobalStyle.flex}>
      <Tabs
        screenOptions={{
          headerShown: false,
          // tabBarHideOnKeyboard: true,
          tabBarStyle: [{ backgroundColor: Theme.containerBg, borderTopWidth: 1, borderColor: Theme.primary }],
          tabBarItemStyle: [{ paddingVertical: 5 }],
          tabBarInactiveTintColor: Theme.primaryText,
          sceneStyle: [{ backgroundColor: Theme.containerBg }],
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: ({ focused }) => getTabBarLabel('Home', focused),
            tabBarIcon: ({ focused, size }) => <Home strokeFill {...getBarIconProps({ focused, size })} />,
          }}
        />
        <Tabs.Screen
          name="collect"
          options={{
            tabBarLabel: ({ focused }) => getTabBarLabel('Collect', focused),
            tabBarIcon: ({ focused, size }) => <Camera {...getBarIconProps({ focused, size })} />,
          }}
        />
        <Tabs.Screen
          name="capture"
          options={{
            tabBarLabel: () => null,
            tabBarButton: () => (
              <View
                style={styles.captureTabSlot}
                onLayout={event => {
                  const { width, height } = event.nativeEvent.layout;
                  setCaptureSlotSize({ width, height });
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  accessibilityLabel="Take photos"
                  accessibilityRole="button"
                  onPress={() => router.push('/Modals/MultiStepCapture')}
                  style={[
                    styles.captureTabButton,
                    {
                      width: captureButtonSize,
                      height: captureButtonSize,
                      borderRadius: captureButtonSize / 2,
                      transform: [{ translateY: captureButtonTranslateY }],
                    },
                  ]}
                >
                  <View style={[styles.capturePlusHorizontal, { width: capturePlusSize, height: capturePlusStroke, borderRadius: capturePlusStroke / 2 }]} />
                  <View style={[styles.capturePlusVertical, { width: capturePlusStroke, height: capturePlusSize, borderRadius: capturePlusStroke / 2 }]} />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="missions"
          options={{
            tabBarLabel: ({ focused }) => getTabBarLabel('Missions', focused),
            tabBarIcon: ({ focused, size }) => <Target {...getBarIconProps({ focused, size })} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarLabel: ({ focused }) => getTabBarLabel('Profile', focused),
            tabBarIcon: ({ focused, size }) => <User {...getBarIconProps({ focused, size })} />,
          }}
        />
        <Tabs.Screen
          name="showcase"
          options={{
            href: IS_DEV && SHOWCASE_TAB ? undefined : null,
            tabBarLabel: ({ focused }) => getTabBarLabel('Showcase', focused),
            tabBarIcon: ({ focused, size }) => <Sparkles {...getBarIconProps({ focused, size })} />,
          }}
        />
        <Tabs.Screen
          name="dev"
          options={{
            href: IS_DEV && DEV_TAB ? undefined : null,
            tabBarLabel: ({ focused }) => getTabBarLabel('Dev Test', focused),
            tabBarIcon: ({ focused, size }) => <Cog {...getBarIconProps({ focused, size })} fill={focused ? Theme.primary : Theme.secondary} filled={false} />,
          }}
        />
      </Tabs>
    </SafeInsetsWrapper>
  );
}

const styles = StyleSheet.create({
  captureTabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureTabButton: {
    backgroundColor: MainColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
  },
  capturePlusHorizontal: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  capturePlusVertical: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
});
