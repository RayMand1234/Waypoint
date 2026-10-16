import type { DestinationSuggestion } from '@waypoint/contracts/destinations';
import type { PlaceSuggestion } from '@waypoint/contracts/geo';
import { useState } from 'react';
import { errorMessage } from '@/shared/utils/errorMessage';
import { otherCities } from '../utils/citySearch';
import { filterDestinations } from '../utils/destinationCardModel';
import {
  toChosen,
  type ChosenDestination,
} from '../utils/destinationFormSchema';
import type { SearchState } from '../utils/searchState';
import { useAddDestination } from './useAddDestination';
import { useCitySearch } from './useCitySearch';
import { isSearchText } from './useDebouncedSearch';

/** Cities from search beyond our matching picks; a failed add shows as the list's error. */
const moreCities = (
  cities: SearchState<PlaceSuggestion>,
  matches: readonly DestinationSuggestion[],
  addError: unknown,
): SearchState<PlaceSuggestion> => {
  if (addError !== null)
    return { status: 'error', message: errorMessage(addError) };

  return cities.status === 'error'
    ? cities
    : { ...cities, items: otherCities(cities.items, matches) };
};

/**
 * The destination picker: what's typed, our matching picks, and other cities
 * from search — a city becomes a destination when picked.
 */
export const useDestinationPicker = (
  suggestions: readonly DestinationSuggestion[],
  onChange: (destination: ChosenDestination) => void,
) => {
  const [search, setSearch] = useState('');
  const isSearching = isSearchText(search);
  const cities = useCitySearch(search);
  const add = useAddDestination();
  const matches = filterDestinations(suggestions, search);

  return {
    search,
    setSearch,
    isSearching,
    /** Our picks: all of them, or those matching the search. */
    picks: isSearching ? matches : suggestions,
    showPicks: !isSearching || matches.length > 0,
    cities: moreCities(cities, matches, add.error),
    addingPlaceId: add.isPending ? add.variables : undefined,
    pickSuggestion: (destination: DestinationSuggestion) => {
      onChange(toChosen(destination));
    },
    pickCity: (placeId: string) => {
      add.mutate(placeId, {
        onSuccess: (destination) => {
          onChange(toChosen(destination));
          setSearch('');
        },
      });
    },
  };
};
