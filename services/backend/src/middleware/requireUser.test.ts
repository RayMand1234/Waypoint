import express, { type Express } from 'express';
import { generateKeyPair } from 'jose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  captureLogs,
  silentLogger,
  startTestAuth,
  type TestAuth,
} from '../testing/index.ts';
import { requireUser } from './requireUser.ts';

const USER_ID = '7b3f4b1e-0c6a-4b7f-9b0a-2f0f4d1c8a21';

let auth: TestAuth;
let app: Express;

beforeAll(async () => {
  // A key of a different algorithm, served alongside the real one, so a token
  // signed with it proves `algorithms: ['ES256']` is actually enforced and not
  // just incidentally true because the JWKS only ever had one key.
  auth = await startTestAuth({
    extraKeys: [{ kid: 'other-alg-key', alg: 'RS256' }],
  });

  app = express();
  app.get(
    '/whoami',
    requireUser({ supabaseUrl: auth.supabaseUrl, logger: silentLogger() }),
    (_req, res) => {
      res.json({ userId: res.locals.userId });
    },
  );
});

afterAll(async () => {
  await auth.close();
});

describe('requireUser', () => {
  it('verifies the token against the project JWKS and exposes the sub', async () => {
    const response = await request(app)
      .get('/whoami')
      .set('authorization', `Bearer ${await auth.signToken({ sub: USER_ID })}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: USER_ID });
  });

  it('tolerates a trailing slash on the configured Supabase URL', async () => {
    const slashed = express();

    slashed.get(
      '/whoami',
      requireUser({
        supabaseUrl: `${auth.supabaseUrl}/`,
        logger: silentLogger(),
      }),
      (_req, res) => {
        res.json({ userId: res.locals.userId });
      },
    );

    const response = await request(slashed)
      .get('/whoami')
      .set('authorization', `Bearer ${await auth.signToken()}`);

    expect(response.status).toBe(200);
  });

  it('answers 401 with the shared error body when the header is missing', async () => {
    const response = await request(app).get('/whoami');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: { code: 'unauthorized', message: 'Sign in to continue.' },
    });
  });

  it('answers 401 for a token signed with a different key', async () => {
    const other = await generateKeyPair('ES256');
    const response = await request(app)
      .get('/whoami')
      .set(
        'authorization',
        `Bearer ${await auth.signToken({ key: { ...auth.defaultKey, privateKey: other.privateKey } })}`,
      );

    expect(response.status).toBe(401);
  });

  it('answers 401 for a token from another issuer', async () => {
    const response = await request(app)
      .get('/whoami')
      .set(
        'authorization',
        `Bearer ${await auth.signToken({ issuer: 'https://evil.example/auth/v1' })}`,
      );

    expect(response.status).toBe(401);
  });

  it('answers 401 for the wrong audience', async () => {
    const response = await request(app)
      .get('/whoami')
      .set(
        'authorization',
        `Bearer ${await auth.signToken({ audience: 'anon' })}`,
      );

    expect(response.status).toBe(401);
  });

  it('answers 401 for an expired token', async () => {
    const response = await request(app)
      .get('/whoami')
      .set(
        'authorization',
        `Bearer ${await auth.signToken({ expiresIn: '-1s' })}`,
      );

    expect(response.status).toBe(401);
  });

  it('answers 401 for a token with no subject', async () => {
    const response = await request(app)
      .get('/whoami')
      .set('authorization', `Bearer ${await auth.signToken({ sub: null })}`);

    expect(response.status).toBe(401);
  });

  it('answers 401 for a token signed with a different algorithm, even if the JWKS would accept its key', async () => {
    const otherAlgKey = auth.extraKeys.get('other-alg-key');

    if (otherAlgKey === undefined)
      throw new Error('test setup: expected an extra key');

    const response = await request(app)
      .get('/whoami')
      .set(
        'authorization',
        `Bearer ${await auth.signToken({ key: otherAlgKey })}`,
      );

    expect(response.status).toBe(401);
  });

  it('answers 401, not 500, when the JWKS cannot be reached', async () => {
    const offline = express();

    offline.get(
      '/whoami',
      requireUser({
        supabaseUrl: 'http://127.0.0.1:1',
        logger: silentLogger(),
      }),
      (_req, res) => {
        res.json({ userId: res.locals.userId });
      },
    );

    const response = await request(offline)
      .get('/whoami')
      .set('authorization', `Bearer ${await auth.signToken()}`);

    expect(response.status).toBe(401);
  });

  it('reports a JWKS outage, since that is an infra problem, not a bad token', async () => {
    const logs = captureLogs();
    const offline = express();

    offline.get(
      '/whoami',
      requireUser({ supabaseUrl: 'http://127.0.0.1:1', logger: logs.logger }),
      (_req, res) => {
        res.json({ userId: res.locals.userId });
      },
    );

    const response = await request(offline)
      .get('/whoami')
      .set('authorization', `Bearer ${await auth.signToken()}`);

    expect(response.status).toBe(401);
    expect(logs.lines().filter((line) => line.level === 'error')).toHaveLength(
      1,
    );
  });

  it('does not report an ordinary expired token — that is the caller, not an outage', async () => {
    const logs = captureLogs();
    const reported = express();

    reported.get(
      '/whoami',
      requireUser({ supabaseUrl: auth.supabaseUrl, logger: logs.logger }),
      (_req, res) => {
        res.json({ userId: res.locals.userId });
      },
    );

    const response = await request(reported)
      .get('/whoami')
      .set(
        'authorization',
        `Bearer ${await auth.signToken({ expiresIn: '-1s' })}`,
      );

    expect(response.status).toBe(401);
    expect(logs.lines()).toEqual([]);
  });
});
