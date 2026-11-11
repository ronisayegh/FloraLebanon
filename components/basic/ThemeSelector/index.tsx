import { ThemeKeys } from '@/constants/Themes';
import { useDefaultContext } from '@/hooks';
import { GlobalStyle } from '@/styles';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { SwitchToggle } from '../SwitchToggle';
import { ThemedTxt } from '../ThemedTxt';

type ThemeSelectorProps = {};
export const ThemeSelector: React.FC<ThemeSelectorProps> = props => {
  const [theme, setTheme] = useState<ThemeKeys>('auto');
  const ThemeContext = useDefaultContext().ThemeContext;
  const handleThemeChange = useCallback((value: boolean, source: ThemeKeys) => {
    let result = value ? source : 'auto';
    setTheme(result);
    ThemeContext.Set(result);
  }, []);
  return (
    <View style={GlobalStyle.tMar12}>
      <ThemedTxt text="Theme" fontWeight="600" fontSize={14} variant="Secondary" />
      <View style={[GlobalStyle.row, GlobalStyle.tMar8]}>
        <SwitchToggle
          label="Auto"
          value={theme === 'auto'}
          onValueChange={v => handleThemeChange(v, 'auto')}
          switchProps={{ disabled: theme === 'auto' }}
          style={GlobalStyle.flex}
        />
        <SwitchToggle label="Light" value={theme === 'light'} onValueChange={v => handleThemeChange(v, 'light')} style={GlobalStyle.flex} />
        <SwitchToggle label="Dark" value={theme === 'dark'} onValueChange={v => handleThemeChange(v, 'dark')} style={GlobalStyle.flex} />
      </View>
    </View>
  );
};
