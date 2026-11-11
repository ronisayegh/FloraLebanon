import { Size } from '@/@Types';
import { Window } from '@/constants/Helper';
import { useDefaultContext } from '@/hooks';
import { GlobalStyle } from '@/styles';
import React, { useCallback, useState } from 'react';
import { FlatList, LayoutChangeEvent, TouchableOpacity, View } from 'react-native';
import { MagnifyingGlass } from '../Icons';
import { ImageWithDefaultProps, ImgWithDef } from '../Image';
import { Scroll } from '../Scroll';
import { TextInputIcon, TextInputIconProps } from '../TextInputIcon';
import { ThemedTxt } from '../ThemedTxt';

export interface ItemWithIcons {
  label: string;
  value: any;
  icon?: React.FC<ImageWithDefaultProps>;
  iProps?: Partial<ImageWithDefaultProps>;
}
export interface SearchableSelectorWithIconsProps {
  items: ItemWithIcons[];
  iconProps?: Partial<ImageWithDefaultProps>;
  onItemsChange?: (selectedItems: ItemWithIcons[]) => void;
  inputProps?: Partial<TextInputIconProps>;
  reverse?: boolean;
}
export const SearchableSelectorWithIcons: React.FC<SearchableSelectorWithIconsProps> = props => {
  const { items, reverse, onItemsChange, iconProps, inputProps } = props;
  const { onFocus, onBlur, onLayout, ...inputPrps } = inputProps || {};
  const { ThemeContext } = useDefaultContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<ItemWithIcons[]>([]);
  const [show, setShow] = useState(false);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  const filteredItems = items.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const handleChange = (selectedItems: ItemWithIcons[]) => {
    setSelectedItems(selectedItems);
    onItemsChange?.(selectedItems);
  };
  const handleValueChange = useCallback(
    (value: any, index: number) => {
      const selectedItem = items.find(item => item.value === value);
      if (selectedItem && !selectedItems.find(item => item.value === value)) handleChange([...selectedItems, selectedItem]);
    },
    [items, selectedItems, onItemsChange],
  );
  const removeSelectedItem = useCallback((index: number) => handleChange(selectedItems.filter((_, i) => i !== index)), [selectedItems, onItemsChange]);
  const renderSelectedItem = ({ item, index }: { item: ItemWithIcons; index: number }) => {
    const { label, icon: Icon, iProps } = item;
    return (
      <TouchableOpacity style={[GlobalStyle.row, GlobalStyle.alignCenter, GlobalStyle.rMar5]} onPress={() => removeSelectedItem(index)}>
        {Icon ? (
          <Icon style={[{ width: size.h * 0.75, height: size.h * 0.75 }]} {...iconProps} {...iProps} />
        ) : (
          <ImgWithDef userName={label} style={{ width: size.h * 0.75, height: size.h * 0.75, borderRadius: 999 }} {...iconProps} {...iProps} />
        )}
      </TouchableOpacity>
    );
  };
  const renderListItem = (item: ItemWithIcons, index: number) => {
    const { value, label, icon: Icon, iProps } = item;
    return (
      <TouchableOpacity key={index} onPress={() => handleValueChange(value, index)} style={GlobalStyle.bMar5}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {Icon && <Icon style={[{ marginRight: 8, width: size.h * 0.8, height: size.h * 0.8 }]} {...iconProps} {...iProps} />}
          <ThemedTxt text={label} />
        </View>
      </TouchableOpacity>
    );
  };
  const handleFocus = (e: any) => {
    setShow(true);
    onFocus?.(e);
  };
  const handleBlur = (e: any) => {
    setShow(false);
    onBlur?.(e);
  };
  const handleOnLayout = (e: LayoutChangeEvent) => {
    setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
    onLayout?.(e);
  };
  const renderIcons = () => {
    return (
      selectedItems.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: reverse ? 0 : 5,
            marginTop: reverse ? 5 : 0,
            height: size.h * 0.8,
          }}
        >
          <FlatList
            data={selectedItems}
            renderItem={renderSelectedItem}
            keyExtractor={item => item.label}
            horizontal={true}
            keyboardShouldPersistTaps="always"
          />
        </View>
      )
    );
  };
  const renderList = () => {
    return (
      show &&
      filteredItems.length > 0 && (
        <View
          style={{
            maxHeight: Window.h * 0.5,
            padding: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: ThemeContext.value.disabledbg,
            backgroundColor: ThemeContext.value.secondaryBg,
          }}
        >
          <Scroll flex={false} nestedScrollEnabled={true} leaveKeyboard>
            {filteredItems.map(renderListItem)}
          </Scroll>
        </View>
      )
    );
  };
  return (
    <View>
      {reverse ? renderList() : renderIcons()}
      <TextInputIcon
        Icon={MagnifyingGlass}
        onChangeText={setSearchQuery}
        placeholder="Search"
        value={searchQuery}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onLayout={handleOnLayout}
        selectTextOnFocus
        {...inputPrps}
      />
      {reverse ? renderIcons() : renderList()}
    </View>
  );
};
