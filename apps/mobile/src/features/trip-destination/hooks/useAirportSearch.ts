import type { Airport } from '@waypoint/contracts/geo';
import { queryKeys } from '@/shared/utils/queryKeys';
import { searchAirports } from '../utils/destinationsApi';
import type { SearchState } from '../utils/searchState';
import { useDebouncedSearch } from './useDebouncedSearch';

/** Airports matching what the traveler types. */
export const useAirportSearch = (text: string): SearchState<Airport> =>
  useDebouncedSearch(text, (query) => ({
    queryKey: queryKeys.airports(query),
    queryFn: () => searchAirports(query),
  }));
