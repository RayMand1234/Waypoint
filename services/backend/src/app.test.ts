import { err, httpErrorBodySchema, ok } from '@waypoint/contracts/common';
import { tripSchema } from '@waypoint/contracts/trips';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from './app.ts';
import { requireUser } from './middleware/requireUser.ts';
import type { Logger } from './observability/logger.ts';
import type { Services } from './routes/index.ts';
import { captureLogs, startTestAuth, type TestAuth } from './testing/index.ts';

const USER_ID = '7b3f4b1e-0c6a-4b7f-9b0a-2f0f4d1c8a21';
const TRIP_ID = '6f0c6f3a-3c55-4b8e-9a8a-1f1b2c3d4e5f';

const sampleTrip = tripSchema.parse({
  id: TRIP_ID,
  status: 'draft',
  styles: ['food'],
  pace: 'balanced',
  destinationId: null,
  destinationName: null,
  startDate: null,
  endDate: null,
  originAirport: 'TLV',
  adults: 2,
  childrenAges: [],
  updatedAt: '2027-04-01T10:00:00.000Z',
});

const sampleListItem = { ...sampleTrip, planDays: 0, selections: [] };

const unused = () => Promise.reject(new Error('not used in this test'));

const fakeServices = (logger: Logger) => {
  const services = {
    profiles: { me: vi.fn(unused), update: vi.fn(unused) },
    geo: {
      countries: vi.fn(() =>
        Promise.resolve(
          err({
            type: 'upstream-timeout' as const,
            provider: 'liteapi' as const,
          }),
        ),
      ),
      cities: vi.fn(unused),
      cityPrices: vi.fn(unused),
      searchPlaces: vi.fn(unused),
      place: vi.fn(unused),
      airports: vi.fn(unused),
    },
    destinations: {
      list: vi.fn(() => Promise.resolve(ok({ destinations: [] }))),
      add: vi.fn(unused),
      get: vi.fn(unused),
      spots: vi.fn(unused),
      spot: vi.fn(unused),
      rating: vi.fn(unused),
    },
    hotels: {
      list: vi.fn(unused),
      detail: vi.fn(unused),
      search: vi.fn(() => Promise.resolve(ok({ offers: [], errors: [] }))),
    },
    flights: {
      search: vi.fn(() =>
        Promise.reject(new Error('bug in the flights service')),
      ),
    },
    trips: {
      list: vi.fn(() => {
        logger.info('listing trips');

        return Promise.resolve(ok({ trips: [sampleListItem] }));
      }),
      get: vi.fn(() =>
        Promise.resolve(
          err({
            type: 'not-found' as const,
            message: 'We have no trip with that id.',
          }),
        ),
      ),
      create: vi.fn(() => Promise.resolve(ok(sampleTrip))),
      update: vi.fn(unused),
      remove: vi.fn(unused),
      putPlan: vi.fn(unused),
      putSelection: vi.fn(unused),
      setBooked: vi.fn(unused),
    },
  } satisfies Services;

  return services;
};

let auth: TestAuth;
let app: Express;
let services: ReturnType<typeof fakeServices>;
let logs: ReturnType<typeof captureLogs>;
let token: string;

beforeAll(async () => {
  auth = await startTestAuth();
  logs = captureLogs();
  services = fakeServices(logs.logger);
  app = createApp({
    services,
    requireUser: requireUser({
      supabaseUrl: auth.supabaseUrl,
      logger: logs.logger,
    }),
    logger: logs.logger,
    now: () => new Date('2027-04-01T10:00:00.000Z'),
  });
  token = await auth.signToken({ sub: USER_ID });
});

afterAll(async () => {
  await auth.close();
});

const authed = (test: request.Test): request.Test =>
  test.set('authorization', `Bearer ${token}`);
const errorCode = (body: unknown): string =>
  httpErrorBodySchema.parse(body).error.code;

describe('public routes', () => {
  it('answers /health without a token and gives every response a request id', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      time: '2027-04-01T10:00:00.000Z',
    });
    expect(response.headers['x-request-id']).toMatch(/^[\w-]{36}$/);
  });
});

describe('auth', () => {
  it('refuses API routes without a token', async () => {
    const response = await request(app).get('/trips');

    expect(response.status).toBe(401);
    expect(errorCode(response.body)).toBe('unauthorized');
    expect(services.trips.list).not.toHaveBeenCalled();
  });

  it('hands the service the user id from the verified token', async () => {
    const response = await authed(request(app).get('/trips'));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ trips: [sampleListItem] });
    expect(services.trips.list).toHaveBeenCalledWith(USER_ID);
  });

  it('rejects a user id smuggled in the body (request bodies are strict)', async () => {
    const response = await authed(request(app).post('/trips')).send({
      userId: 'someone-else',
    });

    expect(response.status).toBe(400);
    expect(services.trips.create).not.toHaveBeenCalled();
  });
});

