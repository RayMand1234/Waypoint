import { tripListItemSchema } from '@waypoint/contracts/trips';
import { bentoLayout } from './bentoLayout';
import { heroBackdrop } from './heroBackdrop';
import {
  inspirationLine,
  inspirationTitle,
  stylesToSuggest,
} from './inspiration';
import { toStamp } from './stampModel';
import { typedParts, typingDelay } from './typewriter';

describe('bentoLayout', () => {
  it('lays four places out as a wide tile, then a tall one beside two squares', () => {
    expect(bentoLayout(['a', 'b', 'c', 'd'])).toEqual([
      { kind: 'wide', tile: 'a' },
      { kind: 'cluster', tall: 'b', squares: ['c', 'd'] },
    ]);
  });

  it('repeats the pattern, and fills a short last block', () => {
    expect(bentoLayout(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toEqual([
      { kind: 'wide', tile: 'a' },
      { kind: 'cluster', tall: 'b', squares: ['c', 'd'] },
      { kind: 'wide', tile: 'e' },
      { kind: 'pair', tiles: ['f', 'g'] },
    ]);
    expect(bentoLayout(['a', 'b'])).toEqual([
      { kind: 'pair', tiles: ['a', 'b'] },
    ]);
    expect(bentoLayout(['a'])).toEqual([{ kind: 'wide', tile: 'a' }]);
    expect(bentoLayout([])).toEqual([]);
  });
});

describe('inspiration copy', () => {
  it('names the season of the month', () => {
    expect(inspirationTitle(0)).toBe('Worth the trip this winter');
    expect(inspirationTitle(9)).toBe('Worth the trip this autumn');
    expect(inspirationTitle(6)).toBe('Worth the trip this summer');
  });

  it('suggests for the latest trip that has styles', () => {
    expect(
      stylesToSuggest([{ styles: [] }, { styles: ['views', 'food'] }]),
    ).toEqual(['views', 'food']);
    expect(stylesToSuggest([])).toEqual([]);
  });

  it('says which styles the places were picked for', () => {
    expect(inspirationLine(['views', 'food', 'culture'])).toBe(
      'Picked for your styles: views, food and culture',
    );
    expect(inspirationLine([])).toBe('A few places we love right now');
  });
});

describe('toStamp', () => {
  it('stamps a past trip with its city and when it began', () => {
    const trip = tripListItemSchema.parse({
      id: '6f0c6f3a-3c55-4b8e-9a8a-1f1b2c3d4e5f',
      status: 'past',
      styles: [],
      pace: 'balanced',
      destinationId: 'paris',
      destinationName: 'Paris',
      startDate: '2026-11-02',
      endDate: '2026-11-06',
      adults: 2,
      originAirport: null,
      childrenAges: [],
      updatedAt: '2026-05-07T10:00:00.000Z',
      planDays: 4,
      selections: [],
      destinationPhoto: null,
    });

    expect(toStamp(trip)).toMatchObject({ city: 'Paris', when: 'Nov 2026' });
  });
});

describe('heroBackdrop', () => {
  const photo = {
    url: 'https://upload.wikimedia.org/a.jpg',
    author: 'Ann',
    license: 'CC BY 4.0',
    licenseUrl: null,
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:a.jpg',
  };

  it("shows the next trip's place, else a suggested one, else none", () => {
    expect(
      heroBackdrop(
        [
          { destinationName: null, destinationPhoto: null },
          { destinationName: 'Lisbon', destinationPhoto: photo },
        ],
        [{ name: 'Kyoto', photo }],
      ),
    ).toEqual({ place: 'Lisbon', photo });
    expect(heroBackdrop([], [{ name: 'Kyoto', photo }])).toEqual({
      place: 'Kyoto',
      photo,
    });
    expect(heroBackdrop([], [{ name: 'Kyoto', photo: null }])).toBeNull();
  });
});

describe('typewriter', () => {
  const segments = [
    { text: 'Where to\n', color: 'on-midnight' },
    { text: 'next?', color: 'sunshine-400' },
  ] as const;

  it('splits each colour run at the typing point', () => {
    expect(typedParts(segments, 3)).toEqual([
      { shown: 'Whe', hidden: 're to\n', color: 'on-midnight' },
      { shown: '', hidden: 'next?', color: 'sunshine-400' },
    ]);
    expect(typedParts(segments, 11).map((part) => part.shown)).toEqual([
      'Where to\n',
      'ne',
    ]);
    expect(typedParts(segments, 99).every((part) => part.hidden === '')).toBe(
      true,
    );
  });

  it('pauses a beat longer at a line break', () => {
    const pace = { perChar: 75, lineBreak: 280 };

    expect(typingDelay('a', pace)).toBe(75);
    expect(typingDelay('\n', pace)).toBe(280);
  });
});
