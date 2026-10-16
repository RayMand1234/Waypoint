import { err, ok, type Result } from '@waypoint/contracts/common';
import { describe, expect, it } from 'vitest';
import { silentLogger } from '../testing/index.ts';
import { searchAcross } from './searchAcross.ts';
import type { ProviderFailure } from './types.ts';

type Fake = {
  readonly id: 'liteapi';
  readonly answer: () => Promise<Result<readonly string[], ProviderFailure>>;
};

const run = (providers: Fake[]) =>
  searchAcross({
    providers,
    call: (provider) => provider.answer(),
    timeoutMs: 1000,
    logger: silentLogger(),
  });

describe('searchAcross', () => {
  it('keeps offers from sources that answered and reports the ones that failed', async () => {
    const outcome = await run([
      { id: 'liteapi', answer: () => Promise.resolve(ok(['a', 'b'])) },
      {
        id: 'liteapi',
        answer: () =>
          Promise.resolve(err<ProviderFailure>({ type: 'timeout' })),
      },
    ]);

    expect(outcome.offers).toEqual(['a', 'b']);
    expect(outcome.errors).toEqual([
      {
        provider: 'liteapi',
        type: 'timeout',
        message: 'liteapi took too long to answer.',
      },
    ]);
  });

  it('survives a provider that throws', async () => {
    const outcome = await run([
      { id: 'liteapi', answer: () => Promise.reject(new Error('bug')) },
    ]);

    expect(outcome.offers).toEqual([]);
    expect(outcome.errors[0]?.type).toBe('unavailable');
  });
});
