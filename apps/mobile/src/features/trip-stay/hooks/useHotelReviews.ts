import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/utils/queryKeys';
import { fetchHotelReviews } from '../utils/stayApi';

/** What guests say about a hotel, loaded when its sheet opens. */
export const useHotelReviews = (hotelId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.hotelReviews(hotelId ?? ''),
    queryFn: () => fetchHotelReviews(hotelId ?? ''),
    enabled: hotelId !== undefined,
  });
