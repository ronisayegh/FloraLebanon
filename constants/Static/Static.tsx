import uuid from 'react-native-uuid';
export const isArray = (value: any): value is Array<any> => !!value && value.constructor === Array;
export const isObject = (value: any): value is object => !!value && value.constructor === Object;
export const isString = (value: any): value is string => typeof value === 'string';
export const isStringNotEmpty = (value: any): value is string => typeof value === 'string' && value !== '';
export const isStringEmptyOrWhite = (text?: string) => !text || !text.trim();
export const isNumber = (value: any): value is number => typeof value === 'number';
export const isNumeric = (value: any): value is number => isNumber(value) && !isNaN(value) && isFinite(value);
export const isBoolean = (value: any): value is boolean => typeof value === 'boolean';
export const isUndefined = (value: any): value is undefined => typeof value === 'undefined';
export const isNull = (value: any): value is null => value === null;
export const isNullOrUndefined = (value: any): value is null | undefined => isUndefined(value) || isNull(value);
export const isBool = (value: string): boolean => isString(value) && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false');
export const isDate = (value: any): value is Date => value instanceof Date;
export const GetRandomUUID = () => uuid.v4().toString();
export const GetRandomName = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};
export const Capitalize = (str: string) => (isStringNotEmpty(str) ? str.charAt(0).toUpperCase() + str.slice(1) : str);
export function RemoveIndex<T>(array: T[], index: number): T[] {
  if (!isArray(array) || !isNumeric(index)) return array;
  if (index < 0 || index >= array.length) return [...array];
  return [...array.slice(0, index), ...array.slice(index + 1)];
}
export const HideStrMiddle = (str: string, n: number): string => {
  if (n < 1) return str;
  var rest = str.length - n * 2;
  if (rest < 1) return HideStrMiddle(str, n - 1);
  return str.slice(0, 4) + '*'.repeat(rest) + str.slice(rest + 4);
};
export const ShortStr = (str: string, n: number): string => {
  if (n < 3) return str;
  if (str.length <= n) return str;
  return str.slice(0, n - 3) + '...';
};
export const cleanHtmlEntities = (html: string): string => {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
};
export const cleanText = (text?: string) => (text ? text.trim() : text);
/* #region Prototype */
Number.prototype.default = function (numb?: number) {
  return isNumeric(numb) ? numb : this.valueOf();
};
Number.prototype.max = function (numb?: number) {
  const self = this.valueOf();
  return Math.max(self, self.default(numb));
};
Number.prototype.min = function (numb?: number) {
  const self = this.valueOf();
  return Math.min(self, self.default(numb));
};
Number.prototype.Between = function (min?: number, max?: number) {
  const self = this.valueOf();
  return self.default(min).max(self.min(max));
};
Number.prototype.map = function (in_min: number, in_max: number, out_min: number, out_max: number) {
  return ((this.valueOf() - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
};
Number.prototype.Random = function (max?: number) {
  return Math.floor(this.valueOf().Randomf(max));
};
Number.prototype.Randomf = function (max?: number) {
  const self = this.valueOf();
  if (!isNumeric(max)) max = self + 10;
  return Math.random() * (max - self) + self;
};
Number.prototype.toPercent = function () {
  return this.valueOf() + '%';
};
Number.prototype.AddZero = function (count?: number) {
  count = count || 2;
  const numString = self.toString();
  if (numString.length >= count) return numString;
  return '0'.repeat(count - numString.length) + numString;
};
Number.prototype.toComma = function () {
  return this.valueOf()
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
Number.prototype.isBetween = function (min: number, max: number, equal = true) {
  const self = this.valueOf();
  return equal ? self >= min && self <= max : self > min && self < max;
};
Number.prototype.toDate = function () {
  let date = new Date(this.valueOf());
  if (isNumeric(date.getTime())) return date;
  return undefined;
};
Number.prototype.checkIndex = function (array: Array<any>) {
  let self = this.valueOf();
  if (!isNumeric(self)) return false;
  if (!isArray(array) || array.length === 0) return false;
  return self.isBetween(0, array.length - 1);
};
Date.prototype.clearSec = function () {
  const self = this;
  self.setSeconds(1);
  self.setMilliseconds(1);
  return self;
};
Date.prototype.clearMin = function () {
  const self = this;
  self.setMinutes(1);
  return self;
};
Date.prototype.clearHour = function () {
  const self = this;
  self.setHours(1);
  return self;
};
Date.prototype.ClearSecAndMin = function () {
  const self = this;
  self.clearSec();
  self.clearMin();
  return self;
};
Date.prototype.setD = function (day?: number) {
  this.setDate(day || 1);
  return this;
};
Date.prototype.setM = function (month?: number) {
  this.setMonth(month || 0);
  return this;
};
Date.prototype.setY = function (year?: number) {
  this.setFullYear(year || 1970);
  return this;
};
Date.prototype.isToday = function () {
  return this.toDateString() === new Date().toDateString();
};
Date.prototype.isOlder = function (days?: number) {
  const self = new Date(this);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  self.setHours(0, 0, 0, 0);
  return today.getTime() - self.getTime() > (days || 0) * 24 * 60 * 60 * 1000;
};
String.prototype.toNumber = function () {
  const self = this;
  let cleanedInput = self.replace(/[^\d.-]/g, '');
  const decimalParts = cleanedInput.split('.');
  if (decimalParts.length > 2) {
    cleanedInput = `${decimalParts[0]}.${decimalParts.slice(1).join('')}`;
  }
  if (cleanedInput.includes('-')) {
    const minusParts = cleanedInput.split('-').filter((part) => part !== '');
    cleanedInput = `-${minusParts.join('')}`;
  }
  if (cleanedInput.indexOf('-') > 0) {
    cleanedInput = cleanedInput.replace(/-/g, '');
  }
  const finalParts = cleanedInput.split('.');
  if (finalParts.length > 2) {
    cleanedInput = `${finalParts[0]}.${finalParts[1]}`;
  }
  return cleanedInput;
};
String.prototype.parseNumb = function () {
  return parseFloat(this.toNumber());
};
String.prototype.toDate = function () {
  const date = new Date(this.toString());
  if (isNumeric(date.getTime())) return date;
  return undefined;
};
Array.prototype.IncludesAny = function (array?: any[]) {
  return !isArray(array) || this.some((item) => array.includes(item));
};
FormData.prototype.appendItem = function (key: string, value: any) {
  if (isUndefined(value) || value === null) return;
  this.append(key, value);
};
Number.prototype.compareNumb = function (n2?: number, desc = false) {
  let self = this.valueOf();
  if (!isNumeric(self) || !isNumeric(n2)) return isNumeric(n2) ? -1 : isNumeric(self) ? 1 : 0;
  return desc ? n2 - self : self - n2; // return (self - n2) * (desc ? -1 : 1)
};
String.prototype.compareStr = function (s2?: string, ignoreCase = true, checkDate = true, desc = false) {
  let s1 = this.toString();
  if (!isString(s1) || !isString(s2)) return !isString(s1) ? -1 : !isString(s2) ? 1 : 0;
  if (checkDate) {
    const d1 = s1.toDate();
    const d2 = s2.toDate();
    if (d1) return d1.compareDate(d2, desc);
  }
  s1 = ignoreCase ? s1.toLowerCase() : s1;
  s2 = ignoreCase ? s2.toLowerCase() : s2;
  const nonNum1 = s1.replace(/\d+/g, '');
  const nonNum2 = s2.replace(/\d+/g, '');
  if (nonNum1 !== nonNum2) return desc ? nonNum2.localeCompare(nonNum1) : nonNum1.localeCompare(nonNum2); //  nonNum1.localeCompare(nonNum2) * (desc ? -1 : 1);
  const num1 = parseInt(s1.match(/\d+/)?.[0] || '', 10) || 0;
  const num2 = parseInt(s2.match(/\d+/)?.[0] || '', 10) || 0;
  return num1.compareNumb(num2, desc);
};
Date.prototype.compareDate = function (d2?: Date, desc = false) {
  let self = this;
  if (!isDate(self) || !isDate(d2)) return !isDate(self) ? -1 : !isDate(d2) ? 1 : 0;
  return self.getTime().compareNumb(d2.getTime(), desc);
};
/* #endregion */
