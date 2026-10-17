import type { Currency } from '@waypoint/contracts/common';
import type { Profile } from '@waypoint/contracts/trips';
import { errorMessage } from '@/shared/utils/errorMessage';
import { useUpdateMe } from './useUpdateMe';

/** The currency prices show in, saved the moment it's picked (shown picked straight away). */
export const useCurrency = (profile: Profile | undefined) => {
  const update = useUpdateMe();

  return {
    currency: update.isPending ? update.variables.currency : profile?.currency,
    setCurrency: (currency: Currency) => {
      if (currency !== profile?.currency) update.mutate({ currency });
    },
    error: update.error === null ? undefined : errorMessage(update.error),
  };
};
