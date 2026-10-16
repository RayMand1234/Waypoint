import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/utils/queryKeys';
import { fetchHotel } from '../utils/stayApi';

/** A hotel's details, loaded when its sheet opens. */
export const useHotel = (hotelId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.hotel(hotelId ?? ''),
    queryFn: () => fetchHotel(hotelId ?? ''),
    enabled: hotelId !== undefined,
  });
