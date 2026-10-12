import express, { type Express } from 'express'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { ErrorReporter } from '../errors.ts'
import { startTestServer, type TestServer } from '../testing/httpServer.ts'
import { requireUser } from './requireUser.ts'

// A locally generated ES256 key pair, with the public half served as a JWKS the
// way a Supabase project serves it. Nothing here talks to Supabase.

const KID = 'test-signing-key'
const USER_ID = '7b3f4b1e-0c6a-4b7f-9b0a-2f0f4d1c8a21'

let keys: Awaited<ReturnType<typeof generateKeyPair>>
let otherAlgKeys: Awaited<ReturnType<typeof generateKeyPair>>
let jwks: TestServer
let supabaseUrl: string
let app: Express

const signToken = async ({
  sub,
  issuer = `${supabaseUrl}/auth/v1`,
  audience = 'authenticated',
  expiresIn = '1h',
  alg = 'ES256',
  kid = KID,
  signingKey = keys.privateKey,
}: {
  /** `null` omits the subject claim entirely, for the "no subject" case. */
  sub?: string | null
  issuer?: string
  audience?: string
  expiresIn?: string | number
  alg?: string
  kid?: string
  signingKey?: CryptoKey
} = {}): Promise<string> => {
  const builder = new SignJWT({})
    .setProtectedHeader({ alg, kid })
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
  if (sub !== null) builder.setSubject(sub ?? USER_ID)
  return builder.sign(signingKey)
}

beforeAll(async () => {
  keys = await generateKeyPair('ES256')
  // A key of a different algorithm, served alongside the real one, so a token
  // signed with it proves `algorithms: ['ES256']` is actually enforced and not
  // just incidentally true because the JWKS only ever had one key.
  otherAlgKeys = await generateKeyPair('RS256')
  const publicJwk = { ...(await exportJWK(keys.publicKey)), alg: 'ES256', kid: KID, use: 'sig' }
  const otherAlgPublicJwk = {
    ...(await exportJWK(otherAlgKeys.publicKey)),
    alg: 'RS256',
    kid: 'other-alg-key',
    use: 'sig',
  }

  jwks = await startTestServer((req, res) => {
    if (req.url !== '/auth/v1/.well-known/jwks.json') {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ keys: [publicJwk, otherAlgPublicJwk] }))
  })
  supabaseUrl = jwks.url

  app = express()
  app.get('/whoami', requireUser({ supabaseUrl }), (_req, res) => {
    res.json({ userId: res.locals.userId })
  })
})

afterAll(async () => {
  await jwks.close()
})

describe('requireUser', () => {
  it('verifies the token against the project JWKS and exposes the sub', async () => {
    const response = await request(app)
      .get('/whoami')
      .set('authorization', `Bearer ${await signToken()}`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ userId: USER_ID })
  })

  it('tolerates a trailing slash on the configured Supabase URL', async () => {
    const slashed = express()
    slashed.get('/whoami', requireUser({ supabaseUrl: `${supabaseUrl}/` }), (_req, res) => {
      res.json({ userId: res.locals.userId })
    })

    const response = await request(slashed)
      .get('/whoami')
      .set('authorization', `Bearer ${await signToken()}`)

    expect(response.status).toBe(200)
  })

  it('answers 401 with the shared error body when the header is missing', async () => {
    const response = await request(app).get('/whoami')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      error: { code: 'unauthorized', message: 'Sign in to continue.' },
    })
  })

  it('answers 401 for a token signed with a different key', async () => {
    const other = await generateKeyPair('ES256')
    const response = await request(app)
      .get('/whoami')
      .set('authorization', `Bearer ${await signToken({ signingKey: other.privateKey })}`)

    expect(response.status).toBe(401)
  })

  it('answers 401 for a token from another issuer', async () => {
    const response = await request(app)
      .get('/whoami')
      .set('authorization', `Bearer ${await signToken({ issuer: 'https://evil.example/auth/v1' })}`)

    expect(response.status).toBe(401)
  })

  it('answers 401 for the wrong audience', async () => {
    const response = await request(app)
      .get('/whoami')
      .set('authorization', `Bearer ${await signToken({ audience: 'anon' })}`)

    expect(response.status).toBe(401)
  })

  it('answers 401 for an expired token', async () => {
    const response = await request(app)
      .get('/whoami')
      .set('authorization', `Bearer ${await signToken({ expiresIn: '-1s' })}`)

    expect(response.status).toBe(401)
  })

  it('answers 401 for a token with no subject', async () => {
    const response = await request(app)
      .get('/whoami')
      .set('authorization', `Bearer ${await signToken({ sub: null })}`)

    expect(response.status).toBe(401)
  })

  it('answers 401 for a token signed with a different algorithm, even if the JWKS would accept its key', async () => {
    const response = await request(app)
      .get('/whoami')
      .set(
        'authorization',
        `Bearer ${await signToken({
          alg: 'RS256',
          kid: 'other-alg-key',
          signingKey: otherAlgKeys.privateKey,
        })}`,
      )

    expect(response.status).toBe(401)
  })

  it('answers 401, not 500, when the JWKS cannot be reached', async () => {
    const offline = express()
    offline.get('/whoami', requireUser({ supabaseUrl: 'http://127.0.0.1:1' }), (_req, res) => {
      res.json({ userId: res.locals.userId })
    })

    const response = await request(offline)
      .get('/whoami')
      .set('authorization', `Bearer ${await signToken()}`)

    expect(response.status).toBe(401)
  })

  it('reports a JWKS outage, since that is an infra problem, not a bad token', async () => {
    const report = vi.fn<ErrorReporter>()
    const offline = express()
    offline.get(
      '/whoami',
      requireUser({ supabaseUrl: 'http://127.0.0.1:1', report }),
      (_req, res) => {
        res.json({ userId: res.locals.userId })
      },
    )

    const response = await request(offline)
      .get('/whoami')
      .set('authorization', `Bearer ${await signToken()}`)

    expect(response.status).toBe(401)
    expect(report).toHaveBeenCalledTimes(1)
  })

  it('does not report an ordinary expired token — that is the caller, not an outage', async () => {
    const report = vi.fn<ErrorReporter>()
    const reported = express()
    reported.get('/whoami', requireUser({ supabaseUrl, report }), (_req, res) => {
      res.json({ userId: res.locals.userId })
    })

    const response = await request(reported)
      .get('/whoami')
      .set('authorization', `Bearer ${await signToken({ expiresIn: '-1s' })}`)

    expect(response.status).toBe(401)
    expect(report).not.toHaveBeenCalled()
  })
})
