import { ThemedTxt } from '@/components/basic';
import { MainColor } from '@/constants/Config';
import { Normalize } from '@/constants/Helper';
import { GlobalStyle } from '@/styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const ModalHeader = () => {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={[GlobalStyle.row, GlobalStyle.alignCenter]}>
        <Ionicons name="arrow-back" size={Normalize(24)} color={MainColor} />
        <ThemedTxt text="Back" color={MainColor} rem={1.2} style={GlobalStyle.lMar8} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="close" size={Normalize(24)} color={MainColor} />
      </TouchableOpacity>
    </View>
  );
};

export default ModalHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: MainColor,
  },
});
