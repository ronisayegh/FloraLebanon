import { ThemedTxt } from '@/components/basic';
import { CircleCheck } from '@/components/basic/Icons';
import { MainColor } from '@/constants/Config';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { StepConfig } from '../constants';

type StepHeaderProps = {
  showMetadata: boolean;
  stepData: StepConfig;
  onBack: () => void;
  onClose: () => void;
};

const StepHeader = ({ showMetadata, stepData, onBack, onClose }: StepHeaderProps) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={MainColor} />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        {showMetadata ? <CircleCheck size={20} filled strokeWidth={2} /> : <stepData.icon size={20} filled strokeWidth={2} />}
        <ThemedTxt
          text={showMetadata ? 'Final Step - Add Metadata' : stepData.title}
          fontSize={16}
          fontWeight="600"
          color={MainColor}
          style={styles.headerTitle}
          nowwarp
        />
      </View>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close" size={24} color={MainColor} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    marginLeft: 6,
  },
});

export default StepHeader;
