import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Segment, type SegmentTone } from './Segment';
import { useSlidingHighlight } from './useSlidingHighlight';

export type SegmentedOption<T extends string | number> = {
  readonly value: T;
  readonly label: string;
};

export type SegmentedControlProps<T extends string | number> = {
  /** Read aloud for the group, e.g. "Pace". */
  readonly label: string;
  readonly options: readonly SegmentedOption<T>[];
  /** `undefined` when none fits (e.g. a custom trip length). */
  readonly value: T | undefined;
  readonly onChange: (value: T) => void;
  /** The track: midnight-100 (default) or midnight-900, e.g. on glass. */
  readonly tone?: SegmentTone;
};

/**
 * One choice out of a few, side by side on a midnight-100 (or midnight-900)
 * track (pace, trip length, currency). The white highlight sweeps to the
 * chosen option.
 */
export const SegmentedControl = <T extends string | number>({
  label,
  options,
  value,
  onChange,
  tone = 'light',
}: SegmentedControlProps<T>) => {
  const { theme } = useUnistyles();
  const highlight = useSlidingHighlight(
    options.findIndex((option) => option.value === value),
    options.length,
    { padding: theme.space[1], gap: theme.space[1] },
  );

  styles.useVariants({ tone });

  return (
    <View
      style={styles.track}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      onLayout={highlight.onTrackLayout}
    >
      <Animated.View
        style={[styles.highlight, highlight.highlightStyle]}
        pointerEvents="none"
      />
      {options.map((option) => (
        <Segment
          key={String(option.value)}
          label={option.label}
          isOn={option.value === value}
          tone={tone}
          onPress={() => {
            onChange(option.value);
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  // Same inset and gap as `useSlidingHighlight` is given above.
  highlight: {
    position: 'absolute',
    top: theme.space[1],
    bottom: theme.space[1],
    left: theme.space[1],
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors['surface-card'],
    boxShadow: theme.shadow.card,
  },
  track: {
    flexDirection: 'row',
    gap: theme.space[1],
    padding: theme.space[1],
    borderRadius: theme.radius.md,
    variants: {
      tone: {
        light: { backgroundColor: theme.colors['midnight-100'] },
        midnight: { backgroundColor: theme.colors['midnight-900'] },
      },
    },
  },
}));
