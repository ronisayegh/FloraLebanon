import '../../@Types';
import { isArray, isDate, isNullOrUndefined, isNumeric, isObject, isString, isUndefined } from './Static';
export const joinObjectKeyList = (obj: { [key: string]: any }) => {
  if (typeof obj !== 'object' || obj instanceof Array) return [];
  let result: Array<string> = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object') {
        let result1: Array<string> = joinObjectKeyList(obj[key]);
        for (var i = 0; i < result1.length; i++) {
          result.push(key + '.' + result1[i]);
        }
      } else {
        result.push(key);
      }
    }
  }
  return result;
};
export const objectContainValue = (obj: { [key: string]: any }, value: string | number, ignoreFields: Array<string> = [], parentKey = '') => {
  let currentLocation;
  for (var key in obj) {
    currentLocation = parentKey + (parentKey === '' ? '' : '.') + key;
    if (!ignoreFields.includes(currentLocation) && obj.hasOwnProperty(key)) {
      let keyValue = obj[key];
      if (typeof keyValue === 'string' && typeof value === 'string' && keyValue.toLowerCase().includes(value.toLowerCase())) {
        return true;
      } else if (typeof keyValue === 'number' && typeof value === 'number' && keyValue.toString().includes(value.toString())) {
        return true;
      } else if (keyValue instanceof Array) {
        for (var i = 0; i < keyValue.length; i++) {
          if (objectContainValue(keyValue[i], value, ignoreFields, currentLocation)) return true;
        }
      } else if (typeof keyValue === 'object' && objectContainValue(keyValue, value, ignoreFields, currentLocation)) {
        return true;
      }
    }
  }
  return false;
};
export const checkProperty = (object: any, ...keys: string[]): any => {
  if (isUndefined(object)) return undefined;
  if (isUndefined(keys) || !keys.length) return object;
  if (!isObject(object)) return object;
  let key = keys[0];
  let o: any = object;
  o = o[key];
  if (keys.length === 1) return o;
  if (isUndefined(o) || !isObject(o)) return undefined;
  return checkProperty(o, ...keys.slice(1));
};
export const checkElement = (object: any, index: number, ...keys: string[]): any => {
  if (isUndefined(object)) return undefined;
  if (isUndefined(keys) || !keys.length) return object;
  if (isArray(object)) return object.length > index ? object[index] : undefined;
  let o = checkProperty(object, ...keys);
  if (isArray(o)) return o.length > index ? o[index] : undefined;
};
export const colorNameToHex = (colorName: string): string => {
  const TinyColor = require('tinycolor2');
  const color = TinyColor(colorName);
  if (color.isValid()) return color.toHexString();
  else return '#000000';
};
export const adjustColorBrightness = (color: string, factor: number): string => {
  color = colorNameToHex(color);
  const r = parseInt(color.slice(1, 3), 16).max(1);
  const g = parseInt(color.slice(3, 5), 16).max(1);
  const b = parseInt(color.slice(5, 7), 16).max(1);
  const adjustedR = Math.min(255, Math.max(0, Math.round(r * factor)));
  const adjustedG = Math.min(255, Math.max(0, Math.round(g * factor)));
  const adjustedB = Math.min(255, Math.max(0, Math.round(b * factor)));
  const adjustedRHex = adjustedR.toString(16).padStart(2, '0');
  const adjustedGHex = adjustedG.toString(16).padStart(2, '0');
  const adjustedBHex = adjustedB.toString(16).padStart(2, '0');
  return `#${adjustedRHex}${adjustedGHex}${adjustedBHex}`;
};
export const formatTimeFromTimestamp = (timestamp: number): string => formatTime(new Date(timestamp));
export const formatTimeFromStr = (str: string): string => formatTime(new Date(str));
export const areDatesInSameWeek = (date1: Date, date2: Date): boolean => {
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    return Math.ceil(((date.getTime() - firstDayOfYear.getTime()) / 86400000 + firstDayOfYear.getDay() + 1) / 7);
  };
  return getWeekNumber(date1) === getWeekNumber(date2) && date1.getFullYear() === date2.getFullYear();
};
export const formatStrTime = (date: string | Date): string => {
  try {
    return formatTime(isString(date) ? new Date(date) : date);
  } catch (e) {
    return '';
  }
};
export const formatTime = (date: Date): string => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    if (date.toDateString() === today.toDateString()) {
      return `${h}:${m}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${h}:${m}`;
    } else if (areDatesInSameWeek(date, now)) {
      return `${weekDay[date.getDay()].slice(0, 3)}, ${h}:${m}`;
    } else if (now.getFullYear() === date.getFullYear()) {
      return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}, ${h}:${m}`;
    } else {
      return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}, ${date.getFullYear()} ${h}:${m}`;
    }
  } catch (e) {
    return '';
  }
};
export const formatDate = (date?: string | null, deft = 'syncing...') => {
  if (!date) return deft;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
export const formatShortDate = (date?: string | null, deft = 'syncing...') => {
  if (!date) return deft;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
type IsNotAny<T> = 0 extends 1 & T ? false : true;
type ExtractOrderTypes<T> = {
  [Key in keyof T as IsNotAny<T[Key]> extends true ? (T[Key] extends string | number | Date | undefined ? Key : never) : never]: Exclude<T[Key], undefined>;
};
type ExtractOrderArrayTypes<T> = {
  [Key in keyof T as IsNotAny<T[Key]> extends true ? (T[Key] extends Array<string | number | Date> | undefined ? Key : never) : never]: Exclude<
    T[Key],
    undefined
  >;
};
type FieldOrderOptionsBase = { order?: 'ASC' | 'DESC' };
type ExtractOrderSingleTypesKeys<T> = keyof ExtractOrderTypes<T>;
type ExtractOrderArrayTypesKeys<T> = keyof ExtractOrderArrayTypes<T>;
//
type FieldOrderSingleOptions<T> = FieldOrderOptionsBase & { field: ExtractOrderSingleTypesKeys<T> };
type FieldOrderArrayOptions<T> = FieldOrderOptionsBase & { field: ExtractOrderArrayTypesKeys<T>; index: number };
//
type FieldOrderSingleTypes<T> = ExtractOrderSingleTypesKeys<T> | FieldOrderSingleOptions<T>;
type FieldOrderArrayTypes<T> = FieldOrderArrayOptions<T>;
type SingleOrArrayOptions<T> = FieldOrderSingleOptions<T> | FieldOrderArrayOptions<T>;
type SingleOrArrayFieldOrder<T> = FieldOrderSingleTypes<T> | FieldOrderArrayTypes<T>;
//
type SingleFieldOrder<T> = ExtractOrderSingleTypesKeys<T> | FieldOrderSingleOptions<T> | FieldOrderArrayOptions<T>;
export type FieldOrder<T> = SingleFieldOrder<T> | SingleFieldOrder<T>[];
export const CompareByField = <T extends Record<string, any>>(field: FieldOrder<T>) => {
  function toFieldOrderOptions(f: SingleOrArrayFieldOrder<T>) {
    if (isObject(f)) return f;
    return { field: f, order: 'ASC' } as FieldOrderSingleOptions<T>;
  }
  return (o1: T, o2: T): number => {
    if (isArray(field)) {
      for (let i = 0; i < field.length; i++) {
        const result = CompareByOneField(toFieldOrderOptions(field[i]))(o1, o2);
        if (result !== 0) return result;
      }
      return 0;
    }
    return CompareByOneField(toFieldOrderOptions(field))(o1, o2);
  };
};
const CompareByOneField = <T extends Record<string, any>>(options: SingleOrArrayOptions<T>) => {
  return (o1: T, o2: T): number => {
    const { field, order = 'ASC' } = options;
    const index: number | undefined = (options as any).index;
    const isDesc = order === 'DESC';
    if (isNullOrUndefined(o1[field]) || isNullOrUndefined(o2[field])) return 0;
    let a = o1[field];
    let b = o2[field];
    if (isNumeric(index)) {
      if (!isArray(a) || !isArray(b) || !index.checkIndex(a) || !index.checkIndex(b)) return 0;
      a = a[index];
      b = b[index];
    }
    if (typeof a !== typeof b) return 0;
    if (isNumeric(a)) return a.compareNumb(b, isDesc);
    if (isString(a)) return a.compareStr(b, isDesc);
    if (isDate(a)) return a.compareDate(b, isDesc);
    return 0;
  };
};
