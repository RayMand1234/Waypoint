import { currencySchema, iataCodeSchema } from '@waypoint/contracts/common';
import type { Profile, UpdateMeRequest } from '@waypoint/contracts/trips';
import { z } from 'zod';

/** A blank field means "clear it" — `null`, as the API expects. */
const blankToNull = (value: string): string | null =>
  value === '' ? null : value;

export const profileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .max(80, 'Keep it under 80 characters.')
    .transform(blankToNull),
  homeAirport: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^([A-Z]{3})?$/, 'Use the 3-letter airport code, like TLV.')
    .transform(blankToNull)
    .pipe(iataCodeSchema.nullable()),
  currency: currencySchema,
});

export type ProfileFormValues = z.input<typeof profileFormSchema>;
export type ProfileFormOutput = z.output<typeof profileFormSchema>;

export const toFormValues = (profile: Profile): ProfileFormValues => ({
  name: profile.name ?? '',
  homeAirport: profile.homeAirport ?? '',
  currency: profile.currency,
});

export const toUpdateRequest = (values: ProfileFormOutput): UpdateMeRequest =>
  values;
