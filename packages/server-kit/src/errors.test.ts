import express, { type Express } from 'express'
import request from 'supertest'
import { describe, expect, it, vi, type Mock } from 'vitest'
import { errorHandler, notFound, type ErrorReporter } from './errors.ts'
import { requestId } from './requestId.ts'

const appThatThrows = (report: Mock<ErrorReporter>): Express => {
  const app = express()
  app.use(requestId())
  app.get('/boom', () => {
    throw new Error('invariant broken')
  })
  app.get('/boom-async', async () => {
    await Promise.resolve()
    throw new Error('invariant broken later')
  })
  app.use(notFound)
  app.use(errorHandler({ report }))
  return app
}

describe('notFound', () => {
  it('answers 404 with the shared error body', async () => {
    const response = await request(appThatThrows(vi.fn<ErrorReporter>())).get('/nowhere')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: 'not-found', message: 'No route matches this request.' },
    })
  })
})

describe('errorHandler', () => {
  it('turns a thrown programmer error into a 500 that leaks nothing', async () => {
    const report = vi.fn<ErrorReporter>()
    const response = await request(appThatThrows(report)).get('/boom')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      error: { code: 'internal-error', message: 'Something went wrong on our side.' },
    })
    expect(JSON.stringify(response.body)).not.toContain('invariant broken')
  })

  it('reports the error with the request id, so one action can be traced', async () => {
    const report = vi.fn<ErrorReporter>()
    await request(appThatThrows(report)).get('/boom').set('x-request-id', 'trace-500')

    expect(report).toHaveBeenCalledTimes(1)
    expect(report.mock.calls[0]?.[1]).toEqual({ requestId: 'trace-500' })
  })

  it('catches a rejected async handler too', async () => {
    const report = vi.fn<ErrorReporter>()
    const response = await request(appThatThrows(report)).get('/boom-async')

    expect(response.status).toBe(500)
    expect(report).toHaveBeenCalledTimes(1)
  })
})
