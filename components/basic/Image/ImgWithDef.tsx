import { MainColor } from '@/constants/Config';
import { isStringNotEmpty, isUndefined } from '@/constants/Static';
import React, { useState } from 'react';
import { ImageLoadEvent, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';
import { NoImage, ThemeIconProps, ThemeIconType, UserCirlce } from '../Icons';
import { ThemedTxt } from '../ThemedTxt';
import { ImgError, SimpleCachedImg, SimpleCachedImgProps } from './SimpleCachedImg';
export type ImageWithDefaultProps = SimpleCachedImgProps & {
  Icon?: React.FC<ThemeIconProps>;
  userName?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  iconProps?: ThemeIconType;
  justBg?: boolean;
  respectRatio?: boolean;
};
export const ImgWithDef: React.FC<ImageWithDefaultProps> = props => {
  const { Icon, userName, style, imageStyle, iconProps, justBg, onError, onLoad, respectRatio, ...prps } = props;
  const [aspectRatio, setAspectRatio] = useState<number>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<ImgError>();
  const getInitials = (name?: string) => {
    if (typeof name !== 'string') return '';
    let initials;
    name = name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s\s+/g, ' ');
    const nameSplit = name.split(' ');
    const nameLength = nameSplit.length;
    if (nameLength > 1) {
      initials = nameSplit[0].substring(0, 1) + nameSplit[nameLength - 1].substring(0, 1);
    } else if (nameLength === 1) {
      initials = nameSplit[0].substring(0, 2);
    } else return 'U';
    return initials.toUpperCase();
  };
  const renderIcon = (Icon: React.FC<ThemeIconProps>) => <Icon fill="#fff" style={[{ width: '60%', flex: 1 }, iconProps?.style]} />;
  const renderInitials = (initials: string) => <ThemedTxt text={initials} fontSize={16} bold uppercase color="#fff" />;
  const renderErrors = () => (isUndefined(userName) || !isStringNotEmpty(userName) ? renderIcon(Icon || NoImage) : renderInitials(getInitials(userName)));
  const handleOnLoad = (event: ImageLoadEvent) => {
    const { width, height } = event.nativeEvent.source;
    const imageAspectRatio = width / height;
    setAspectRatio(respectRatio ? imageAspectRatio : undefined);
    setIsLoaded(true);
    onLoad?.(event);
  };
  const backgroundColor = !isLoaded || error ? MainColor : undefined;
  return (
    <View style={[{ justifyContent: 'center', alignItems: 'center', aspectRatio, backgroundColor }, style]}>
      <SimpleCachedImg
        onError={e => {
          setError(e);
          onError?.(e);
        }}
        onLoad={handleOnLoad}
        style={[{ width: '100%', height: '100%', objectFit: 'cover', display: 'flex' }, imageStyle]}
        TempNode={!justBg && renderErrors()}
        {...prps}
      />
    </View>
  );
};
export const UserIcon: React.FC<ImageWithDefaultProps> = props => <CircleImage Icon={UserCirlce} {...props} />;
export const CircleImage: React.FC<ImageWithDefaultProps> = props => {
  return (
    <ImgWithDef
      {...props}
      iconProps={props.iconProps}
      imageStyle={[{ borderRadius: 999 }, props.imageStyle]}
      style={[{ width: '100%', height: '100%', borderRadius: 999 }, props.style]}
    />
  );
};
