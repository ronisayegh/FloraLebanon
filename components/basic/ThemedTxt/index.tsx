import { Normalize } from '@/constants/Helper';
import { isUndefined } from '@/constants/Static';
import { useDefaultContext } from '@/hooks/DefaultContext';
import { GlobalStyle } from '@/styles';
import React, { Fragment } from 'react';
import { Linking, StyleProp, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
export type VariantType = 'Default' | 'Primary' | 'Secondary' | 'Tertiary';

export interface URLTxt {
  textBefore?: string;
  textAfter?: string;
  url: string;
  urlText: string;
}
export class TxtChild {
  child: React.ReactNode;
  constructor(child: React.ReactNode) {
    this.child = child;
  }
}
export interface ThemedTxtProps extends TextProps {
  text?: string | URLTxt | TxtChild;
  bold?: boolean;
  center?: boolean;
  right?: boolean;
  italic?: boolean;
  uppercase?: boolean;
  capitalize?: boolean;
  nowwarp?: boolean;
  preventWordBreak?: boolean;
  color?: string;
  fontSize?: number;
  rem?: number;
  fixLineHeight?: boolean;
  fixHeight?: boolean;
  variant?: VariantType;
  fontWeight?: 'normal' | '700' | '400' | 'bold' | '100' | '200' | '300' | '500' | '600' | '800' | '900';
}
export interface LabelTextProps {
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
  label: string;
  text: string;
  capitalize?: boolean;
  labelBold?: boolean;
  textBold?: boolean;
}
const getFontFamily = (bold?: boolean, italic?: boolean, fontWeight?: string) => {
  if (bold || fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900')
    return italic ? 'MontserratBoldItalic' : 'MontserratBold';
  if (fontWeight === '600' || fontWeight === 'semi-bold') return italic ? 'MontserratSemiBoldItalic' : 'MontserratSemiBold';
  if (fontWeight === '500' || fontWeight === 'medium') return italic ? 'MontserratMediumItalic' : 'MontserratMedium';
  if (fontWeight === '300' || fontWeight === 'light') return italic ? 'MontserratLightItalic' : 'MontserratLight';
  if (fontWeight === '200' || fontWeight === 'extra-light') return italic ? 'MontserratExtraLightItalic' : 'MontserratExtraLight';
  if (fontWeight === '100' || fontWeight === 'thin') return italic ? 'MontserratThinItalic' : 'MontserratThin';
  if (fontWeight === '900' || fontWeight === 'black') return italic ? 'MontserratBlackItalic' : 'MontserratBlack';
  return italic ? 'MontserratItalic' : 'Montserrat';
};

export const ThemedTxt: React.FC<ThemedTxtProps> = props => {
  const Theme = useDefaultContext().ThemeContext.value;
  const { text, children, color, fontSize, fontWeight, rem, style, variant, ...o1 } = props;
  const { bold, center, right, uppercase, capitalize, italic, nowwarp, preventWordBreak, ...o2 } = o1;
  const { fixLineHeight, fixHeight, ...textProps } = o2;
  const isURLText = (text: URLTxt): text is URLTxt => text && typeof text === 'object' && 'url' in text;
  const fSize = Normalize(rem ? rem * 16 : (fontSize ?? 12));
  const txtColor =
    color ||
    {
      Default: Theme.primaryText,
      Primary: Theme.primaryText,
      Secondary: Theme.secondaryText,
      Tertiary: Theme.tertiaryText,
    }[variant || 'Default'] ||
    Theme.primaryText;

  return (
    <Text
      {...textProps}
      numberOfLines={nowwarp ? 1 : props.numberOfLines}
      adjustsFontSizeToFit={preventWordBreak ? true : props.adjustsFontSizeToFit}
      minimumFontScale={preventWordBreak ? (props.minimumFontScale ?? 0.72) : props.minimumFontScale}
      textBreakStrategy={preventWordBreak ? 'simple' : props.textBreakStrategy}
      android_hyphenationFrequency={preventWordBreak ? 'none' : props.android_hyphenationFrequency}
      style={[
        {
          fontFamily: getFontFamily(bold, italic, fontWeight),
          fontWeight: fontWeight || bold ? '900' : '400',
          textAlign: center ? 'center' : right ? 'right' : 'left',
          textTransform: uppercase ? 'uppercase' : capitalize ? 'capitalize' : 'none',
          color: txtColor,
          fontSize: fSize,
          lineHeight: fixLineHeight || fixHeight ? fSize : undefined,
          height: fixHeight ? fSize - fSize * 0.15 : undefined,
        },
        style,
      ]}
    >
      {isUndefined(text) || text instanceof TxtChild ? (
        (text?.child ?? children)
      ) : typeof text === 'string' ? (
        text
      ) : isURLText(text) ? (
        <Fragment>
          {text.textBefore}
          <Text
            style={[
              {
                fontFamily: 'MontserratBold',
                fontWeight: '900',
                color: Theme.primary,
                fontSize: fSize,
                lineHeight: fixHeight ? fSize : undefined,
                flexWrap: 'nowrap',
              },
            ]}
            onPress={() => Linking.openURL(text.url)}
          >
            {text.urlText}
          </Text>
          {text.textAfter}
        </Fragment>
      ) : (
        <></>
      )}
    </Text>
  );
};
export const LabelTxt: React.FC<LabelTextProps> = props => {
  const { containerStyle, label, text, labelStyle, textStyle, capitalize, labelBold = true, textBold = false } = props;
  return (
    <View style={[GlobalStyle.row, GlobalStyle.maxRow, GlobalStyle.bMar8, containerStyle]}>
      <ThemedTxt text={label} bold={labelBold} fontSize={14} style={[GlobalStyle.rMar5, labelStyle]} capitalize={capitalize} />
      <ThemedTxt text={text} bold={textBold} fontSize={14} style={[GlobalStyle.wrap, textStyle]} />
    </View>
  );
};
