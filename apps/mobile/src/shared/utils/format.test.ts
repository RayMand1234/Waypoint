import {
  formatDateRange,
  formatMoney,
  formatParty,
  formatTravelers,
} from './format';

describe('formatMoney', () => {
  it('shows currency, a thin space and whole units with grouping', () => {
    expect(formatMoney({ amountMinor: 119_000, currency: 'EUR' })).toBe(
      '€ 1,190',
    );
    expect(formatMoney({ amountMinor: 18_950, currency: 'USD' })).toBe('$ 190');
  });
});

describe('formatDateRange', () => {
  it('writes the month once inside one month', () => {
    expect(formatDateRange('2027-05-12', '2027-05-16')).toBe('12–16 May');
  });

  it('writes both months across a month boundary', () => {
    expect(formatDateRange('2027-04-28', '2027-05-03')).toBe('28 Apr – 3 May');
  });
});

describe('formatTravelers', () => {
  it('is singular for one', () => {
    expect(formatTravelers(1)).toBe('1 traveler');
    expect(formatTravelers(2)).toBe('2 travelers');
  });
});

describe('formatParty', () => {
  it('words adults and children', () => {
    expect(formatParty(2, [])).toBe('2 adults');
    expect(formatParty(1, [8])).toBe('1 adult · 1 child');
    expect(formatParty(2, [4, 8])).toBe('2 adults · 2 children');
  });
});
