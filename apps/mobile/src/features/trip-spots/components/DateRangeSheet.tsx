import type { IsoDate } from '@waypoint/contracts/common';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button, Sheet, Text } from '@/shared/components';
import { formatDateRange } from '@/shared/utils/format';
import {
  monthOf,
  monthTitle,
  pickDay,
  shiftMonth,
  type DateRange,
} from '../utils/calendar';
import { CalendarMonth } from './CalendarMonth';

type DateRangeSheetProps = {
  readonly isOpen: boolean;
  readonly start: IsoDate;
  readonly end: IsoDate;
  readonly today: IsoDate;
  readonly onClose: () => void;
  readonly onDone: (start: IsoDate, end: IsoDate) => void;
};

/** Pick the first and last day of the trip on a month calendar. */
export const DateRangeSheet = ({
  isOpen,
  start,
  end,
  today,
  onClose,
  onDone,
}: DateRangeSheetProps) => {
  const { theme } = useUnistyles();
  const [range, setRange] = useState<DateRange>({
    kind: 'range',
    start,
    end,
  });
  const [month, setMonth] = useState(monthOf(start));

  const finish = (): void => {
    if (range.kind !== 'range') return;

    onDone(range.start, range.end);
    onClose();
  };

  return (
    <Sheet
      isOpen={isOpen}
      title="When are you going?"
      onClose={onClose}
      footer={
        <Button
          label={
            range.kind === 'range'
              ? `Use ${formatDateRange(range.start, range.end)}`
              : 'Pick the last day'
          }
          isBlock
          isDisabled={range.kind !== 'range'}
          onPress={finish}
        />
      }
    >
      <View style={styles.body}>
        <View style={styles.nav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => {
              setMonth(shiftMonth(month, -1));
            }}
            style={styles.navButton}
          >
            <ChevronLeft
              size={theme.size['icon-lg']}
              strokeWidth={theme.size['icon-stroke']}
              color={theme.colors.ink}
            />
          </Pressable>
          <Text variant="subtitle">{monthTitle(month)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={() => {
              setMonth(shiftMonth(month, 1));
            }}
            style={styles.navButton}
          >
            <ChevronRight
              size={theme.size['icon-lg']}
              strokeWidth={theme.size['icon-stroke']}
              color={theme.colors.ink}
            />
          </Pressable>
        </View>
        <CalendarMonth
          month={month}
          range={range}
          today={today}
          onPick={(day) => {
            setRange(pickDay(range, day));
          }}
        />
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create((theme) => ({
  body: {
    gap: theme.space[3],
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: theme.size['tap-min'],
    height: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