describe('tracing', () => {
  it('reuses the caller’s request id and stamps it, with the user, on every log line of that request', async () => {
    const requestId = 'app-tap-0001-abcdef';

    const response = await authed(
      request(app).get('/trips').set('x-request-id', requestId),
    );
    const lines = logs.lines().filter((line) => line.requestId === requestId);

    expect(response.headers['x-request-id']).toBe(requestId);
    expect(
      lines.find((line) => line.message === 'listing trips'),
    ).toMatchObject({ requestId, userId: USER_ID });
    expect(lines.find((line) => line.message === 'http request')).toMatchObject(
      {
        requestId,
        userId: USER_ID,
        method: 'GET',
        route: '/trips',
        status: 200,
      },
    );
  });

  it('replaces a malformed incoming request id', async () => {
    const response = await request(app)
      .get('/health')
      .set('x-request-id', 'id with spaces <x>');

    expect(response.headers['x-request-id']).toMatch(/^[\w-]{36}$/);
  });
});

describe('input and error mapping', () => {
  it('creates with contract defaults and answers 201', async () => {
    const response = await authed(request(app).post('/trips')).send({
      styles: ['food'],
    });

    expect(response.status).toBe(201);
    expect(services.trips.create).toHaveBeenCalledWith(USER_ID, {
      styles: ['food'],
      pace: 'balanced',
      adults: 2,
      childrenAges: [],
      originAirport: null,
    });
  });

  it('answers 400 for a bad path param before reaching the service', async () => {
    const response = await authed(request(app).get('/trips/not-a-uuid'));

    expect(response.status).toBe(400);
    expect(errorCode(response.body)).toBe('invalid-request');
  });

  it('maps not-found to 404 and a provider timeout to 504', async () => {
    const missing = await authed(request(app).get(`/trips/${TRIP_ID}`));
    const slow = await authed(request(app).get('/countries'));

    expect(missing.status).toBe(404);
    expect(errorCode(missing.body)).toBe('not-found');
    expect(slow.status).toBe(504);
    expect(errorCode(slow.body)).toBe('upstream-timeout');
  });

  it('validates a hotel search and fills its defaults', async () => {
    const response = await authed(request(app).post('/hotels/search')).send({
      location: { type: 'city', countryCode: 'pt', cityName: 'Lisbon' },
      checkin: '2027-05-12',
      checkout: '2027-05-16',
    });
    const badDates = await authed(request(app).post('/hotels/search')).send({
      location: { type: 'place', placeId: 'ChIJ-lisbon' },
      checkin: '2027-05-16',
      checkout: '2027-05-12',
    });

    expect(response.status).toBe(200);
    expect(services.hotels.search).toHaveBeenCalledWith(
      expect.objectContaining({
        adults: 2,
        currency: 'EUR',
        guestNationality: 'US',
      }),
    );
    expect(badDates.status).toBe(400);
  });

  it('answers 400 for a body that is not JSON', async () => {
    const response = await authed(request(app).post('/trips'))
      .set('content-type', 'application/json')
      .send('{not json');

    expect(response.status).toBe(400);
  });

  it('turns an unexpected throw into a 500 that leaks nothing, and logs it', async () => {
    const response = await authed(request(app).post('/flights/search')).send({
      origin: 'TLV',
      destination: 'LIS',
      departDate: '2027-05-12',
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: 'internal-error',
        message: 'Something went wrong on our side.',
      },
    });
    expect(
      logs.lines().some((line) => line.message === 'unhandled error'),
    ).toBe(true);
  });

  it('reads trip styles from a comma-separated query and refuses unknown ones', async () => {
    const response = await authed(
      request(app).get('/destinations?styles=food,views'),
    );
    const bad = await authed(
      request(app).get('/destinations?styles=food,shopping'),
    );

    expect(response.status).toBe(200);
    expect(services.destinations.list).toHaveBeenCalledWith({
      styles: ['food', 'views'],
    });
    expect(bad.status).toBe(400);
    expect(errorCode(bad.body)).toBe('invalid-request');
  });

  it('answers 404 for an unknown path once signed in', async () => {
    const response = await authed(request(app).get('/nope'));

    expect(response.status).toBe(404);
  });
});
