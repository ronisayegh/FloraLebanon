import React, { useEffect, useState } from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';

type CustomSplashScreenProps = {
  onReady?: () => void;
};

export const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({ onReady }) => {
  const [isBackgroundReady, setBackgroundReady] = useState(false);
  const [isLogoReady, setLogoReady] = useState(false);

  useEffect(() => {
    if (isBackgroundReady && isLogoReady) onReady?.();
  }, [isBackgroundReady, isLogoReady, onReady]);

  return (
    <ImageBackground
      source={require('@/assets/images/custom_splash.png')}
      resizeMode="cover"
      style={styles.container}
      onLoad={() => setBackgroundReady(true)}
      onError={() => setBackgroundReady(true)}
    >
      <View style={styles.content}>
        <Image
          source={require('@/assets/images/logo_white.png')}
          resizeMode="contain"
          style={styles.logo}
          onLoad={() => setLogoReady(true)}
          onError={() => setLogoReady(true)}
        />
        <Text style={styles.title}>FloraLebanon</Text>
        <Text style={styles.collect}>Collect</Text>
        <View style={styles.separator} />
        <Text style={styles.subtitle}>Photograph plants.</Text>
        <Text style={styles.subtitle}>Support future plant identification.</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    marginTop: -32,
  },
  logo: {
    width: 92,
    height: 92,
    marginBottom: 14,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  collect: {
    color: '#fff',
    fontSize: 20,
    fontStyle: 'italic',
    fontWeight: '700',
    lineHeight: 26,
  },
  separator: {
    width: 48,
    height: 1,
    marginTop: 18,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  subtitle: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
