import { httpErrorBody } from '@waypoint/contracts/common';
import type { RequestHandler, Response } from 'express';
import { createRemoteJWKSet, errors as joseErrors, jwtVerify } from 'jose';
import { UNAUTHORIZED } from '../http/errorCodes.ts';
import { toUserId } from '../domain/userId.ts';
import type { Logger } from '../observability/logger.ts';
import {
  currentContext,
  runWithContext,
} from '../observability/requestContext.ts';
import { serializeError } from '../observability/serializeError.ts';
import { bearerToken } from './bearerToken.ts';

const AUDIENCE = 'authenticated';

/** A failure caused by the caller's token, not by our JWKS being unreachable. */
const isTokenProblem = (error: unknown): boolean =>
  error instanceof joseErrors.JWSSignatureVerificationFailed ||
  error instanceof joseErrors.JWTExpired ||
  error instanceof joseErrors.JWTClaimValidationFailed ||
  error instanceof joseErrors.JWKSNoMatchingKey ||
  error instanceof joseErrors.JWTInvalid ||
  error instanceof joseErrors.JWSInvalid ||
  error instanceof joseErrors.JOSEAlgNotAllowed;

const unauthorized = (res: Response): void => {
  res.status(401).json(httpErrorBody(UNAUTHORIZED, 'Sign in to continue.'));
};

/**
 * Verifies the Supabase access token locally against the project's JWKS — no
 * call to Supabase per request. On success the verified `sub` is in
 * `res.locals.userId` and in the log context. Any bad token is the same 401;
 * a JWKS outage is also a 401 but is logged as an error, since it is ours.
 *
 * The project must use asymmetric signing keys (ES256). `algorithms` is fixed
 * so a token cannot choose how it is verified.
 */
export const requireUser = ({
  supabaseUrl,
  logger,
}: {
  readonly supabaseUrl: string;
  readonly logger: Logger;
}): RequestHandler => {
  const issuer = `${supabaseUrl.replace(/\/+$/, '')}/auth/v1`;
  // Fetched once and cached by jose, refetched on an unknown key id.
  const keys = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

  return async (req, res, next) => {
    const token = bearerToken(req.get('authorization'));

    if (token === undefined) {
      unauthorized(res);

      return;
    }

    try {
      const { payload } = await jwtVerify(token, keys, {
        issuer,
        audience: AUDIENCE,
        algorithms: ['ES256'],
      });

      if (typeof payload.sub !== 'string' || payload.sub === '') {
        unauthorized(res);

        return;
      }

      const userId = toUserId(payload.sub);
      const requestId =
        currentContext()?.requestId ?? res.locals.requestId ?? 'unknown';

      res.locals.userId = userId;
      runWithContext({ requestId, userId }, next);
    } catch (error) {
      if (!isTokenProblem(error)) {
        logger.error('token verification failed (JWKS unreachable?)', {
          error: serializeError(error),
        });
      }

      unauthorized(res);
    }
  };
};
