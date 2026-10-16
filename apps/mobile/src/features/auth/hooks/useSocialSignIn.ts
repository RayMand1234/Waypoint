import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { env } from '@/shared/utils/env';
import { authErrorMessage } from '../utils/authErrorMessage';
import {
  isGoogleConfigured,
  signInWithApple,
  signInWithGoogle,
} from '../utils/authApi';

/** Google and Apple, each shown only where it is configured (Apple on iOS only). */
export const useSocialSignIn = () => {
  const google = useMutation({ mutationFn: signInWithGoogle });
  const apple = useMutation({ mutationFn: signInWithApple });
  const failure = google.error ?? apple.error;

  return {
    isGoogleAvailable: isGoogleConfigured(),
    isAppleAvailable: Platform.OS === 'ios' && env.appleSignIn,
    signInWithGoogle: () => {
      google.mutate();
    },
    signInWithApple: () => {
      apple.mutate();
    },
    isGooglePending: google.isPending,
    isApplePending: apple.isPending,
    error: failure === null ? undefined : authErrorMessage(failure),
  };
};
