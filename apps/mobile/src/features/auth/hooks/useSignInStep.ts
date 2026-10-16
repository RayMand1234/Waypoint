import { useState } from 'react';

/** Email first, then the code we sent to it. */
export type SignInStep =
  | { readonly kind: 'email' }
  | { readonly kind: 'code'; readonly email: string };

export const useSignInStep = () => {
  const [step, setStep] = useState<SignInStep>({ kind: 'email' });

  return {
    step,
    toCode: (email: string) => {
      setStep({ kind: 'code', email });
    },
    toEmail: () => {
      setStep({ kind: 'email' });
    },
  };
};
