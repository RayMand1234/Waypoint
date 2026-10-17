import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

/**
 * The status bar over Home: white text on the hero's photo, dark once the
 * page has scrolled past it, and dark again when another screen is shown.
 */
export const useHeroStatusBar = () => {
  const { theme, rt } = useUnistyles();
  const isPastHero = useRef(false);
  // Past the hero once its bottom reaches the status bar.
  const threshold = theme.size['home-hero-h'] - rt.insets.top;

  useFocusEffect(
    useCallback(() => {
      StatusBar.setStyle(isPastHero.current ? 'dark' : 'light');

      return () => {
        StatusBar.setStyle('dark');
      };
    }, []),
  );

  return {
    onScroll: ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const isPast = nativeEvent.contentOffset.y > threshold;

      if (isPast === isPastHero.current) return;

      isPastHero.current = isPast;
      StatusBar.setStyle(isPast ? 'dark' : 'light');
    },
  };
};
