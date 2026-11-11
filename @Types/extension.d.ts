interface Number {
  default: (numb?: number) => number;
  max: (numb?: number) => number;
  min: (numb?: number) => number;
  Between: (min?: number, max?: number) => number;
  Random: (max?: number) => number;
  map: (in_min: number, in_max: number, out_min: number, out_max: number) => number;
  Randomf: (max?: number) => number;
  AddZero: (count?: number) => string;
  toComma: () => string;
  toPercent: () => string;
  isBetween: (min: number, max: number, equal?: boolean) => boolean;
  toDate: () => Date | undefined;
  checkIndex: (array: Array<any>) => boolean;
  compareNumb: (n2?: number, desc?: boolean) => number;
}
interface Date {
  clearSec: () => Date;
  clearMin: () => Date;
  ClearSecAndMin: () => Date;
  clearHour: () => Date;
  clearTime: () => Date;
  setD: (day?: number) => Date;
  setM: (month?: number) => Date;
  setY: (year?: number) => Date;
  isToday: () => boolean;
  isOlder: (days?: number) => boolean;
  compareDate: (d2?: Date, desc?: boolean) => number;
}
interface String {
  toDate: () => Date | undefined;
  toNumber: () => string;
  parseNumb: () => number;
  compareStr: (s2?: string, ignoreCase?: boolean, checkDate?: boolean, desc?: boolean) => number;
}
interface Array {
  IncludesAny: (array?: any[]) => boolean;
}
interface FormData {
  appendItem: (key: string, value: any) => void;
}
