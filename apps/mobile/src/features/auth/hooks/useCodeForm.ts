import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { authErrorMessage } from '../utils/authErrorMessage';
import { codeFormSchema, type CodeFormValues } from '../utils/schemas';
import { useSendCode } from './useSendCode';
import { useVerifyCode } from './useVerifyCode';

/** The 6-digit code field, plus sending a fresh code to the same address. */
export const useCodeForm = (email: string) => {
  const verify = useVerifyCode();
  const resend = useSendCode();
  const form = useForm<
    CodeFormValues,
    unknown,
    z.output<typeof codeFormSchema>
  >({
    resolver: zodResolver(codeFormSchema),
    defaultValues: { code: '' },
  });

  const submit = form.handleSubmit(({ code }) => {
    verify.mutate({ email, code });
  });

  const failure = verify.error ?? resend.error;

  return {
    control: form.control,
    submit,
    resend: () => {
      verify.reset();
      form.resetField('code');
      resend.mutate(email);
    },
    isVerifying: verify.isPending,
    isResending: resend.isPending,
    wasResent: resend.isSuccess,
    error: failure === null ? undefined : authErrorMessage(failure),
  };
};
