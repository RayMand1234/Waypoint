import { useQuery } from '@tanstack/react-query';
import type {
  HotelSearchRequest,
  HotelSearchResponse,
} from '@waypoint/contracts/hotels';
import { errorMessage } from '@/shared/utils/errorMessage';
import { staySearchQuery } from '../utils/staySearchQuery';
import type { StaySearchStatus } from '../utils/stayResults';

const statusOf = (
  hasNights: boolean,
  query: {
    readonly error: unknown;
    readonly data: HotelSearchResponse | undefined;
  },
): StaySearchStatus => {
  if (!hasNights) return { status: 'no-nights' };

  if (query.error !== null && query.error !== undefined)
    return { status: 'error', message: errorMessage(query.error) };

  return query.data === undefined
    ? { status: 'pending' }
    : { status: 'success', response: query.data };
};

/** Live stay prices for the trip, and the search's status for the list. */
export const useStaySearch = (request: HotelSearchRequest | undefined) => {
  const query = useQuery(staySearchQuery(request));

  return {
    offers: query.data?.offers ?? [],
    status: statusOf(request !== undefined, query),
    retry: () => {
      void query.refetch();
    },
  };
};
