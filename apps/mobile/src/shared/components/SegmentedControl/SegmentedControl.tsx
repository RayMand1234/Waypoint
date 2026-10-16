import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Segment } from './Segment';

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
};

/** One choice out of a few, side by side on a midnight-100 track (pace, trip length). */
export const SegmentedControl = <T extends string | number>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) => (
  <View
    style={styles.track}
    accessibilityRole="radiogroup"
    accessibilityLabel={label}
  >
    {options.map((option) => (
      <Segment
        key={String(option.value)}
        label={option.label}
        isOn={option.value === value}
        onPress={() => {
          onChange(option.value);
        }}
      />
    ))}
  </View>
);

const styles = StyleSheet.create((theme) => ({
  track: {
    flexDirection: 'row',
    gap: theme.space[1],
    padding: theme.space[1],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors['midnight-100'],
  },
}));
