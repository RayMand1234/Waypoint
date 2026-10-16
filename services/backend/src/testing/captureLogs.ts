import { Writable } from 'node:stream';
import winston from 'winston';
import { createLogger, type Logger } from '../observability/logger.ts';

/** A real logger (same formats as production, JSON) whose lines a test can read. */
export const captureLogs = (): {
  readonly logger: Logger;
  readonly lines: () => Record<string, unknown>[];
} => {
  const raw: string[] = [];
  const logger = createLogger({ level: 'debug', format: 'json' });

  logger.clear();
  logger.add(
    new winston.transports.Stream({
      stream: new Writable({
        write: (chunk: Buffer, _encoding, done) => {
          raw.push(chunk.toString());
          done();
        },
      }),
    }),
  );

  return {
    logger,
    lines: () =>
      raw
        .join('')
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => {
          const parsed: unknown = JSON.parse(line);

          return typeof parsed === 'object' && parsed !== null
            ? { ...parsed }
            : {};
        }),
  };
};
