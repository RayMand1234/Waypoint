import { useQuery } from '@tanstack/react-query';
import type { FlightSearchRequest } from '@waypoint/contracts/flights';
import { searchStatusOf } from '@/shared/utils/searchStatus';
import { flightSearchQuery } from '../utils/flightSearchQuery';

/** Live fares for the trip, and the search's status for the list. */
export const useFlightSearch = (request: FlightSearchRequest | undefined) => {
  const query = useQuery(flightSearchQuery(request));

  return {
    offers: query.data?.offers ?? [],
    status: searchStatusOf(request !== undefined, query),
    retry: () => {
      void query.refetch();
    },
  };
};
