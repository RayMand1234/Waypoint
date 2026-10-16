import { StatusBar } from 'expo-status-bar';
import { useSession } from '@/shared/auth';
import { useAppFonts } from '../hooks/useAppFonts';
import { useHideSplash } from '../hooks/useHideSplash';
import { RootStack } from './RootStack';

/** Waits (behind the splash) for fonts and the stored session, then shows the right screens. */
export const AppShell = () => {
  const fontsReady = useAppFonts();
  const session = useSession();
  const isReady = fontsReady && session.status !== 'loading';

  useHideSplash(isReady);

  if (!isReady) return null;

  return (
    <>
      <StatusBar style="dark" />
      <RootStack session={session} />
    </>
  );
};
