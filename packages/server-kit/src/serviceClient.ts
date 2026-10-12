import {
  err,
  httpErrorBodySchema,
  ok,
  type HttpErrorBody,
  type Result,
  type ServiceName,
} from '@waypoint/contracts/common'
import { z } from 'zod'
import { INTERNAL_API_KEY_HEADER } from './auth/requireService.ts'
import { REQUEST_ID_HEADER } from './requestId.ts'
import { stripTrailingSlash } from './url.ts'

/**
 * What came back on a non-2xx response, as a closed set of outcomes instead of
 * one optional field collapsing three different causes into the same
 * `undefined`: no body at all, a body that wasn't JSON, JSON that wasn't the
 * shared error shape, and a body that was. Only the last gives a caller
 * anything to act on; the other three are equally "the callee told us
 * nothing useful", but a log can still tell them apart.
 */
export type ServiceErrorBody =
  | { readonly kind: 'none' }
  | { readonly kind: 'unparseable' }
  | { readonly kind: 'unrecognized'; readonly raw: unknown }
  | { readonly kind: 'recognized'; readonly body: HttpErrorBody }

/** Every way a call to another Waypoint service can fail, as a typed value. */
export type ServiceClientError =
  | { readonly type: 'timeout'; readonly service: ServiceName; readonly timeoutMs: number }
  | { readonly type: 'unreachable'; readonly service: ServiceName; readonly message: string }
  | {
      readonly type: 'http'
      readonly service: ServiceName
      readonly status: number
      readonly errorBody: ServiceErrorBody
    }
  | { readonly type: 'invalid-response'; readonly service: ServiceName; readonly message: string }

/** Every route this client calls starts with a slash, so `${root}${path}` never doubles or drops one. */
export type ServicePath = `/${string}`

export type ServiceRequest<Schema extends z.ZodType> = {
  readonly path: ServicePath
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
  readonly service: ServiceName
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

type FetchFailure =
  { readonly type: 'timeout' } | { readonly type: 'unreachable'; readonly message: string }

/** Isolates the one network call, as a `Result` rather than a `try`/`catch` the caller has to unwrap. */
const tryFetch = async (
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
): Promise<Result<Response, FetchFailure>> => {
  try {
    return ok(await fetchImpl(url, init))
  } catch (error) {
    return isTimeout(error)
      ? err({ type: 'timeout' })
      : err({ type: 'unreachable', message: messageOf(error) })
  }
}

/** `undefined` for an empty body (a 204), otherwise the parsed JSON — as a `Result`, never a thrown value. */
const tryReadPayload = async (response: Response): Promise<Result<unknown, string>> => {
  try {
    const text = await response.text()
    return ok(text === '' ? undefined : JSON.parse(text))
  } catch (error) {
    return err(messageOf(error))
  }
}

const toServiceErrorBody = (payload: Result<unknown, string>): ServiceErrorBody => {
  if (!payload.ok) return { kind: 'unparseable' }
  if (payload.value === undefined) return { kind: 'none' }

  const parsed = httpErrorBodySchema.safeParse(payload.value)
  return parsed.success
    ? { kind: 'recognized', body: parsed.data }
    : { kind: 'unrecognized', raw: payload.value }
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
  // Fails at construction, not on the first request, if the base URL is malformed.
  const root = stripTrailingSlash(z.url().parse(baseUrl))

  return async (request) => {
    const timeoutMs = request.timeoutMs ?? defaultTimeoutMs

    const fetched = await tryFetch(fetchImpl, `${root}${request.path}`, {
      method: request.method ?? 'GET',
      headers: buildHeaders(request),
      ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!fetched.ok) {
      return fetched.error.type === 'timeout'
        ? err({ type: 'timeout', service, timeoutMs })
        : err({ type: 'unreachable', service, message: fetched.error.message })
    }
    const response = fetched.value

    const payload = await tryReadPayload(response)

    if (!response.ok) {
      return err({
        type: 'http',
        service,
        status: response.status,
        errorBody: toServiceErrorBody(payload),
      })
    }

    if (!payload.ok) {
      return err({ type: 'invalid-response', service, message: payload.error })
    }

    const parsed = request.schema.safeParse(payload.value)
    return parsed.success
      ? ok(parsed.data)
      : err({ type: 'invalid-response', service, message: parsed.error.message })
  }
}
