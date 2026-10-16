import { AppProviders } from '@/shared/providers/AppProviders';
import { AppShell } from './AppShell';

/** The root of the app: providers around the shell. */
export const RootLayout = () => (
  <AppProviders>
    <AppShell />
  </AppProviders>
);
