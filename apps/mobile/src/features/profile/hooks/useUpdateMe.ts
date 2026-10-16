import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMe } from '../utils/meApi';
import { queryKeys } from '@/shared/utils/queryKeys';

/** The response is the fresh profile, so it replaces the cached one without a refetch. */
export const useUpdateMe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMe,
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.me, profile);
    },
  });
};
