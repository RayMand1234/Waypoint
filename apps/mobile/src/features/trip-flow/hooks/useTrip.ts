import { skipToken, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/utils/queryKeys';
import { fetchTrip } from '../utils/tripApi';

/** One trip with its spots, plan and selections; skipped without an id. */
export const useTrip = (tripId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.trip(tripId ?? ''),
    queryFn: tripId === undefined ? skipToken : () => fetchTrip(tripId),
  });
