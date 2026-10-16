import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/utils/queryKeys';
import { addDestination } from '../utils/destinationsApi';

/**
 * Turns a searched city into a destination and caches it, so later steps
 * don't fetch it again. The suggestions list only ever holds curated
 * destinations, so it doesn't change.
 */
export const useAddDestination = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (placeId: string) => addDestination(placeId),
    onSuccess: (destination) => {
      queryClient.setQueryData(
        queryKeys.destination(destination.id),
        destination,
      );
    },
  });
};
