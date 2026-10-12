import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { startTestServer, type TestServer } from './httpServer.ts'

export type TestAuthKey = {
  readonly kid: string
  readonly alg: string
  readonly privateKey: CryptoKey
}

export type SignTestTokenOptions = {
  /** `null` omits the subject claim entirely, for a "no subject" case. Defaults to a fixed test UUID. */
  readonly sub?: string | null
  readonly issuer?: string
  readonly audience?: string
  readonly expiresIn?: string | number
  /** Signs with a different registered key — e.g. the alg-confusion case in `requireUser.test.ts`. */
  readonly key?: TestAuthKey
}

export type TestAuth = {
  readonly supabaseUrl: string
  /** The ES256 key most tokens are signed with. */
  readonly defaultKey: TestAuthKey
  /** Any extra keys passed to `startTestAuth`, by the `kid` given for each. */
  readonly extraKeys: ReadonlyMap<string, TestAuthKey>
  readonly signToken: (options?: SignTestTokenOptions) => Promise<string>
  readonly close: () => Promise<void>
}

const DEFAULT_SUBJECT = '00000000-0000-4000-8000-000000000000'

/**
 * Starts a JWKS server backed by one or more locally generated key pairs, the
 * way a Supabase project serves its own ES256 keys — so `requireUser` can be
 * tested against a real JWKS over real HTTP, with no call to Supabase.
 */
export const startTestAuth = async (
  options: {
    /** Extra keys served in the same JWKS, e.g. to test algorithm restriction. */
    readonly extraKeys?: readonly { readonly kid: string; readonly alg: string }[]
  } = {},
): Promise<TestAuth> => {
  const defaultPair = await generateKeyPair('ES256')
  const defaultKey: TestAuthKey = { kid: 'test-signing-key', alg: 'ES256', privateKey: defaultPair.privateKey }
  const defaultJwk = { ...(await exportJWK(defaultPair.publicKey)), alg: defaultKey.alg, kid: defaultKey.kid, use: 'sig' }

  const extra = await Promise.all(
    (options.extraKeys ?? []).map(async ({ kid, alg }) => {
      const pair = await generateKeyPair(alg)
      const key: TestAuthKey = { kid, alg, privateKey: pair.privateKey }
      const jwk = { ...(await exportJWK(pair.publicKey)), alg, kid, use: 'sig' }
      return { key, jwk }
    }),
  )

  const jwks: TestServer = await startTestServer((req, res) => {
    if (req.url !== '/auth/v1/.well-known/jwks.json') {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ keys: [defaultJwk, ...extra.map((e) => e.jwk)] }))
  })

  const supabaseUrl = jwks.url

  const signToken = async ({
    sub,
    issuer = `${supabaseUrl}/auth/v1`,
    audience = 'authenticated',
    expiresIn = '1h',
    key = defaultKey,
  }: SignTestTokenOptions = {}): Promise<string> => {
    const builder = new SignJWT({})
      .setProtectedHeader({ alg: key.alg, kid: key.kid })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(expiresIn)
    if (sub !== null) builder.setSubject(sub ?? DEFAULT_SUBJECT)
    return builder.sign(key.privateKey)
  }

  return {
    supabaseUrl,
    defaultKey,
    extraKeys: new Map(extra.map((e) => [e.key.kid, e.key])),
    signToken,
    close: jwks.close,
  }
}
