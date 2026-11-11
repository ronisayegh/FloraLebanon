import { Window } from '@/constants/Helper';
import { ThemeType } from '@/constants/Themes';
import { useDefaultContext } from '@/hooks';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import RNPickerSelect, { PickerSelectProps } from 'react-native-picker-select';
export interface SelectorProps extends PickerSelectProps {
  required?: boolean;
  border?: boolean;
}
export const Selector: React.FC<SelectorProps> = props => {
  const { required, style, onValueChange, items, value, placeholder, border = true, ...prps } = props;
  const getIndex = useCallback((idx: number) => (idx.checkIndex(items) || !required ? idx : 0), [items, required]);
  const findIndex = useCallback((value: any) => items.findIndex(item => item.value === value), [items]);
  const [selectedIdx, setSelectedIdx] = useState(getIndex(findIndex(value)));
  const { inputAndroid, inputIOS } = style || {};
  const { ThemeContext } = useDefaultContext();
  const Styles = styles(ThemeContext.value);
  const borderColor = selectedIdx >= 0 ? ThemeContext.value.primary : required ? ThemeContext.value.error : ThemeContext.value.disabledbg;
  useEffect(() => {
    setSelectedIdx(getIndex(findIndex(value)));
  }, [findIndex, getIndex, value]);
  const handleValueChanged = useCallback(
    (value: any) => {
      let idx = getIndex(items.findIndex(item => item.value === value));
      setSelectedIdx(idx);
      onValueChange?.(items[idx]?.value, idx);
    },
    [getIndex, items, onValueChange],
  );
  return (
    <RNPickerSelect
      placeholder={required ? {} : placeholder}
      items={items}
      value={value}
      useNativeAndroidPickerStyle={false}
      style={{
        inputAndroid: [Styles.Selector, { borderColor }, !border && { borderWidth: 0 }, inputAndroid],
        inputIOS: [Styles.Selector, { borderColor }, !border && { borderWidth: 0 }, inputIOS],
        modalViewMiddle: { backgroundColor: ThemeContext.value.primaryBg, borderTopColor: ThemeContext.value.disabledbg },
        modalViewBottom: { backgroundColor: ThemeContext.value.primaryBg },
        done: { color: ThemeContext.value.primary },
        chevron: { borderColor: ThemeContext.value.primary },
        chevronActive: { borderColor: ThemeContext.value.primary },
        placeholder: { color: ThemeContext.value.placeholderText },
        inputIOSContainer: { zIndex: 100 },
        viewContainer: { zIndex: 100 },
      }}
      darkTheme={ThemeContext.value.isDark}
      pickerProps={{
        itemStyle: {
          color: ThemeContext.value.secondaryText,
          backgroundColor: ThemeContext.value.primaryBg,
        },
      }}
      onValueChange={handleValueChanged}
      {...prps}
    />
  );
};
const styles = (Theme: ThemeType) =>
  StyleSheet.create({
    Selector: {
      color: Theme.secondaryText,
      backgroundColor: Theme.primaryBg,
      paddingHorizontal: 12,
      paddingVertical: 16,
      height: Window.defH,
      borderWidth: 2,
      borderRadius: 10,
      borderStyle: 'solid',
    },
  });
