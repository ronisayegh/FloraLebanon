import { ThemedTxt } from '@/components/basic';
import { MainColor } from '@/constants/Config';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
export default () => {
  return (
    <View style={styles.container}>
      <ThemedTxt text="This screen doesn't exist." fontSize={20} fontWeight="700" center />
      <Link href="/(tabs)" style={styles.link}>
        <ThemedTxt text="Go to home screen!" fontSize={20} fontWeight="700" color={MainColor} center />
      </Link>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
