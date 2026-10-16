export type SerializedError = {
  readonly name: string;
  readonly message: string;
  readonly stack?: string;
  readonly cause?: SerializedError | string;
};

/**
 * An `Error` turned into plain data a log line can hold. `JSON.stringify` on
 * an `Error` gives `{}`, which is how stack traces silently go missing.
 */
export const serializeError = (error: unknown): SerializedError | string => {
  if (!(error instanceof Error)) return String(error);

  const base = {
    name: error.name,
    message: error.message,
    ...(error.stack === undefined ? {} : { stack: error.stack }),
  };

  return error.cause === undefined
    ? base
    : { ...base, cause: serializeError(error.cause) };
};
