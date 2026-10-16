import type { IsoDate } from '@waypoint/contracts/common';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import {
  dayState,
  monthGrid,
  type DateRange,
  type MonthRef,
} from '../utils/calendar';
import { CalendarDay } from './CalendarDay';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

type CalendarMonthProps = {
  readonly month: MonthRef;
  readonly range: DateRange;
  readonly today: IsoDate;
  readonly onPick: (day: IsoDate) => void;
};

/** One month, Monday first. Past days can't be picked; the chosen range is filled. */
export const CalendarMonth = ({
  month,
  range,
  today,
  onPick,
}: CalendarMonthProps) => (
  <View style={styles.month}>
    <View style={styles.week}>
      {WEEKDAYS.map((day, index) => (
        <View key={index} style={styles.cell}>
          <Text variant="caption" color="ink-muted">
            {day}
          </Text>
        </View>
      ))}
    </View>
    {monthGrid(month).map((week, row) => (
      <View key={row} style={styles.week}>
        {week.map((day, column) => {
          if (day === null) return <View key={column} style={styles.cell} />;

          return (
            <CalendarDay
              key={day}
              day={day}
              state={dayState(day, range, today)}
              onPick={onPick}
            />
          );
        })}
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create((theme) => ({
  month: {
    gap: theme.space[1],
  },
  week: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    minHeight: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
