import { Normalize, Window } from '@/constants/Helper';
import { isNumeric, isUndefined } from '@/constants/Static';
import { ScorePassword } from '@/constants/Validation';
import { useDefaultContext } from '@/hooks';
import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleProp, TextInput, TextInputProps, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { Eye, ThemeIconProps } from '../Icons';
import { ThemedBtnTxt, ThemedBtnTxtProps } from '../ThemedBtn';
export type TextInputIconProps = TextInputProps & {
  ref?: React.Ref<TextInput>;
  mainContainerStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: SvgProps;
  inputStyle?: StyleProp<TextStyle>;
  Icon?: React.FC<ThemeIconProps>;
  filled?: boolean;
  error?: boolean;
  passwordProps?: { show: boolean };
  validate?: (text?: string) => boolean;
  fix?: (text: string) => string;
  height?: number;
  initValue?: string;
  isTextarea?: boolean;
  isNumber?: boolean;
  inc?: number;
  min?: number;
  max?: number;
  triggerValidation?: boolean;
};
type SpeedAdjustButtonProps = Omit<ThemedBtnTxtProps, 'onAdjust'> & {
  onAdjust: (direction: 1 | -1) => void;
  direction: 1 | -1;
  onDone: () => void;
};
const SpeedAdjustButton: React.FC<SpeedAdjustButtonProps> = props => {
  const { onAdjust, onDone, direction, ...prps } = props;
  const pressTimer = useRef<NodeJS.Timeout | number | null>(null);
  const clearTimer = useCallback(() => {
    if (pressTimer.current) clearInterval(pressTimer.current);
  }, []);
  const handlePressIn = useCallback(() => {
    onAdjust(direction);
    clearTimer();
    pressTimer.current = setInterval(() => onAdjust(direction), 200);
  }, [direction, onAdjust, clearTimer]);
  const handlePressOut = useCallback(() => {
    clearTimer();
    onDone();
  }, [clearTimer, onDone]);
  useEffect(() => () => clearTimer(), [clearTimer]);
  return <ThemedBtnTxt {...prps} onPressIn={handlePressIn} onPressOut={handlePressOut} />;
};
const ScoreColor = (score: number) => {
  if (score > 80) return '#92BD27';
  if (score > 60) return '#92BD27';
  if (score > 40) return '#f6b44d';
  if (score > 0) return '#ef4836';
  return 'ddd';
};
export const InitInputValue = (props: TextInputIconProps) => props.initValue || props.value || (props.isNumber ? (props.min?.toString() ?? '0') : undefined);
export const TextInputIcon = React.forwardRef<TextInput, TextInputIconProps>((props, ref) => {
  const r = useRef<TextInput | null>(null);
  useImperativeHandle(ref, () => r.current as TextInput);
  const { Icon, value, initValue, passwordProps, multiline, isTextarea, filled, secureTextEntry: isSecure, triggerValidation, ...styles } = props;
  const { mainContainerStyle, containerStyle, iconStyle, inputStyle, error, height: h, ...number } = styles;
  const { isNumber, keyboardType, inc = 1, min, max, ...fc } = number;
  const { onChangeText, validate, fix, ...prps } = fc;
  const isNumb = isNumber;
  const isArea = isTextarea && !isNumb;
  const Theme = useDefaultContext().ThemeContext.value;
  const [focus, setFocus] = useState(false);
  const [didFocusOnce, setDidFocusOnce] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [score, setScore] = useState(0);
  const [text, setText] = useState<string | undefined>(InitInputValue(props));
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => onTextChange(text ?? ''), [text]);
  useEffect(() => {
    if (triggerValidation) setDidFocusOnce(true);
  }, [triggerValidation]);
  const onTextChange = useCallback(
    (val: string) => {
      let x = isNumb ? val.toNumber() : val;
      x = fix ? fix(x) : x;
      setScore(ScorePassword(x));
      onChangeText?.(x);
    },
    [fix, onChangeText, isNumb],
  );
  const decimalPlaces = (num: number) => {
    if (!isFinite(num)) return 0;
    let e = 1;
    let p = 0;
    while (Math.round(num * e) / e !== num) {
      e *= 10;
      p++;
    }
    return p;
  };
  const incNumb = useCallback(
    (dir: 1 | -1) => {
      setText(prevValue => {
        let toAdd = inc * dir;
        const currentValue = Number(prevValue);
        const scale = Math.pow(10, Math.max(decimalPlaces(currentValue), decimalPlaces(toAdd)));
        let newValue = (currentValue * scale + toAdd * scale) / scale;
        if (!isNumeric(newValue)) return undefined;
        return newValue.Between(min, max) + '';
      });
    },
    [inc, min, max],
  );
  const handleDone = useCallback(() => {
    if (text) onTextChange(text);
  }, [text]);
  const height = h ?? Math.max(Window.defH, 42);
  const iconSize = (size.w * 0.06).min(size.h * 0.8);
  const btnSize = (size.w * 0.1).min(size.h * 0.8);
  const shouldShowValidation = didFocusOnce || !!triggerValidation;
  const isValid = validate?.(text);
  const hasValidationError = shouldShowValidation && validate ? !isValid : false;
  const borderColor = hasValidationError ? Theme.error : focus ? Theme.valid : Theme.primary;
  const iconError = error || hasValidationError;
  return (
    <View style={[{ width: '100%' }, mainContainerStyle]} onLayout={e => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <View
        style={[
          {
            display: 'flex',
            flexDirection: 'row',
            borderWidth: 2,
            borderRadius: 8,
            borderColor,
            borderStyle: 'solid',
            alignItems: 'center',
            paddingHorizontal: 8,
            width: '100%',
          },
          containerStyle,
        ]}
      >
        {Icon && (
          <Icon
            {...iconStyle}
            filled={isUndefined(filled) ? focus : filled}
            error={iconError}
            style={[{ marginRight: 8, width: iconSize, height: iconSize }]}
          />
        )}
        {isNumb && !isSecure && (
          <SpeedAdjustButton
            text="-"
            fontSize={btnSize / 1.2}
            fixHeight
            variant="Warning"
            buttonStyle={{ width: btnSize, height: btnSize }}
            direction={-1}
            onAdjust={incNumb}
            onDone={handleDone}
          />
        )}
        <TextInput
          {...prps}
          ref={r}
          onChangeText={setText}
          value={isUndefined(value) || !onChangeText ? text : value}
          onFocus={e => {
            setFocus(true);
            setDidFocusOnce(true);
            props.onFocus?.(e);
          }}
          onBlur={e => {
            setFocus(false);
            props.onBlur?.(e);
          }}
          style={[
            { fontFamily: Theme.font, fontWeight: '400', fontSize: Normalize(14), color: Theme.secondaryText },
            isArea ? { minHeight: 100, textAlignVertical: 'top', width: '100%' } : { flex: 1, height },
            isNumb && { textAlign: 'center' },
            inputStyle,
          ]}
          multiline={multiline || isArea}
          keyboardType={isNumb ? 'numeric' : (keyboardType ?? 'default')}
          placeholderTextColor={Theme.secondaryText}
          secureTextEntry={isSecure && !showPassword}
        />
        {isSecure ? (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Eye style={[{ marginLeft: 8, width: iconSize, height: iconSize }]} />
          </TouchableOpacity>
        ) : (
          isNumb && (
            <SpeedAdjustButton
              text="+"
              fontSize={btnSize / 1.2}
              fixHeight
              variant="Default"
              buttonStyle={{ width: btnSize, height: btnSize }}
              direction={1}
              onAdjust={incNumb}
              onDone={handleDone}
            />
          )
        )}
      </View>
      {passwordProps?.show ? (
        <Animated.View style={{ backgroundColor: ScoreColor(score), width: `${Math.min(score, 100)}%`, height: 5, borderRadius: 50, marginVertical: 3 }} />
      ) : null}
    </View>
  );
});
