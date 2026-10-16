import {
  assertNever,
  httpErrorBody,
  type HttpErrorBody,
  type Result,
} from '@waypoint/contracts/common';
import type { Response } from 'express';
import type { ServiceError } from '../services/errors.ts';
import {
  CONFLICT,
  INVALID_REQUEST,
  NOT_FOUND,
  UPSTREAM_TIMEOUT,
  UPSTREAM_UNAVAILABLE,
} from './errorCodes.ts';

type HttpFailure = { readonly status: number; readonly body: HttpErrorBody };

/** The one place a service error becomes an HTTP status and error body. */
export const toHttpFailure = (error: ServiceError): HttpFailure => {
  switch (error.type) {
    case 'not-found':
      return { status: 404, body: httpErrorBody(NOT_FOUND, error.message) };
    case 'invalid-request':
      return {
        status: 400,
        body: httpErrorBody(INVALID_REQUEST, error.message),
      };
    case 'conflict':
      return { status: 409, body: httpErrorBody(CONFLICT, error.message) };
    case 'upstream-timeout':
      return {
        status: 504,
        body: httpErrorBody(
          UPSTREAM_TIMEOUT,
          'Our partner took too long to answer. Try again.',
        ),
      };
    case 'upstream-unavailable':
      return {
        status: 502,
        body: httpErrorBody(
          UPSTREAM_UNAVAILABLE,
          "Our partner didn't answer. Try again.",
        ),
      };
    default:
      return assertNever(error);
  }
};

/**
 * Sends a service result: the value with `status` on success, the mapped
 * error otherwise. Controllers end with this so every route answers alike.
 */
export const sendResult = <T>(
  res: Response,
  result: Result<T, ServiceError>,
  status = 200,
): void => {
  if (result.ok) {
    res.status(status).json(result.value);

    return;
  }

  const failure = toHttpFailure(result.error);

  res.status(failure.status).json(failure.body);
};
