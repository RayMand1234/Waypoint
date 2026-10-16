import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { runWithContext } from '../observability/requestContext.ts';

export const REQUEST_ID_HEADER = 'x-request-id';

// Long enough for a UUID or a W3C trace id, short enough to keep junk out of logs.
const ACCEPTED_ID = /^[\w.:-]{8,128}$/;

/**
 * First middleware. Reuses the app's `x-request-id` (so one tap in the app
 * can be found in the server logs) or makes one, echoes it back, and runs the
 * rest of the request inside its log context.
 */
export const requestContext = (): RequestHandler => (req, res, next) => {
  const incoming = req.get(REQUEST_ID_HEADER)?.trim();
  const requestId =
    incoming !== undefined && ACCEPTED_ID.test(incoming)
      ? incoming
      : randomUUID();

  res.locals.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  runWithContext({ requestId }, next);
};
