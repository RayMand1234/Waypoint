import type {
  QueryClient,
  QueryExecuteOptions,
  QueryKey,
} from '@tanstack/react-query';

/**
 * Loads a query into the cache ahead of its screen. A failure is left for
 * that screen to show (with its retry), so it settles quietly here.
 */
export const warmQuery = <
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  queryClient: QueryClient,
  options: QueryExecuteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
): Promise<void> =>
  queryClient.query(options).then(
    () => undefined,
    () => undefined,
  );
