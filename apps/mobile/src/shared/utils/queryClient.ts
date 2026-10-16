import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './apiError';

const MAX_RETRIES = 2;

/** Retrying can't fix a bad token, a missing resource or a rejected request. */
const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= MAX_RETRIES) return false;

  if (!isApiError(error)) return true;

  const { details } = error;

  return (
    details.type === 'network' ||
    details.type === 'timeout' ||
    (details.type === 'http' && details.status >= 500)
  );
};

export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 30_000 },
      mutations: { retry: false },
    },
  });
