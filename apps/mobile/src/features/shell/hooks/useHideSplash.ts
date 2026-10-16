import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

void SplashScreen.preventAutoHideAsync();

/** Keeps the native splash up until the app has what its first screen needs. */
export const useHideSplash = (isReady: boolean): void => {
  useEffect(() => {
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);
};
