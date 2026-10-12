import type { Response } from 'express'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express's own types are declared this way.
  namespace Express {
    interface Locals {
      /** The verified JWT `sub`. Set by `requireUser`, and the only user id a handler may trust. */
      userId?: string
      /** The `x-request-id` for this request. Set by `requestId`. */
      requestId?: string
    }
  }
}

/**
 * The verified user id for this request. Throws if `requireUser` did not run —
 * that is a wiring mistake, not something a traveler can cause.
 */
export const requireUserId = (res: Response): string => {
  const { userId } = res.locals
  if (userId === undefined) {
    throw new Error('requireUserId called on a route that is not behind requireUser')
  }
  return userId
}
