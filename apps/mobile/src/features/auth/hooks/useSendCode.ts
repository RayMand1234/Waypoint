import { useMutation } from '@tanstack/react-query';
import { sendCode } from '../utils/authApi';

export const useSendCode = () => useMutation({ mutationFn: sendCode });
