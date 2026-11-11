import { IS_ANDROID, IS_IOS } from '@/constants/Config';
import { Window } from '@/constants/Helper';
import { useDefaultContext } from '@/hooks';
import { GlobalStyle } from '@/styles';
import DateTimePicker, { AndroidNativeProps, DateTimePickerEvent, IOSNativeProps } from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { ThemedTxt } from '../ThemedTxt';
type AllDatetimePicker = IOSNativeProps | AndroidNativeProps;
export interface RNDatetimePicker extends Omit<Omit<Omit<Omit<Omit<Partial<AllDatetimePicker>, 'display'>, 'OnChange'>, 'value'>, 'mode'>, 'is24Hour'> {}
export interface DatetimePickerProps extends RNDatetimePicker {
  value?: Date;
  height?: number;
  onDateChange?: (date: Date) => void;
  is24Hour?: boolean;
  maxDate?: Date;
  minDate?: Date;
}
export const DatetimePicker: React.FC<DatetimePickerProps> = props => {
  const { value, onDateChange, height: h, ...prps } = props;
  const { is24Hour = true, minDate, maxDate, ...pickerPrps } = prps;
  const theme = useDefaultContext().ThemeContext.value;
  const [date, setDate] = useState<Date>(value || new Date());
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [show, setShow] = useState<boolean>(false);
  const [dateLbl, setDateLbl] = useState<string>('');
  const [timeLbl, setTimeLbl] = useState<string>('');
  const height = h || Window.defH * 0.8;
  useEffect(() => {
    if (value) setDate(value);
  }, [value]);
  useEffect(() => {
    setDateLbl(date.toLocaleString('en-US', { day: '2-digit', month: 'long', year: 'numeric' }));
    setTimeLbl(date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: !is24Hour }));
  }, [date, is24Hour]);
  const onChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (IS_ANDROID) setShow(false);
      selectedDate = selectedDate || date;
      let min = minDate?.clearSec();
      let max = maxDate?.clearSec();
      let adjustedDate = selectedDate;
      if (min && selectedDate.toDateString() === min.toDateString()) {
        const minDateTime = new Date(min);
        minDateTime.setHours(min.getHours(), min.getMinutes());
        if (selectedDate < minDateTime) adjustedDate = minDateTime;
      }
      if (max && selectedDate.toDateString() === max.toDateString()) {
        const maxDateTime = new Date(max);
        maxDateTime.setHours(max.getHours(), max.getMinutes());
        if (selectedDate > maxDateTime) adjustedDate = maxDateTime;
      }
      setDate(adjustedDate);
      onDateChange?.(adjustedDate);
    },
    [minDate, maxDate],
  );
  const showMode = (currentMode: 'date' | 'time') => {
    if (currentMode === mode && show) return setShow(false);
    setShow(true);
    setMode(currentMode);
  };
  const showDatepicker = () => showMode('date');
  const showTimepicker = () => showMode('time');
  return (
    <View>
      <View style={GlobalStyle.row}>
        <TouchableOpacity
          onPress={showDatepicker}
          style={{
            backgroundColor: theme.secondaryBg,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: theme.primary,
            paddingHorizontal: 12,
            minHeight: height,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <ThemedTxt text={dateLbl} style={GlobalStyle.rMar5} fontSize={14} bold />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={showTimepicker}
          style={{
            backgroundColor: theme.secondaryBg,
            borderRadius: 10,
            borderWidth: 1.5,
            borderColor: theme.primary,
            paddingHorizontal: 12,
            minHeight: height,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ThemedTxt text={timeLbl} fontSize={14} bold />
        </TouchableOpacity>
      </View>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          display={IS_IOS ? 'spinner' : 'default'}
          onChange={onChange}
          mode={mode}
          is24Hour={is24Hour}
          maximumDate={maxDate}
          minimumDate={minDate}
          {...pickerPrps}
        />
      )}
    </View>
  );
};
