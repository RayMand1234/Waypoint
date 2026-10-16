import { z } from 'zod';
import { isoDateTimeSchema } from './dates.ts';
import { moneySchema } from './money.ts';
import { providerIdSchema } from './providerId.ts';

/**
 * One provider's price for an offer — a row of "Where we found it".
 * `checkedAt` drives "checked 3h ago"; the final price is always confirmed on
 * the partner site that `deepLink` opens.
 */
export const offerSourceSchema = z.object({
  provider: providerIdSchema,
  providerOfferId: z.string().min(1),
  price: moneySchema,
  deepLink: z.url(),
  checkedAt: isoDateTimeSchema,
});
export type OfferSource = z.infer<typeof offerSourceSchema>;

/**
 * How good an offer is for its money, relative to the other offers in the same
 * search. `score` only orders offers within one result; exactly one offer per
 * result has `isBestValue`. `savingsVsAverage` is never negative.
 */
export const offerValueSchema = z.object({
  score: z.number().min(0),
  isBestValue: z.boolean(),
  savingsVsAverage: moneySchema,
});
export type OfferValue = z.infer<typeof offerValueSchema>;

/**
 * A source that failed during a search. The other sources' offers are still
 * returned beside it, so the app can show partial results.
 */
export const providerErrorSchema = z.object({
  provider: providerIdSchema,
  type: z.enum(['timeout', 'unavailable', 'invalid-response']),
  message: z.string().min(1),
});
export type ProviderError = z.infer<typeof providerErrorSchema>;
