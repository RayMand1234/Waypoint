import { err, httpErrorBodySchema, ok, type HttpErrorBody, type Result } from '@waypoint/contracts'
import type { z } from 'zod'
import { REQUEST_ID_HEADER } from './requestId.ts'
import { INTERNAL_API_KEY_HEADER } from './auth/requireService.ts'

/** Every way a call to another Waypoint service can fail, as a typed value. */
export type ServiceClientError =
  | { readonly type: 'timeout'; readonly service: string; readonly timeoutMs: number }
  | { readonly type: 'unreachable'; readonly service: string; readonly message: string }
  | {
      readonly type: 'http'
      readonly service: string
      readonly status: number
      readonly body: HttpErrorBody | undefined
    }
  | { readonly type: 'invalid-response'; readonly service: string; readonly message: string }

export type ServiceRequest<Schema extends z.ZodType> = {
  readonly path: string
  /** The callee's own contract schema. The response is parsed with it, never cast. */
  readonly schema: Schema
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  readonly body?: unknown
  readonly timeoutMs?: number
  /** Forwarded when acting on a user's behalf; the callee verifies it itself. */
  readonly bearerToken?: string
  /** Sent instead of a user token when the caller acts for nobody (`jobs`). */
  readonly internalApiKey?: string
  /** Forwarded so one traveler action can be traced across services. */
  readonly requestId?: string
}

export type ServiceClientOptions = {
  /** Used in every error value, so a log says which service was slow or down. */
  readonly service: string
  readonly baseUrl: string
  readonly timeoutMs?: number
  /** Swapped in tests. */
  readonly fetchImpl?: typeof fetch
}

export type ServiceClient = <Schema extends z.ZodType>(
  request: ServiceRequest<Schema>,
) => Promise<Result<z.output<Schema>, ServiceClientError>>

const DEFAULT_TIMEOUT_MS = 3_000

const isTimeout = (error: unknown): boolean =>
  error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const buildHeaders = <Schema extends z.ZodType>(request: ServiceRequest<Schema>): Headers => {
  const headers = new Headers({ accept: 'application/json' })
  if (request.body !== undefined) headers.set('content-type', 'application/json')
  if (request.bearerToken !== undefined) {
    headers.set('authorization', `Bearer ${request.bearerToken}`)
  }
  if (request.internalApiKey !== undefined) {
    headers.set(INTERNAL_API_KEY_HEADER, request.internalApiKey)
  }
  if (request.requestId !== undefined) headers.set(REQUEST_ID_HEADER, request.requestId)
  return headers
}

/** `undefined` for an empty body (a 204), otherwise the parsed JSON. */
const readPayload = async (response: Response): Promise<unknown> => {
  const text = await response.text()
  return text === '' ? undefined : JSON.parse(text)
}

/**
 * The one way a service calls another service: a per-call timeout, the
 * response parsed with the callee's contract schema, and every failure returned
 * as a typed `Result` instead of thrown. A slow or down service degrades the
 * caller; it never crashes it.
 */
export const createServiceClient = ({
  service,
  baseUrl,
  timeoutMs: defaultTimeoutMs = DEFAULT_TIMEOUT_MS,
  fetchImpl = fetch,
}: ServiceClientOptions): ServiceClient => {
  const root = baseUrl.replace(/\/+$/, '')

  return async (request) => {
    const timeoutMs = request.timeoutMs ?? defaultTimeoutMs

    let response: Response
    try {
      response = await fetchImpl(`${root}${request.path}`, {
        method: request.method ?? 'GET',
        headers: buildHeaders(request),
        ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      return isTimeout(error)
        ? err({ type: 'timeout', service, timeoutMs })
        : err({ type: 'unreachable', service, message: messageOf(error) })
    }

    let payload: unknown
    try {
      payload = await readPayload(response)
    } catch (error) {
      return response.ok
        ? err({ type: 'invalid-response', service, message: messageOf(error) })
        : err({ type: 'http', service, status: response.status, body: undefined })
    }

    if (!response.ok) {
      const body = httpErrorBodySchema.safeParse(payload)
      return err({
        type: 'http',
        service,
        status: response.status,
        ...(body.success ? { body: body.data } : { body: undefined }),
      })
    }

    const parsed = request.schema.safeParse(payload)
    return parsed.success
      ? ok(parsed.data)
      : err({ type: 'invalid-response', service, message: parsed.error.message })
  }
}
