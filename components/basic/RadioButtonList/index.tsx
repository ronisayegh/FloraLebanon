import { MainColor } from '@/constants/Config';
import { Normalize } from '@/constants/Helper';
import { useDefaultContext } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Check } from '../Icons';
import { ThemedTxt } from '../ThemedTxt';
export type RadioButtonValueType = { name: string };
export type RadioButtonType = { selectedIndex: number[] };
export interface RadioButtonListProps {
  onSelection?: (indexs: number[]) => void;
  selectedValues: number[];
  height: number;
  data: RadioButtonValueType[];
  minSelectLimit?: number;
  maxSelectLimit?: number;
  radio?: boolean;
}
export const RadioButtonList: React.FC<RadioButtonListProps> = props => {
  const Theme = useDefaultContext().ThemeContext.value;
  const { onSelection: onSelectionProps, selectedValues, data, minSelectLimit = 0, maxSelectLimit, radio } = props;
  const [selectedIndex, setSelectedIndex] = useState<number[]>(selectedValues);
  useEffect(() => setSelectedIndex(selectedValues), [selectedValues]);
  const isRadioStyle = radio ?? !(minSelectLimit === 0 && maxSelectLimit !== 1);
  const shape = isRadioStyle ? styles.radioShape : styles.checkboxShape;
  const onSelection = (_res: RadioButtonValueType, index: number) => {
    setSelectedIndex(prevState => {
      let updatedSelectedIndex: number[] = [...prevState];
      const isCurrentlySelected = updatedSelectedIndex.includes(index);
      const canSelectMore = !maxSelectLimit || updatedSelectedIndex.length < maxSelectLimit;
      if (isCurrentlySelected) {
        if (updatedSelectedIndex.length > minSelectLimit) updatedSelectedIndex = updatedSelectedIndex.filter(item => item !== index);
      } else if (canSelectMore) updatedSelectedIndex.push(index);
      else if (isRadioStyle && maxSelectLimit && maxSelectLimit > 0) updatedSelectedIndex = [...updatedSelectedIndex.slice(1), index];
      else if (maxSelectLimit === 1) updatedSelectedIndex = [index];
      onSelectionProps?.(updatedSelectedIndex);
      return updatedSelectedIndex;
    });
  };
  const isSelected = (index: number) => selectedIndex.includes(index);
  return (
    <View style={styles.mainContainer}>
      {data && data.length > 0 ? (
        data.map((res, index) => (
          <TouchableOpacity key={index} onPress={() => onSelection(res, index)} style={[styles.container, { backgroundColor: Theme.secondaryBg }]}>
            <View
              style={[
                styles.radioCircle,
                shape,
                isSelected(index) ? styles.selectedRb : styles.unselectedRb,
                { borderColor: Theme.primary, width: props.height * 0.4, height: props.height * 0.4 },
              ]}
            >
              {isSelected(index) && <Check size={props.height * 0.3} strokeWidth={2} fill={Theme.onPrimary} />}
            </View>
            <ThemedTxt text={res.name} capitalize fontSize={12} bold color={isSelected(index) ? MainColor : undefined} />
          </TouchableOpacity>
        ))
      ) : (
        <ThemedTxt text="Nothing to Vote for" />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  container: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    marginRight: 16,
  },
  radioCircle: {
    aspectRatio: 1,
    marginRight: 5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioShape: {
    borderRadius: 100,
  },
  checkboxShape: {
    borderRadius: Normalize(4),
  },
  selectedRb: {
    backgroundColor: MainColor,
    borderWidth: 0,
  },
  unselectedRb: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 5,
  },
});
