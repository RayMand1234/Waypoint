import { z } from 'zod';
import { apiRequest } from './apiClient';
import { isApiError } from './apiError';

jest.mock('../auth/supabase', () => ({
  getAccessToken: jest.fn(() => Promise.resolve('test-token')),
}));
jest.mock('./env', () => ({ env: { apiUrl: 'http://api.test/' } }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'request-id-1' }));

const respond = (status: number, body: unknown) =>
  jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => {
  jest.restoreAllMocks();
});

const schema = z.object({ trips: z.array(z.string()) });

const failureOf = async (promise: Promise<unknown>): Promise<unknown> => {
  try {
    await promise;
  } catch (error) {
    return isApiError(error) ? error.details : error;
  }

  throw new Error('expected a failure');
};

describe('apiRequest', () => {
  it('sends the token, a request id and JSON, and returns the parsed body', async () => {
    const fetchMock = respond(200, { trips: ['a'] });

    await expect(
      apiRequest('/trips', schema, { method: 'POST', body: { a: 1 } }),
    ).resolves.toEqual({ trips: ['a'] });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    const headers = new Headers(init?.headers);

    expect(url).toBe('http://api.test/trips');
    expect(headers.get('authorization')).toBe('Bearer test-token');
    expect(headers.get('x-request-id')).toBe('request-id-1');
    expect(init?.body).toBe('{"a":1}');
  });

  it('turns the backend error body into a typed failure', async () => {
    respond(409, {
      error: {
        code: 'conflict',
        message: "A trip can't go from draft to booked.",
      },
    });

    await expect(failureOf(apiRequest('/trips/1', schema))).resolves.toEqual({
      type: 'http',
      status: 409,
      code: 'conflict',
      message: "A trip can't go from draft to booked.",
    });
  });

  it('maps 401 and 404 to their own failures', async () => {
    respond(401, {});
    await expect(failureOf(apiRequest('/trips', schema))).resolves.toEqual({
      type: 'unauthorized',
    });

    respond(404, {
      error: { code: 'not-found', message: 'We have no trip with that id.' },
    });
    await expect(failureOf(apiRequest('/trips/x', schema))).resolves.toEqual({
      type: 'not-found',
      message: 'We have no trip with that id.',
    });
  });

  it('refuses a response that does not match the contract', async () => {
    respond(200, { trips: [1] });

    await expect(
      failureOf(apiRequest('/trips', schema)),
    ).resolves.toMatchObject({ type: 'invalid-response' });
  });

  it('reports a network failure as such', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new TypeError('Network request failed'));

    await expect(failureOf(apiRequest('/trips', schema))).resolves.toEqual({
      type: 'network',
      message: 'Network request failed',
    });
  });
});
