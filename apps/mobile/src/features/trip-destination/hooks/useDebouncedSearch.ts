import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { searchState, type SearchState } from '../utils/searchState';

/** Searches start from this many letters… */
export const MIN_SEARCH = 2;
/** …after this pause in typing. */
const DEBOUNCE_MS = 300;

/** Whether `text` is long enough to search. */
export const isSearchText = (text: string): boolean =>
  text.trim().length >= MIN_SEARCH;

/** A search as the traveler types: after a short pause, from `MIN_SEARCH` letters. */
export const useDebouncedSearch = <T>(
  text: string,
  options: (
    query: string,
  ) => UseQueryOptions<readonly T[], Error, readonly T[]>,
): SearchState<T> => {
  const query = useDebouncedValue(text.trim(), DEBOUNCE_MS);
  const result = useQuery({ ...options(query), enabled: isSearchText(query) });

  return searchState(result);
};
