import { greetingLine, greetingFor, hiLine, initialOf } from './greeting';

describe('greeting', () => {
  it('follows the hour', () => {
    expect(greetingFor(8)).toBe('Good morning');
    expect(greetingFor(13)).toBe('Good afternoon');
    expect(greetingFor(21)).toBe('Good evening');
    expect(greetingFor(2)).toBe('Good evening');
  });

  it('uses the first name, or a friendly default', () => {
    expect(hiLine('Ray Mandel')).toBe('Hi, Ray');
    expect(hiLine(null)).toBe('Hi there');
    expect(hiLine('  ')).toBe('Hi there');
  });

  it('takes the avatar letter from the name, then the email', () => {
    expect(initialOf('ray', 'x@y.z')).toBe('R');
    expect(initialOf(null, 'traveler@waypoint.local')).toBe('T');
  });
});

describe('greetingLine', () => {
  it('greets by first name, or without one', () => {
    expect(greetingLine('Good evening', 'Ray Mandel')).toBe(
      'Good evening, Ray',
    );
    expect(greetingLine('Good evening', null)).toBe('Good evening');
    expect(greetingLine('Good evening', '  ')).toBe('Good evening');
  });
});
