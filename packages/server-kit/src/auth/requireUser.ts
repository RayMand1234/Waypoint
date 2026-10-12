import { httpErrorBody } from '@waypoint/contracts'
import type { RequestHandler } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { bearerToken } from './bearerToken.ts'

export type RequireUserOptions = {
  /** The Supabase project URL, e.g. `http://127.0.0.1:54321` locally. */
  readonly supabaseUrl: string
}

const AUDIENCE = 'authenticated'

/**
 * Verifies the Supabase access token locally against the project's JWKS — no
 * call to Supabase per request. On success `res.locals.userId` holds the
 * verified `sub`, which is the only user id a handler may trust; a missing,
 * expired, mis-signed, wrong-issuer or wrong-audience token is a 401.
 *
 * The project must use asymmetric signing keys (ES256), not the legacy shared
 * secret, or there is no JWKS to verify against.
 */
export const requireUser = ({ supabaseUrl }: RequireUserOptions): RequestHandler => {
  const issuer = `${supabaseUrl.replace(/\/+$/, '')}/auth/v1`
  // Fetched once and cached by jose, then refreshed on an unknown key id.
  const keys = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))

  const unauthorized = (res: Parameters<RequestHandler>[1]): void => {
    res.status(401).json(httpErrorBody('unauthorized', 'Sign in to continue.'))
  }

  return async (req, res, next) => {
    const token = bearerToken(req.get('authorization'))
    if (token === undefined) {
      unauthorized(res)
      return
    }

    try {
      const { payload } = await jwtVerify(token, keys, { issuer, audience: AUDIENCE })
      if (typeof payload.sub !== 'string' || payload.sub === '') {
        unauthorized(res)
        return
      }
      res.locals.userId = payload.sub
      next()
    } catch {
      // Every verification failure looks the same from outside: a 401 that says
      // nothing about which check failed.
      unauthorized(res)
    }
  }
}
