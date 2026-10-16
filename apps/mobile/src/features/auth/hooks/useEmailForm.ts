import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { authErrorMessage } from '../utils/authErrorMessage';
import { emailFormSchema, type EmailFormValues } from '../utils/schemas';
import { useSendCode } from './useSendCode';

/** The email field: validates, sends the code, then hands the email on. */
export const useEmailForm = (onSent: (email: string) => void) => {
  const sendCode = useSendCode();
  const form = useForm<
    EmailFormValues,
    unknown,
    z.output<typeof emailFormSchema>
  >({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: '' },
  });

  const submit = form.handleSubmit(({ email }) => {
    sendCode.mutate(email, {
      onSuccess: () => {
        onSent(email);
      },
    });
  });

  return {
    control: form.control,
    submit,
    isSending: sendCode.isPending,
    error:
      sendCode.error === null ? undefined : authErrorMessage(sendCode.error),
  };
};
