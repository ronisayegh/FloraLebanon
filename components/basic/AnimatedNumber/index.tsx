import React, { useEffect, useState } from 'react';
import { ThemedTxt, ThemedTxtProps } from '../ThemedTxt';
export interface AnimatedNumberProps extends ThemedTxtProps {
  value: number;
}
export const AnimatedNumber: React.FC<AnimatedNumberProps> = props => {
  const { value, ...prps } = props;
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const steps = 60;
    const increment = Math.ceil(value / steps);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else setDisplayValue(start);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <ThemedTxt text={displayValue.toLocaleString()} {...prps} />;
};
