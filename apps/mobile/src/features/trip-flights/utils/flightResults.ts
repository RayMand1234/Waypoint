import type {
  FlightOffer,
  FlightSearchResponse,
} from '@waypoint/contracts/flights';
import type { SearchStatus } from '@/shared/utils/searchStatus';

export type FlightResultsState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | {
      readonly status: 'loaded';
      /** After the chosen filters. */
      readonly offers: readonly FlightOffer[];
      /** Fares were found, but the filters hide them all. */
      readonly isFilteredOut: boolean;
      /** Some sites didn't answer this time. */
      readonly hasMissingSources: boolean;
    };

export const flightResultsState = (
  search: SearchStatus<FlightSearchResponse>,
  filtered: readonly FlightOffer[],
  missingMessage: string,
): FlightResultsState => {
  switch (search.status) {
    case 'no-request':
      return { status: 'error', message: missingMessage };
    case 'pending':
      return { status: 'loading' };
    case 'error':
      return { status: 'error', message: search.message };
    case 'success':
      return {
        status: 'loaded',
        offers: filtered,
        isFilteredOut:
          filtered.length === 0 && search.response.offers.length > 0,
        hasMissingSources: search.response.errors.length > 0,
      };
  }
};
