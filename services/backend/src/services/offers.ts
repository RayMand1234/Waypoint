import {
  ok,
  type OfferSource,
  type ProviderError,
  type ProviderId,
  type Result,
} from '@waypoint/contracts/common';
import { MINUTE_MS } from '../lib/time.ts';
import type { Logger } from '../observability/logger.ts';
import { searchAcross } from '../providers/searchAcross.ts';
import type { ProviderFailure } from '../providers/types.ts';

/** Live rates move; 15 minutes keeps "checked X min ago" honest. Shared by hotels and flights. */
export const LIVE_RATES_TTL_MS = 15 * MINUTE_MS;

/** One provider's entry in an offer's "Where we found it" list. */
export const toOfferSource = (offer: OfferSource): OfferSource => ({
  provider: offer.provider,
  providerOfferId: offer.providerOfferId,
  price: offer.price,
  deepLink: offer.deepLink,
  checkedAt: offer.checkedAt,
});

/**
 * Searches every provider, logs the outcome, and turns the raw offers into
 * ranked Waypoint offers. Never fails as a whole: failed sources come back in
 * `errors` beside the offers.
 */
export const searchOffers = async <
  P extends { readonly id: ProviderId },
  Raw,
  Offer,
>({
  label,
  providers,
  call,
  timeoutMs,
  logger,
  toOffers,
}: {
  readonly label: string;
  readonly providers: readonly P[];
  readonly call: (
    provider: P,
    signal: AbortSignal,
  ) => Promise<Result<readonly Raw[], ProviderFailure>>;
  readonly timeoutMs: number;
  readonly logger: Logger;
  readonly toOffers: (offers: readonly Raw[]) => Offer[];
}): Promise<Result<{ offers: Offer[]; errors: ProviderError[] }, never>> => {
  const { offers, errors } = await searchAcross({
    providers,
    call,
    timeoutMs,
    logger,
  });

  logger.info(`${label} search`, {
    offers: offers.length,
    failedSources: errors.length,
  });

  return ok({ offers: toOffers(offers), errors: [...errors] });
};
