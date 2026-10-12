import { httpErrorBody } from '@waypoint/contracts/common'
import type { Response, RequestHandler } from 'express'
import { createRemoteJWKSet, errors as joseErrors, jwtVerify } from 'jose'
import type { ErrorReporter } from '../errors.ts'
import { UNAUTHORIZED } from '../errorCodes.ts'
import { toUserId } from '../locals.ts'
import { stripTrailingSlash } from '../url.ts'
import { bearerToken } from './bearerToken.ts'

export type RequireUserOptions = {
  /** The Supabase project URL, e.g. `http://127.0.0.1:54321` locally. */
  readonly supabaseUrl: string
  /**
   * Reports anything that isn't an ordinary bad-token rejection — the JWKS
   * being unreachable, timing out, or returning something unparseable — so an
   * outage doesn't look identical to users sending stale tokens. Every case
   * still answers the same 401; this only affects what gets logged.
   */
  readonly report?: ErrorReporter
}

const AUDIENCE = 'authenticated'

/** A failure caused by the caller's token, not by our own JWKS being unreachable. */
const isExpectedAuthFailure = (error: unknown): boolean =>
  error instanceof joseErrors.JWSSignatureVerificationFailed ||
  error instanceof joseErrors.JWTExpired ||
  error instanceof joseErrors.JWTClaimValidationFailed ||
  error instanceof joseErrors.JWKSNoMatchingKey ||
  error instanceof joseErrors.JWTInvalid ||
  error instanceof joseErrors.JWSInvalid ||
  error instanceof joseErrors.JOSEAlgNotAllowed

/**
 * Verifies the Supabase access token locally against the project's JWKS — no
 * call to Supabase per request. On success `res.locals.userId` holds the
 * verified `sub`, which is the only user id a handler may trust; a missing,
 * expired, mis-signed, wrong-issuer, wrong-audience or wrong-algorithm token
 * is a 401.
 *
 * The project must use asymmetric signing keys (ES256), not the legacy shared
 * secret, or there is no JWKS to verify against. `algorithms: ['ES256']` is
 * passed explicitly so a token cannot choose its own verification algorithm.
 */
export const requireUser = ({ supabaseUrl, report }: RequireUserOptions): RequestHandler => {
  const issuer = `${stripTrailingSlash(supabaseUrl)}/auth/v1`
  // Fetched once and cached by jose, then refreshed on an unknown key id.
  const keys = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))

  const unauthorized = (res: Response): void => {
    res.status(401).json(httpErrorBody(UNAUTHORIZED, 'Sign in to continue.'))
  }

  return async (req, res, next) => {
    const token = bearerToken(req.get('authorization'))
    if (token === undefined) {
      unauthorized(res)
      return
    }

    try {
      const { payload } = await jwtVerify(token, keys, {
        issuer,
        audience: AUDIENCE,
        algorithms: ['ES256'],
      })
      if (typeof payload.sub !== 'string' || payload.sub === '') {
        unauthorized(res)
        return
      }
      res.locals.userId = toUserId(payload.sub)
      next()
    } catch (error) {
      // Every verification failure looks the same from outside: a 401 that says
      // nothing about which check failed. A JWKS outage gets the same 401, but
      // is reported, since that is an infra problem, not a bad token.
      if (!isExpectedAuthFailure(error)) {
        report?.(error, { requestId: res.locals.requestId })
      }
      unauthorized(res)
    }
  }
}
