import { errorMessage } from '@/shared/utils/errorMessage';

/** A search list: running (earlier results stay shown), failed, or done. */
export type SearchState<T> =
  | { readonly status: 'searching'; readonly items: readonly T[] }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'done'; readonly items: readonly T[] };

/** A search query as the list shows it. */
export const searchState = <T>(query: {
  readonly isFetching: boolean;
  readonly error: unknown;
  readonly data: readonly T[] | undefined;
}): SearchState<T> => {
  if (query.error !== null && query.error !== undefined)
    return { status: 'error', message: errorMessage(query.error) };

  const items = query.data ?? [];

  return query.isFetching
    ? { status: 'searching', items }
    : { status: 'done', items };
};
