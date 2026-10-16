import type { Logger as TypeOrmLogger } from 'typeorm';
import type { Logger } from '../observability/logger.ts';
import { serializeError } from '../observability/serializeError.ts';

// Long statements are cut so one query can't flood the log line.
const MAX_QUERY_CHARS = 500;

const short = (query: string): string =>
  query.length > MAX_QUERY_CHARS
    ? `${query.slice(0, MAX_QUERY_CHARS)}…`
    : query;

/**
 * Routes TypeORM's logging into the app logger, so query errors and slow
 * queries carry the request id like every other line. Parameters are never
 * logged — they hold user data. Every query is logged at `debug`.
 */
export const createTypeOrmLogger = (logger: Logger): TypeOrmLogger => ({
  logQuery: (query) => {
    logger.debug('db query', { query: short(query) });
  },
  logQueryError: (error, query) => {
    logger.error('db query failed', {
      query: short(query),
      error: serializeError(error),
    });
  },
  logQuerySlow: (time, query) => {
    logger.warn('db query slow', { query: short(query), durationMs: time });
  },
  logSchemaBuild: (message) => {
    logger.debug('db schema', { message });
  },
  logMigration: (message) => {
    logger.info('db migration', { message });
  },
  log: (level, message: unknown) => {
    logger.log(level === 'warn' ? 'warn' : 'info', 'db', {
      message: String(message),
    });
  },
});
