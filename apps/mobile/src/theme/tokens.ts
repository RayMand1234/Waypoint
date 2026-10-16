import type { TextStyle } from 'react-native';

// Mirrors docs/design/system/tokens.json name for name. Change a value there
// first, then here. Components read these only through the Unistyles theme.

/** Plus Jakarta Sans, one family name per weight (React Native picks weights by family). */
export const fontFamily = {
  400: 'PlusJakartaSans_400Regular',
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
} as const;

const midnight900 = '#1E2A5A';
const midnight700 = '#33437F';

export const colors = {
  'midnight-900': midnight900,
  'midnight-700': midnight700,
  'midnight-100': '#E7EAF5',
  'on-midnight': '#FFFFFF',
  'sunshine-400': '#FFC83D',
  'sunshine-100': '#FFF3D1',
  surface: '#FAF8F4',
  'surface-card': '#FFFFFF',
  border: '#E6E1D8',
  'border-strong': '#8C857A',
  ink: '#121726',
  'ink-muted': '#5E5A55',
  savings: '#1D7A50',
  'savings-100': '#E3F2EA',
  danger: '#C2362C',
  'danger-100': '#FBE6E4',
  warning: '#A15C00',
  'warning-100': '#FDF0DC',
  link: midnight900,
  focus: midnight700,
} as const;

export type ColorName = keyof typeof colors | keyof typeof componentColors;

/** `em` letter spacing from the design, in points for a given size. */
const em = (value: number, fontSize: number): number =>
  Math.round(value * fontSize * 100) / 100;

const textStyle = (
  weight: keyof typeof fontFamily,
  fontSize: number,
  lineHeight: number,
  letterSpacingEm = 0,
) => ({
  fontFamily: fontFamily[weight],
  fontSize,
  lineHeight,
  letterSpacing: em(letterSpacingEm, fontSize),
});

export const typography = {
  display: textStyle(700, 32, 40, -0.02),
  'title-lg': textStyle(700, 24, 32, -0.01),
  title: textStyle(600, 20, 28),
  subtitle: textStyle(600, 17, 24),
  body: textStyle(400, 15, 22),
  'body-strong': textStyle(600, 15, 22),
  label: textStyle(600, 14, 20),
  caption: textStyle(500, 12, 16),
  overline: textStyle(700, 11, 16, 0.06),
  'price-lg': textStyle(800, 28, 34, -0.01),
  price: textStyle(700, 18, 24),
  delta: textStyle(600, 13, 18),
} as const;

export type TypographyName = keyof typeof typography;

/** `space-1` … `space-12`, keyed by step: `space[4]` is `space-4` (16). */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  12: 48,
} as const;

/** `radius-sm` … `radius-full`. */
export const radius = { sm: 8, md: 12, lg: 20, full: 999 } as const;

/** CSS box-shadow strings; React Native (New Architecture) reads them as `boxShadow`. */
export const shadow = {
  card: '0 1px 2px rgba(18,23,38,0.06), 0 2px 8px rgba(18,23,38,0.04)',
  raised: '0 4px 16px rgba(18,23,38,0.10)',
  bar: '0 -4px 20px rgba(18,23,38,0.08)',
} as const;

export const size = {
  'tap-min': 44,
  'control-h': 48,
  'progress-h': 4,
  'content-max': 720,
} as const;

// ── Not in tokens.json ───────────────────────────────────────────────────
// Values the component CSS (docs/design/system/components/bundle.css) and the
// screens use that tokens.json doesn't name. Kept apart so they're easy to
// move into tokens.json when the design system adopts them.

export const componentColors = {
  /** Dims the screen behind a bottom sheet: ink at 40%. */
  scrim: 'rgba(18,23,38,0.4)',
  /** The route moment (docs/design/screens/route-moment.css), drawn on midnight-900. */
  'moment-road': '#6F79A6',
  'moment-muted': '#B8BFDC',
  'moment-todo': '#8F98C2',
} as const;

export const opacity = {
  /** A control that can't be used right now (e.g. a stepper at its limit). */
  disabled: 0.4,
} as const;

