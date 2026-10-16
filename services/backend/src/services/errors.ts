import {
  assertNever,
  err,
  ok,
  type ProviderId,
  type Result,
} from '@waypoint/contracts/common';
import type { ProviderFailure, ProviderResult } from '../providers/types.ts';

/**
 * Every expected failure a service can return. Services never know about
 * HTTP; `http/errors.ts` maps each `type` to a status in one place.
 */
export type ServiceError =
  | { readonly type: 'not-found'; readonly message: string }
  | { readonly type: 'invalid-request'; readonly message: string }
  | { readonly type: 'conflict'; readonly message: string }
  | { readonly type: 'upstream-timeout'; readonly provider: ProviderId }
  | { readonly type: 'upstream-unavailable'; readonly provider: ProviderId };

export const notFound = (message: string): ServiceError => ({
  type: 'not-found',
  message,
});

export const invalidRequest = (message: string): ServiceError => ({
  type: 'invalid-request',
  message,
});

export const conflict = (message: string): ServiceError => ({
  type: 'conflict',
  message,
});

/** A provider failing a lookup (not a search, which reports partial results). */
export const fromProviderFailure = (
  provider: ProviderId,
  failure: ProviderFailure,
  notFoundMessage: string,
): ServiceError => {
  switch (failure.type) {
    case 'not-found':
      return notFound(notFoundMessage);
    case 'timeout':
      return { type: 'upstream-timeout', provider };
    case 'unavailable':
    case 'invalid-response':
      return { type: 'upstream-unavailable', provider };
    default:
      return assertNever(failure);
  }
};

/** A provider lookup's result as a service result: the value wrapped, or the failure mapped. */
export const fromProviderResult = <T, R>(
  provider: ProviderId,
  result: Result<T, ProviderFailure>,
  wrap: (value: T) => R,
  notFoundMessage: string,
): Result<R, ServiceError> =>
  result.ok
    ? ok(wrap(result.value))
    : err(fromProviderFailure(provider, result.error, notFoundMessage));

/** A loader for `cached`: one provider call, its value wrapped or its failure mapped. */
export const loadFromProvider =
  <T, R>(
    provider: ProviderId,
    call: () => ProviderResult<T>,
    wrap: (value: T) => R,
    notFoundMessage: string,
  ) =>
  async (): Promise<Result<R, ServiceError>> =>
    fromProviderResult(provider, await call(), wrap, notFoundMessage);
