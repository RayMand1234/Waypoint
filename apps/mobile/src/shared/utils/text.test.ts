import { capitalised, fold, listOf, plural } from './text';

describe('text', () => {
  it('folds accents and case', () => {
    expect(fold('São Paulo')).toBe('sao paulo');
  });

  it('says one or many', () => {
    expect(plural(1, 'day')).toBe('1 day');
    expect(plural(5, 'day')).toBe('5 days');
    expect(plural(2, 'child', 'children')).toBe('2 children');
  });

  it('lists words and capitalises', () => {
    expect(listOf(['views'])).toBe('views');
    expect(listOf(['views', 'culture', 'food'])).toBe(
      'views, culture and food',
    );
    expect(capitalised('views')).toBe('Views');
  });
});
