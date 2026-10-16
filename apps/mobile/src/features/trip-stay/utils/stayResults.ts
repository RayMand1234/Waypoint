import type {
  HotelOffer,
  HotelSearchResponse,
} from '@waypoint/contracts/hotels';
import type { SearchStatus } from '@/shared/utils/searchStatus';
import type { StayHighlights } from './stayCardModel';

export type StayResultsState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | {
      readonly status: 'loaded';
      /** In the chosen order. */
      readonly offers: readonly HotelOffer[];
      readonly highlights: StayHighlights;
      /** Some booking sites didn't answer this time. */
      readonly hasMissingSources: boolean;
    };

export const stayResultsState = (
  search: SearchStatus<HotelSearchResponse>,
  ordered: readonly HotelOffer[],
  highlights: StayHighlights,
): StayResultsState => {
  switch (search.status) {
    case 'no-request':
      return { status: 'error', message: 'Set at least one night in step 3.' };
    case 'pending':
      return { status: 'loading' };
    case 'error':
      return { status: 'error', message: search.message };
    case 'success':
      return {
        status: 'loaded',
        offers: ordered,
        highlights,
        hasMissingSources: search.response.errors.length > 0,
      };
  }
};
