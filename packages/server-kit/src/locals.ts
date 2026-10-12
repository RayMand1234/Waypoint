import type { Response } from 'express'

/**
 * Branded so only this module can produce one. `toUserId` — the one cast —
 * is not exported from server-kit's public entry (`index.ts`), so a handler
 * can never turn a body or query string into a `UserId`; the only way to get
 * one is through `requireUser` verifying the token.
 */
export type UserId = string & { readonly __brand: 'UserId' }

/** Not exported from the package entry — see the note on `UserId` above. */
export const toUserId = (sub: string): UserId => sub as UserId

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express's own types are declared this way.
  namespace Express {
    interface Locals {
      /** The verified JWT `sub`. Set by `requireUser`, and the only user id a handler may trust. */
      userId?: UserId
      /** The `x-request-id` for this request. Set by `requestId`. */
      requestId?: string
    }
  }
}

/**
 * The verified user id for this request. Throws if `requireUser` did not run —
 * that is a wiring mistake, not something a traveler can cause. Takes only
 * `locals`, not the whole `Response`, so a test fake needs only that field.
 */
export const requireUserId = (res: Pick<Response, 'locals'>): UserId => {
  const { userId } = res.locals
  if (userId === undefined) {
    throw new Error('requireUserId called on a route that is not behind requireUser')
  }
  return userId
}
