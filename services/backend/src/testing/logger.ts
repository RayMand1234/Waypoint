import { createLogger, type Logger } from '../observability/logger.ts';

/** A real logger that writes nothing, so test output stays readable. */
export const silentLogger = (): Logger =>
  createLogger({ level: 'debug', format: 'json', silent: true });
