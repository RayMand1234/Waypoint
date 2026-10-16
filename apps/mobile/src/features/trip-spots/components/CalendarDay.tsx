import type { IsoDate } from '@waypoint/contracts/common';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import type { ColorName } from '@/theme/tokens';
import type { DayState } from '../utils/calendar';

const TEXT_COLOR: Readonly<Record<DayState, ColorName>> = {
  edge: 'on-midnight',
  inside: 'ink',
  none: 'ink',
  past: 'border-strong',
};

/** One day of the month: past days can't be picked; the range's ends are filled, its inside tinted. */
export const CalendarDay = ({
  day,
  state,
  onPick,
}: {
  readonly day: IsoDate;
  readonly state: DayState;
  readonly onPick: (day: IsoDate) => void;
}) => {
  styles.useVariants({ state });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={day}
      accessibilityState={{
        disabled: state === 'past',
        selected: state === 'edge',
      }}
      disabled={state === 'past'}
      onPress={() => {
        onPick(day);
      }}
      style={styles.day}
    >
      <Text variant="label" tabular color={TEXT_COLOR[state]}>
        {String(Number(day.slice(8, 10)))}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  day: {
    flex: 1,
    minHeight: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    variants: {
      state: {
        edge: { backgroundColor: theme.colors['midnight-900'] },
        inside: { backgroundColor: theme.colors['midnight-100'] },
        none: {},
        past: {},
      },
    },
  },
}));
