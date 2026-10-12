import { httpErrorBody } from '@waypoint/contracts'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { INTERNAL_API_KEY_HEADER } from './auth/requireService.ts'
import { REQUEST_ID_HEADER } from './requestId.ts'
import { createServiceClient } from './serviceClient.ts'
import { startTestServer, type TestServer } from './testing/httpServer.ts'

const estimateSchema = z.object({ cheapestFlightMinor: z.number().int() })

let servers: TestServer[] = []

const serve = async (listener: Parameters<typeof startTestServer>[0]): Promise<TestServer> => {
  const server = await startTestServer(listener)
  servers = [...servers, server]
  return server
}

afterEach(async () => {
  await Promise.all(servers.map((server) => server.close()))
  servers = []
})

describe('createServiceClient', () => {
  it('parses a success response with the callee contract schema', async () => {
    const server = await serve((_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ cheapestFlightMinor: 12900 }))
    })
    const call = createServiceClient({ service: 'search', baseUrl: server.url })

    const result = await call({ path: '/internal/estimates', schema: estimateSchema })

    expect(result).toEqual({ ok: true, value: { cheapestFlightMinor: 12900 } })
  })

  it('forwards the user token, the request id and the internal key', async () => {
    let seen: Record<string, string | undefined> = {}
    const server = await serve((req, res) => {
      seen = {
        authorization: req.headers.authorization,
        requestId: req.headers[REQUEST_ID_HEADER] as string | undefined,
        internalKey: req.headers[INTERNAL_API_KEY_HEADER] as string | undefined,
        contentType: req.headers['content-type'],
      }
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ cheapestFlightMinor: 1 }))
    })
    const call = createServiceClient({ service: 'search', baseUrl: server.url })

    await call({
      path: '/internal/estimates',
      schema: estimateSchema,
      method: 'POST',
      body: { destinationId: 'lisbon' },
      bearerToken: 'user-token',
      internalApiKey: 'service-key',
      requestId: 'trace-7',
    })

    expect(seen).toEqual({
      authorization: 'Bearer user-token',
      requestId: 'trace-7',
      internalKey: 'service-key',
      contentType: 'application/json',
    })
  })

  it('strips a trailing slash from the base URL instead of calling a double slash', async () => {
    let path: string | undefined
    const server = await serve((req, res) => {
      path = req.url
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ cheapestFlightMinor: 1 }))
    })
    const call = createServiceClient({ service: 'search', baseUrl: `${server.url}/` })

    await call({ path: '/internal/estimates', schema: estimateSchema })

    expect(path).toBe('/internal/estimates')
  })

  it('returns a timeout error rather than hanging the caller', async () => {
    const server = await serve((_req, res) => {
      setTimeout(() => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ cheapestFlightMinor: 1 }))
      }, 500)
    })
    const call = createServiceClient({ service: 'search', baseUrl: server.url, timeoutMs: 50 })

    const result = await call({ path: '/internal/estimates', schema: estimateSchema })

    expect(result).toEqual({
      ok: false,
      error: { type: 'timeout', service: 'search', timeoutMs: 50 },
    })
  })

  it('lets a per-call timeout override the client default', async () => {
    const server = await serve((_req, res) => {
      setTimeout(() => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ cheapestFlightMinor: 1 }))
      }, 500)
    })
    const call = createServiceClient({ service: 'search', baseUrl: server.url, timeoutMs: 5_000 })

    const result = await call({
      path: '/internal/estimates',
      schema: estimateSchema,
      timeoutMs: 40,
    })

    expect(result.ok).toBe(false)
    expect(result.ok ? undefined : result.error.type).toBe('timeout')
  })

  it('returns invalid-response when the body does not match the contract', async () => {
    const server = await serve((_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ cheapestFlightMinor: 'twelve euros' }))
    })
    const call = createServiceClient({ service: 'search', baseUrl: server.url })

    const result = await call({ path: '/internal/estimates', schema: estimateSchema })

    expect(result.ok).toBe(false)
    expect(result.ok ? undefined : result.error.type).toBe('invalid-response')
  })

  it('returns invalid-response when the body is not JSON at all', async () => {
    const server = await serve((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end('<html>gateway page</html>')
    })
    const call = createServiceClient({ service: 'search', baseUrl: server.url })

    const result = await call({ path: '/internal/estimates', schema: estimateSchema })

    expect(result.ok).toBe(false)
    expect(result.ok ? undefined : result.error.type).toBe('invalid-response')
  })

  it('returns the callee error body on a non-2xx response', async () => {
    const server = await serve((_req, res) => {
      res.writeHead(404, { 'content-type': 'application/json' })
      res.end(JSON.stringify(httpErrorBody('not-found', 'No estimate for that destination.')))
    })
    const call = createServiceClient({ service: 'search', baseUrl: server.url })

    const result = await call({ path: '/internal/estimates', schema: estimateSchema })

    expect(result).toEqual({
      ok: false,
      error: {
        type: 'http',
        service: 'search',
        status: 404,
        body: { error: { code: 'not-found', message: 'No estimate for that destination.' } },
      },
    })
  })

  it('still reports the status when the error body is not the shared shape', async () => {
    const server = await serve((_req, res) => {
      res.writeHead(502, { 'content-type': 'text/plain' })
      res.end('Bad Gateway')
    })
    const call = createServiceClient({ service: 'search', baseUrl: server.url })

    const result = await call({ path: '/internal/estimates', schema: estimateSchema })

    expect(result).toEqual({
      ok: false,
      error: { type: 'http', service: 'search', status: 502, body: undefined },
    })
  })

  it('returns unreachable when nothing is listening', async () => {
    const call = createServiceClient({ service: 'planner', baseUrl: 'http://127.0.0.1:1' })

    const result = await call({ path: '/health', schema: estimateSchema })

    expect(result.ok).toBe(false)
    expect(result.ok ? undefined : result.error.type).toBe('unreachable')
  })

  it('accepts an empty body for a route that returns no content', async () => {
    const server = await serve((_req, res) => {
      res.writeHead(204).end()
    })
    const call = createServiceClient({ service: 'trips', baseUrl: server.url })

    const result = await call({
      path: '/trips/1',
      method: 'DELETE',
      schema: z.undefined(),
    })

    expect(result).toEqual({ ok: true, value: undefined })
  })
})
