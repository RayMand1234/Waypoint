import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { SessionProvider } from '../auth';
import { createQueryClient } from '../utils/queryClient';

/** Everything app-wide: the auth session and the one React Query cache. */
export const AppProviders = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  // One client for the app's lifetime, created on first render (not at import).
  const [queryClient] = useState(createQueryClient);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
};
