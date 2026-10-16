import {
  assertNever,
  type ProviderError,
  type ProviderId,
  type Result,
} from '@waypoint/contracts/common';
import type { Logger } from '../observability/logger.ts';
import { serializeError } from '../observability/serializeError.ts';
import type { ProviderFailure } from './types.ts';

export type SearchOutcome<T> = {
  readonly offers: readonly T[];
  readonly errors: readonly ProviderError[];
};

const toProviderError = (
  provider: ProviderId,
  failure: ProviderFailure,
): ProviderError => {
  switch (failure.type) {
    case 'timeout':
      return {
        provider,
        type: 'timeout',
        message: `${provider} took too long to answer.`,
      };
    case 'not-found':
    case 'unavailable':
      return {
        provider,
        type: 'unavailable',
        message: `${provider} didn't answer.`,
      };
    case 'invalid-response':
      return {
        provider,
        type: 'invalid-response',
        message: `${provider} sent something we couldn't read.`,
      };
    default:
      return assertNever(failure);
  }
};

/**
 * Asks every provider at once, each with its own timeout, and collects what
 * came back. One failing source never fails the search: its failure becomes
 * a `ProviderError` beside the other sources' offers. A provider that throws
 * (a bug, not an expected failure) is logged and reported as unavailable.
 */
export const searchAcross = async <P extends { readonly id: ProviderId }, T>({
  providers,
  call,
  timeoutMs,
  logger,
}: {
  readonly providers: readonly P[];
  readonly call: (
    provider: P,
    signal: AbortSignal,
  ) => Promise<Result<readonly T[], ProviderFailure>>;
  readonly timeoutMs: number;
  readonly logger: Logger;
}): Promise<SearchOutcome<T>> => {
  const settled = await Promise.allSettled(
    providers.map((provider) => call(provider, AbortSignal.timeout(timeoutMs))),
  );

  return settled.reduce<SearchOutcome<T>>(
    (outcome, result, index) => {
      const provider = providers[index];

      if (provider === undefined) return outcome;

      if (result.status === 'rejected') {
        logger.error('provider threw during search', {
          provider: provider.id,
          error: serializeError(result.reason),
        });

        return {
          ...outcome,
          errors: [
            ...outcome.errors,
            toProviderError(provider.id, {
              type: 'unavailable',
              status: null,
              message: 'threw',
            }),
          ],
        };
      }

      return result.value.ok
        ? { ...outcome, offers: [...outcome.offers, ...result.value.value] }
        : {
            ...outcome,
            errors: [
              ...outcome.errors,
              toProviderError(provider.id, result.value.error),
            ],
          };
    },
    { offers: [], errors: [] },
  );
};
