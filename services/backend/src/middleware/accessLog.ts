import type { RequestHandler } from 'express';
import type { Logger } from '../observability/logger.ts';

const levelFor = (status: number): 'error' | 'warn' | 'info' =>
  status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

/**
 * One line per request once the response is sent: method, path, route
 * pattern, status and duration. Ids are read from `res.locals`, not the async
 * context, because `finish` fires outside the request's async chain.
 */
export const accessLog =
  ({ logger }: { readonly logger: Logger }): RequestHandler =>
  (req, res, next) => {
    const started = performance.now();

    res.on('finish', () => {
      const route: unknown = req.route;
      const pattern =
        typeof route === 'object' && route !== null && 'path' in route
          ? `${req.baseUrl}${String(route.path)}`
          : null;

      logger.log(levelFor(res.statusCode), 'http request', {
        requestId: res.locals.requestId,
        userId: res.locals.userId,
        method: req.method,
        path: req.path,
        route: pattern,
        status: res.statusCode,
        durationMs: Math.round(performance.now() - started),
      });
    });

    next();
  };
