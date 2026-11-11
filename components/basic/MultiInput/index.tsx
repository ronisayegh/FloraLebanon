import { useDefaultContext } from '@/hooks';
import { GlobalStyle } from '@/styles';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Plus, XCircle } from '../Icons';
import { TextInputIcon, TextInputIconProps } from '../TextInputIcon';
export type MultiInputProps = Omit<Omit<TextInputIconProps, 'onChangeText'>, 'value'> & {
  minInputs?: number;
  values?: string[];
  onValuesChange?: (values: string[]) => void;
};
export const MultiInput: React.FC<MultiInputProps> = props => {
  const { minInputs = 1, values = [], onValuesChange, containerStyle, ...prps } = props;
  const theme = useDefaultContext().ThemeContext.value;
  const [inputValues, setInputValues] = useState<string[]>([]);
  useEffect(() => {
    const initialInputs = [...values, ...Array(Math.max(minInputs - values.length, 0)).fill('')];
    setInputValues(initialInputs);
  }, [values, minInputs]);
  const addInput = () => setInputValues([...inputValues, '']);
  const removeInput = (index: number) => {
    const newInputValues = [...inputValues];
    newInputValues.splice(index, 1);
    setInputValues(newInputValues);
    onValuesChange?.(newInputValues);
  };
  const updateInputValue = (index: number, value: string) => {
    const newInputValues = [...inputValues];
    newInputValues[index] = value;
    setInputValues(newInputValues);
    onValuesChange?.(newInputValues);
  };
  return (
    <View style={[GlobalStyle.bMar20, containerStyle]}>
      {/* <Scroll> */}
      {inputValues.map((input, index) => (
        <View key={index} style={styles.inputContainer}>
          <View style={[GlobalStyle.flex, GlobalStyle.rMar10]}>
            <TextInputIcon value={input} onChangeText={txt => updateInputValue(index, txt)} {...prps} />
          </View>
          {inputValues.length > minInputs && index >= minInputs ? (
            <TouchableOpacity onPress={() => removeInput(index)} style={[styles.btn, { backgroundColor: theme.error }]}>
              <XCircle size={30} fill={'white'} />
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
      <TouchableOpacity onPress={addInput} style={[styles.btn, styles.addBtn, { backgroundColor: theme.primary }]}>
        <Plus size={40} fill={'white'} />
      </TouchableOpacity>
      {/* </Scroll> */}
    </View>
  );
};
const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  btn: {
    alignSelf: 'center',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    width: 50,
    height: 50,
  },
});
