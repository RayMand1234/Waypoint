import express, { type Express, type RequestHandler } from 'express';
import { accessLog } from './middleware/accessLog.ts';
import { errorHandler, notFound } from './middleware/errorHandler.ts';
import { requestContext } from './middleware/requestContext.ts';
import type { Logger } from './observability/logger.ts';
import { createHealthRouter } from './routes/health.routes.ts';
import { createApiRouter, type Services } from './routes/index.ts';

export type AppDeps = {
  readonly services: Services;
  readonly requireUser: RequestHandler;
  readonly logger: Logger;
  readonly now: () => Date;
};

/**
 * The Express app, with no `listen` and no env reads, so tests drive it with
 * supertest and fakes. Order matters: request context first (every later log
 * line carries the id), access log, body parsing, public health, then the
 * authenticated API, then 404 and the error handler.
 */
export const createApp = ({
  services,
  requireUser,
  logger,
  now,
}: AppDeps): Express =>
  express()
    .disable('x-powered-by')
    .use(requestContext())
    .use(accessLog({ logger }))
    .use(express.json({ limit: '200kb' }))
    .use(createHealthRouter({ now }))
    .use(createApiRouter(services, requireUser))
    .use(notFound)
    .use(errorHandler({ logger }));
