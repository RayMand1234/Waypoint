import { httpErrorBody } from '@waypoint/contracts/common';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import {
  INTERNAL_ERROR,
  INVALID_REQUEST,
  NOT_FOUND,
} from '../http/errorCodes.ts';
import type { Logger } from '../observability/logger.ts';
import { serializeError } from '../observability/serializeError.ts';

/** Catch-all for a path no router matched. */
export const notFound: RequestHandler = (_req, res) => {
  res
    .status(404)
    .json(httpErrorBody(NOT_FOUND, 'No route matches this request.'));
};

/** `express.json()` rejecting a body that isn't JSON — the caller's mistake. */
const isBodyParseError = (error: unknown): boolean =>
  error instanceof SyntaxError &&
  'type' in error &&
  error.type === 'entity.parse.failed';

/**
 * Last middleware. Expected failures never get here — they come back as a
 * `Result` and the controller maps them. Anything that does is a programmer
 * error: logged with its stack, answered with a 500 that leaks nothing.
 */
export const errorHandler =
  ({ logger }: { readonly logger: Logger }): ErrorRequestHandler =>
  (error, _req, res, next) => {
    if (res.headersSent) {
      next(error);

      return;
    }

    if (isBodyParseError(error)) {
      res
        .status(400)
        .json(
          httpErrorBody(INVALID_REQUEST, 'The request body is not valid JSON.'),
        );

      return;
    }

    logger.error('unhandled error', {
      requestId: res.locals.requestId,
      userId: res.locals.userId,
      error: serializeError(error),
    });
    res
      .status(500)
      .json(httpErrorBody(INTERNAL_ERROR, 'Something went wrong on our side.'));
  };
