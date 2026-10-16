import winston from 'winston';
import { currentContext } from './requestContext.ts';

export type Logger = winston.Logger;

export type LoggerOptions = {
  readonly level: 'error' | 'warn' | 'info' | 'debug';
  /** `json` in deployed environments (one object per line), `pretty` locally. */
  readonly format: 'pretty' | 'json';
  /** Tests pass `true` so the suite's output stays readable. */
  readonly silent?: boolean;
};

/**
 * Adds the current request's ids to every entry, unless the entry already
 * names them (the access log passes its own). Spread keeps winston's symbol
 * keys, which its transports read.
 */
const requestContextFormat = winston.format((info) => {
  const context = currentContext();

  return context === undefined
    ? info
    : {
        ...info,
        requestId: info.requestId ?? context.requestId,
        userId: info.userId ?? context.userId,
      };
});

const prettyFormat = winston.format.printf(
  ({ timestamp, level, message, requestId, ...meta }) => {
    const id =
      typeof requestId === 'string' ? ` [${requestId.slice(0, 8)}]` : '';
    const extra =
      Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

    return `${String(timestamp)} ${level}${id} ${String(message)}${extra}`;
  },
);

export const createLogger = ({
  level,
  format,
  silent = false,
}: LoggerOptions): Logger =>
  winston.createLogger({
    level,
    silent,
    defaultMeta: { service: 'backend' },
    format: winston.format.combine(
      requestContextFormat(),
      winston.format.timestamp(),
      format === 'json'
        ? winston.format.json()
        : winston.format.combine(winston.format.colorize(), prettyFormat),
    ),
    transports: [new winston.transports.Console()],
  });
