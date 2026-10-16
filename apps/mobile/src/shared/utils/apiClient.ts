import { httpErrorBodySchema } from '@waypoint/contracts/common';
import { randomUUID } from 'expo-crypto';
import type { z } from 'zod';
import { getAccessToken } from '../auth/supabase';
import { apiError, type ApiErrorDetails } from './apiError';
import { env } from './env';

const TIMEOUT_MS = 15_000;

export type ApiRequestInit = {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Serialised as JSON. */
  readonly body?: unknown;
};

const readJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (text === '') return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
};

const failureFor = (status: number, body: unknown): ApiErrorDetails => {
  const parsed = httpErrorBodySchema.safeParse(body);
  const code = parsed.success ? parsed.data.error.code : 'unknown';
  const message = parsed.success
    ? parsed.data.error.message
    : `The server answered ${String(status)}.`;

  if (status === 401) return { type: 'unauthorized' };

  if (status === 404) return { type: 'not-found', message };

  return { type: 'http', status, code, message };
};

const isTimeout = (error: unknown): boolean =>
  error instanceof Error && error.name === 'TimeoutError';

/**
 * The only function in the app that calls `fetch`. Sends the signed-in
 * traveler's token and a fresh `x-request-id` (find it in the backend logs),
 * and parses every response with its contract schema — a call returns typed
 * data or throws an `ApiError`, nothing in between.
 */
export const apiRequest = async <Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  init: ApiRequestInit = {},
): Promise<z.output<Schema>> => {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    accept: 'application/json',
    'x-request-id': randomUUID(),
    ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
    ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
  };

  const response = await fetch(`${env.apiUrl.replace(/\/+$/, '')}${path}`, {
    method: init.method ?? 'GET',
    headers,
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch((error: unknown) => {
    throw apiError(
      isTimeout(error)
        ? { type: 'timeout' }
        : {
            type: 'network',
            message: error instanceof Error ? error.message : String(error),
          },
    );
  });

  const body = await readJson(response);

  if (!response.ok) throw apiError(failureFor(response.status, body));

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];

    throw apiError({
      type: 'invalid-response',
      message:
        issue === undefined
          ? 'unreadable'
          : `${issue.path.join('.')}: ${issue.message}`,
    });
  }

  return parsed.data;
};
