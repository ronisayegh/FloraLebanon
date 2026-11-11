import {
  Card,
  DatetimePicker,
  MultiInput,
  RadioButtonList,
  SearchableSelectorWithIcons,
  Selector,
  SwitchToggle,
  TextInputIcon,
  ThemedTxt,
} from '@/components/basic';
import { GlobalStyle } from '@/styles';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

const pickerItems = [
  { label: 'Alpha', value: 'Alpha' },
  { label: 'Beta', value: 'Beta' },
  { label: 'Gamma', value: 'Gamma' },
  { label: 'Delta', value: 'Delta' },
  { label: 'Epsilon', value: 'Epsilon' },
  { label: 'Zeta', value: 'Zeta' },
  { label: 'Eta', value: 'Eta' },
  { label: 'Theta', value: 'Theta' },
  { label: 'Iota', value: 'Iota' },
  { label: 'Kappa', value: 'Kappa' },
  { label: 'Lambda', value: 'Lambda' },
  { label: 'Mu', value: 'Mu' },
  { label: 'Nu', value: 'Nu' },
  { label: 'Xi', value: 'Xi' },
  { label: 'Omicron', value: 'Omicron' },
  { label: 'Pi', value: 'Pi' },
  { label: 'Rho', value: 'Rho' },
  { label: 'Sigma', value: 'Sigma' },
  { label: 'Tau', value: 'Tau' },
  { label: 'Upsilon', value: 'Upsilon' },
  { label: 'Phi', value: 'Phi' },
  { label: 'Chi', value: 'Chi' },
  { label: 'Psi', value: 'Psi' },
  { label: 'Omega', value: 'Omega' },
];

const ShowcaseDemoCard = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <Card title={title} showBorder style={styles.demoCard}>
    <ThemedTxt text={description} variant="Secondary" style={styles.demoDescription} />
    {children}
  </Card>
);

export default function InputsDemo() {
  const [textValue, setTextValue] = useState('Core input');
  const [passwordValue, setPasswordValue] = useState('password123');
  const [multiValues, setMultiValues] = useState(['Alpha', 'Beta']);
  const [selectedValue, setSelectedValue] = useState<string | null>('beta');
  const [selectedSearchItems, setSelectedSearchItems] = useState<string[]>([]);
  const [radioValues, setRadioValues] = useState<number[]>([1]);
  const [checkValues, setCheckValues] = useState<number[]>([1]);
  const [switchValue, setSwitchValue] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <View>
      <ShowcaseDemoCard title="TextInputIcon" description="Standard, secure, numeric, and textarea input states.">
        <TextInputIcon value={textValue} onChangeText={setTextValue} placeholder="Regular input" />
        <TextInputIcon
          value={passwordValue}
          onChangeText={setPasswordValue}
          placeholder="Password"
          secureTextEntry
          passwordProps={{ show: true }}
          mainContainerStyle={GlobalStyle.tMar12}
        />
        <TextInputIcon initValue="3" isNumber inc={0.5} min={0} max={10} placeholder="Numeric input" mainContainerStyle={GlobalStyle.tMar12} />
        <TextInputIcon initValue="Textarea content" isTextarea placeholder="Textarea" mainContainerStyle={GlobalStyle.tMar12} />
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="MultiInput" description="Dynamic repeated input rows with add and remove controls.">
        <MultiInput values={multiValues} onValuesChange={setMultiValues} placeholder="Add tag" />
        <ThemedTxt text={`Values: ${multiValues.join(', ') || 'None'}`} variant="Secondary" />
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="Selector" description="Picker-backed single select using the core styled selector.">
        <Selector
          items={pickerItems}
          value={selectedValue}
          onValueChange={value => setSelectedValue(value ?? null)}
          placeholder={{ label: 'Select an item', value: null }}
        />
        <ThemedTxt text={`Selected: ${selectedValue ?? 'None'}`} variant="Secondary" style={GlobalStyle.tMar8} />
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="SearchableSelectorWithIcons" description="Search field with tappable result list and selected item chips.">
        <SearchableSelectorWithIcons items={pickerItems} onItemsChange={items => setSelectedSearchItems(items.map(item => item.label))} />
        <ThemedTxt text={`Selected: ${selectedSearchItems.join(', ') || 'None'}`} variant="Secondary" style={GlobalStyle.tMar8} />
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="RadioButtonList" description="Multi-select chip-style radio list with checked state rendering.">
        <RadioButtonList
          data={[{ name: 'Design' }, { name: 'Build' }, { name: 'Review' }]}
          selectedValues={radioValues}
          onSelection={setRadioValues}
          height={36}
          maxSelectLimit={1}
          minSelectLimit={1}
          radio
        />
        <ThemedTxt text={`Selected indexes: ${radioValues.join(', ') || 'None'}`} variant="Secondary" style={GlobalStyle.bMar16} />

        <RadioButtonList
          data={[{ name: 'Design' }, { name: 'Build' }, { name: 'Review' }]}
          selectedValues={checkValues}
          onSelection={setCheckValues}
          height={36}
          radio={false}
        />
        <ThemedTxt text={`Selected indexes: ${checkValues.join(', ') || 'None'}`} variant="Secondary" />
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="SwitchToggle" description="Labeled toggle built on the platform switch component.">
        <SwitchToggle label="Enable showcase mode" value={switchValue} onValueChange={setSwitchValue} />
        <ThemedTxt text={`Current value: ${switchValue ? 'On' : 'Off'}`} variant="Secondary" style={GlobalStyle.tMar8} />
      </ShowcaseDemoCard>

      <ShowcaseDemoCard title="DatetimePicker" description="Date and time selectors with local state feedback.">
        <DatetimePicker value={selectedDate} onDateChange={setSelectedDate} />
        <ThemedTxt text={`Selected: ${selectedDate.toLocaleString()}`} variant="Secondary" style={GlobalStyle.tMar8} />
      </ShowcaseDemoCard>
    </View>
  );
}

const styles = StyleSheet.create({
  demoCard: {
    marginBottom: 12,
  },
  demoDescription: {
    marginBottom: 12,
  },
});
