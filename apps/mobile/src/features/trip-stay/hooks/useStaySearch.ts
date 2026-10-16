import { useQuery } from '@tanstack/react-query';
import type { HotelSearchRequest } from '@waypoint/contracts/hotels';
import { searchStatusOf } from '@/shared/utils/searchStatus';
import { staySearchQuery } from '../utils/staySearchQuery';

/** Live stay prices for the trip, and the search's status for the list. */
export const useStaySearch = (request: HotelSearchRequest | undefined) => {
  const query = useQuery(staySearchQuery(request));

  return {
    offers: query.data?.offers ?? [],
    status: searchStatusOf(request !== undefined, query),
    retry: () => {
      void query.refetch();
    },
  };
};
