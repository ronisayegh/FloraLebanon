import { MainColor } from '@/constants/Config';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { ThemedTxt, ThemedTxtProps } from '../ThemedTxt';

interface AccessoryHeaderRowProps extends ThemedTxtProps {
  icon?: React.ReactNode;
  title: string;
  accessory?: React.ReactNode;
  leftContentStyle?: StyleProp<ViewStyle>;
  accessoryStyle?: StyleProp<ViewStyle>;
}

const AccessoryHeaderRow = (props: AccessoryHeaderRowProps) => {
  const { icon, title, accessory, leftContentStyle, accessoryStyle, ...textProps } = props;
  return (
    <View style={[styles.container]}>
      <View style={[styles.leftContent, leftContentStyle]}>
        {icon ? <View style={styles.iconWrapper}>{icon}</View> : null}
        <ThemedTxt text={title} color={MainColor} rem={1} fontWeight="600" {...textProps} />
      </View>
      {accessory ? <View style={[accessoryStyle]}>{accessory}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  iconWrapper: {
    marginRight: 4,
  },
});

export { AccessoryHeaderRow, type AccessoryHeaderRowProps };
