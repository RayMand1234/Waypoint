import type { Response } from 'express';

import type { UserId } from '../domain/userId.ts';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express's own types are declared this way.
  namespace Express {
    interface Locals {
      /** The verified JWT `sub`. Set by `requireUser`; the only user id a handler may trust. */
      userId?: UserId;
      /** The `x-request-id` for this request. Set by `requestContext`. */
      requestId?: string;
    }
  }
}

/**
 * The verified user id for this request. Throws if `requireUser` did not run —
 * a wiring mistake, not something a traveler can cause.
 */
export const requireUserId = (res: Pick<Response, 'locals'>): UserId => {
  const { userId } = res.locals;

  if (userId === undefined) {
    throw new Error(
      'requireUserId called on a route that is not behind requireUser',
    );
  }

  return userId;
};
