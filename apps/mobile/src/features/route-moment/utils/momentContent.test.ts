import { tripDetailSchema, type TripDetail } from '@waypoint/contracts/trips';
import {
  momentContent,
  momentLabels,
  parseFinishedStep,
} from './momentContent';
import { momentPath, momentPointAt, momentPoints } from './momentGeometry';

const trip = (overrides: Record<string, unknown> = {}): TripDetail =>
  tripDetailSchema.parse({
    id: '6f0c6f3a-3c55-4b8e-9a8a-1f1b2c3d4e5f',
    status: 'draft',
    styles: ['views', 'culture', 'food'],
    pace: 'balanced',
    destinationId: 'lisbon',
    destinationName: 'Lisbon',
    startDate: '2027-05-12',
    endDate: '2027-05-16',
    originAirport: 'TLV',
    adults: 2,
    childrenAges: [],
    updatedAt: '2027-04-01T10:00:00.000Z',
    spots: Array.from({ length: 6 }, (_, i) => ({
      spotId: `s${String(i)}`,
      name: `Spot ${String(i)}`,
    })),
    days: [],
    selections: [],
    ...overrides,
  });

describe('momentContent', () => {
  it("says the trip so far in Waypoint's voice", () => {
    expect(momentContent(1, trip()).title).toBe('Views, culture and food.');
    expect(momentContent(2, trip()).title).toBe('Lisbon it is.');
    expect(momentContent(3, trip()).title).toBe('5 days, 6 spots.');
    expect(momentContent(2, trip()).sheetTitle).toBe('Getting to know Lisbon');
  });
});

describe('momentLabels', () => {
  it('marks done, just finished, next stop and the rest', () => {
    const labels = momentLabels(2, trip());

    expect(labels.map((label) => label.state)).toEqual([
      'done',
      'just',
      'target',
      'todo',
      'todo',
      'todo',
      'finish',
    ]);
    expect(labels[1]).toEqual({
      state: 'just',
      top: 'Destination',
      main: 'Lisbon',
    });
    expect(labels[2]).toEqual({
      state: 'target',
      top: 'Next stop',
      main: 'Spots & dates',
    });
    expect(labels[6]?.main).toBe('Book');
  });

  it('heads to the flights after the spots, then the stay, and plans the days last', () => {
    expect(momentLabels(3, trip())[3]?.main).toBe('Flights');
    expect(momentLabels(4, trip())[4]?.main).toBe('Stay');
    expect(momentLabels(5, trip())[5]?.main).toBe('Day plan');
  });
});

describe('parseFinishedStep', () => {
  it('accepts 1–6 only', () => {
    expect(parseFinishedStep('2')).toBe(2);
    expect(parseFinishedStep('7')).toBeUndefined();
    expect(parseFinishedStep(undefined)).toBeUndefined();
  });
});

describe('moment geometry', () => {
  const points = momentPoints({ width: 390, top: 140, spacing: 72 });

  it('matches the design frame: x 130 / 260, 72pt apart', () => {
    expect(points.slice(0, 3)).toEqual([
      { x: 130, y: 140 },
      { x: 260, y: 212 },
      { x: 130, y: 284 },
    ]);
    expect(
      momentPath(points).startsWith('M130 140 C130 176 260 176 260 212'),
    ).toBe(true);
  });

  it('puts checkpoint k at k/6 of the road', () => {
    expect(momentPointAt(points, 2 / 6).y).toBeCloseTo(284);
    expect(momentPointAt(points, 1).x).toBeCloseTo(130);
  });
});
