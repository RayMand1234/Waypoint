import type { ReactNode } from 'react';
import {
  Text as NativeText,
  type TextProps as NativeTextProps,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { ColorName, TextVariant } from '@/theme/tokens';

export type TextProps = Omit<NativeTextProps, 'style'> & {
  readonly variant?: TextVariant;
  readonly color?: ColorName;
  /** Tabular numerals — every price uses them. */
  readonly tabular?: boolean;
  readonly align?: 'auto' | 'left' | 'center' | 'right';
  readonly children: ReactNode;
};

/** Large display sizes stop growing earlier so headings and totals don't break the layout. */
const MAX_SCALE: Partial<Record<TextVariant, number>> = {
  display: 1.3,
  'title-lg': 1.4,
  'price-lg': 1.3,
  'route-label': 1.2,
  'route-now': 1.2,
  overline: 1.4,
};
const DEFAULT_MAX_SCALE = 2;

/** Every piece of text in the app: one of the design's type styles, in a theme color. */
export const Text = ({
  variant = 'body',
  color = 'ink',
  tabular = false,
  align = 'auto',
  ...props
}: TextProps) => (
  <NativeText
    maxFontSizeMultiplier={MAX_SCALE[variant] ?? DEFAULT_MAX_SCALE}
    {...props}
    style={styles.text(variant, color, tabular, align)}
  />
);

const styles = StyleSheet.create((theme) => ({
  text: (
    variant: TextVariant,
    color: ColorName,
    tabular: boolean,
    align: TextProps['align'],
  ) => ({
    ...theme.typography[variant],
    color: theme.colors[color],
    textAlign: align,
    ...(tabular ? theme.font.tabular : {}),
  }),
}));
