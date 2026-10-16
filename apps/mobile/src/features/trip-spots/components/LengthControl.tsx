import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { SegmentedControl, Text } from '@/shared/components';
import { plural } from '@/shared/utils/text';

const LENGTHS = [3, 5, 7, 10] as const;
const OPTIONS = LENGTHS.map((days) => ({
  value: days,
  label: plural(days, 'day'),
}));

type LengthControlProps = {
  /** Days in the trip now; when it isn't one of the presets, none is selected. */
  readonly days: number;
  readonly onChange: (days: number) => void;
};

/** "How long?" — 3, 5, 7 or 10 days, counted from the first day. */
export const LengthControl = ({ days, onChange }: LengthControlProps) => (
  <View style={styles.field}>
    <Text variant="label">How long?</Text>
    <SegmentedControl
      label="Trip length"
      options={OPTIONS}
      value={OPTIONS.find((option) => option.value === days)?.value}
      onChange={onChange}
    />
  </View>
);

const styles = StyleSheet.create((theme) => ({
  field: {
    gap: theme.space[2],
  },
}));
