import { stylesCountLabel, toggleStyle } from './styleOptions';

describe('toggleStyle', () => {
  it('adds and removes, keeping the design order', () => {
    expect(toggleStyle(['food'], 'views')).toEqual(['views', 'food']);
    expect(toggleStyle(['views', 'food'], 'views')).toEqual(['food']);
  });
});

describe('stylesCountLabel', () => {
  it('is singular for one', () => {
    expect(stylesCountLabel(1)).toBe('1 style selected');
    expect(stylesCountLabel(3)).toBe('3 styles selected');
  });
});