export const componentSize = {
  hairline: 1,
  'focus-ring': 2,
  'chip-h': 36,
  'route-h': 68,
  'route-marker': 16,
  'route-marker-border': 2.5,
  'route-checkpoint': 5,
  'route-checkpoint-current': 6,
  'route-finish': 7,
  'route-finish-dot': 2.5,
  'route-label-w': 60,
  'route-now-w': 100,
  'summary-dot': 8,
  'trip-thumb': 72,
  'style-card-h': 76,
  'destination-thumb': 96,
  checkbox: 24,
  'checkbox-border': 1.5,
  'spot-row-h': 60,
  'sheet-list-max': 320,
  'moment-road-stroke': 2.5,
  'moment-trail-stroke': 3.5,
  'moment-marker': 22,
  'moment-marker-border': 3,
  'moment-pulse': 16,
  'moment-cp-done': 16,
  'moment-cp-just': 26,
  'moment-cp-target': 20,
  'moment-cp-target-border': 2.5,
  'moment-cp-todo': 14,
  'moment-cp-todo-border': 2,
  'moment-finish-dot': 7,
  'moment-spacing': 72,
  'moment-label-w': 104,
  'task-icon': 20,
  /** Lucide icons: sizes, and stroke widths (the design's 1.75 by default). */
  'icon-sm': 16,
  'icon-md': 20,
  'icon-lg': 24,
  'icon-xl': 40,
  'icon-stroke': 1.75,
  'icon-stroke-light': 1.5,
  'icon-stroke-bold': 2.5,
  'icon-stroke-heavy': 3.5,
  /** Route moment layout (route-moment.css). */
  'moment-check': 14,
  'moment-label-gap': 22,
  'moment-label-rise': 18,
  'moment-label-rise-quiet': 9,
  'moment-label-appear-rise': 6,
  'moment-sheet-appear-rise': 24,
  'moment-map-padding': 28,
  /** The design's mobile route width, used until the real width is measured. */
  'route-initial-w': 358,
  /** Stay details sheet (Stay.dc.html): the big photo and its thumbnails. */
  'stay-photo-h': 196,
  'stay-thumb-h': 60,
  /** Flight cards (Flights.dc.html): the "Out" / "Back" column. */
  'flight-leg-label-w': 40,
  /** Day plan timeline (Plan.dc.html). */
  'plan-day-tab-h': 52,
  'plan-time-w': 44,
  'plan-dot': 16,
  'plan-dot-border': 2,
  'plan-rail': 2,
  'plan-travel-h': 28,
  'brand-mark': 28,
  'progress-track-max': 180,
} as const;

export const componentTypography = {
  /** The "Waypoint" wordmark. */
  wordmark: textStyle(800, 20, 28, -0.02),
  /** Secondary line on list rows (dates · travelers). */
  'body-sm': textStyle(400, 14, 20),
  /** Passed-checkpoint picks under the route. */
  'route-label': textStyle(500, 11, 14),
  /** Current step name above the route. */
  'route-now': textStyle(700, 12, 14),
  /** Active tab, inline actions on list rows ("Continue · Day plan"). */
  'caption-strong': textStyle(600, 12, 16),
  /** The route moment's title and checkpoint labels. */
  'moment-title': textStyle(700, 26, 34, -0.02),
  'moment-label': textStyle(600, 15, 20),
  'moment-label-todo': textStyle(500, 13, 18),
  'moment-label-top': textStyle(600, 11, 16),
  'moment-next': textStyle(700, 11, 16, 0.06),
  /** A "building your trip" task line. */
  task: textStyle(500, 14, 20),
  /** Destination code on a trip thumbnail. */
  thumb: textStyle(800, 20, 24),
} as const;

/** Prices use tabular numerals so totals line up and don't jitter. */
export const font: { readonly tabular: Pick<TextStyle, 'fontVariant'> } = {
  tabular: { fontVariant: ['tabular-nums'] },
};

export type TextVariant = TypographyName | keyof typeof componentTypography;
