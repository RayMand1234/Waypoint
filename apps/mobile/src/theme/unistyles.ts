import { StyleSheet } from 'react-native-unistyles';
import {
  colors,
  componentColors,
  componentSize,
  componentTypography,
  font,
  opacity,
  radius,
  shadow,
  size,
  space,
  typography,
} from './tokens';

// The only theme for now. Dark mode is a second object with the same shape.
const light = {
  colors: { ...colors, ...componentColors },
  typography: { ...typography, ...componentTypography },
  space,
  radius,
  shadow,
  size: { ...size, ...componentSize },
  font,
  opacity,
} as const;

const appThemes = { light } as const;

/** `xs` is phones, `md` tablets and wide windows (the design's desktop column). */
const breakpoints = { xs: 0, md: 768 } as const;

type AppThemes = typeof appThemes;
type AppBreakpoints = typeof breakpoints;

// Declaration merging is how Unistyles types the theme; it needs interfaces.
declare module 'react-native-unistyles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesThemes extends AppThemes {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes: appThemes,
  breakpoints,
  settings: { initialTheme: 'light' },
});
