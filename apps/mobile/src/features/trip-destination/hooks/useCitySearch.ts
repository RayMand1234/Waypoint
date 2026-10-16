import type { PlaceSuggestion } from '@waypoint/contracts/geo';
import { queryKeys } from '@/shared/utils/queryKeys';
import { searchCities } from '../utils/destinationsApi';
import type { SearchState } from '../utils/searchState';
import { useDebouncedSearch } from './useDebouncedSearch';

/** Cities matching what the traveler types. */
export const useCitySearch = (text: string): SearchState<PlaceSuggestion> =>
  useDebouncedSearch(text, (query) => ({
    queryKey: queryKeys.cities(query),
    queryFn: () => searchCities(query),
  }));
