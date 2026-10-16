import { useQuery } from '@tanstack/react-query';
import { fetchTrips } from '../utils/tripsApi';
import { queryKeys } from '@/shared/utils/queryKeys';

export const useTrips = () =>
  useQuery({ queryKey: queryKeys.trips, queryFn: fetchTrips });
