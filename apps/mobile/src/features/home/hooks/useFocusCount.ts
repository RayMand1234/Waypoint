import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/** How many times this screen has come into view — a key that restarts an entrance each time. */
export const useFocusCount = (): number => {
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setCount((current) => current + 1);
    }, []),
  );

  return count;
};
