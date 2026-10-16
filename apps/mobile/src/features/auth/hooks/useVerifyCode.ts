import { useMutation } from '@tanstack/react-query';
import { verifyCode } from '../utils/authApi';

/** On success the session changes and the app moves to Home by itself. */
export const useVerifyCode = () =>
  useMutation({
    mutationFn: ({
      email,
      code,
    }: {
      readonly email: string;
      readonly code: string;
    }) => verifyCode(email, code),
  });
