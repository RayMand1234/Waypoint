import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTrip } from '../utils/tripsApi';
import { queryKeys } from '@/shared/utils/queryKeys';

export const useCreateTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTrip,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.trips }),
  });
};
