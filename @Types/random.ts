export type VoidFunc = () => void;
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type Point = { x: number; y: number };
export type Size = { w: number; h: number };
