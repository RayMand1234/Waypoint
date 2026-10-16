import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signOut } from '../utils/authApi';

/** Ends the session and forgets every cached server answer, so the next traveler starts clean. */
export const useSignOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      queryClient.clear();
    },
  });
};
