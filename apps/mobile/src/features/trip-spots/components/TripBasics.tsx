import type { IsoDate } from '@waypoint/contracts/common';
import { CalendarDays, Users } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { formatDateRange, formatParty } from '@/shared/utils/format';
import { DateRangeSheet } from './DateRangeSheet';
import { PickerField } from './PickerField';
import { TravelersSheet } from './TravelersSheet';

type TripBasicsProps = {
  readonly startDate: IsoDate;
  readonly endDate: IsoDate;
  readonly adults: number;
  readonly childrenAges: readonly number[];
  /** Days before it can't be picked. */
  readonly today: IsoDate;
  readonly onDates: (start: IsoDate, end: IsoDate) => void;
  readonly onTravelers: (adults: number, childrenAges: number[]) => void;
};

/** Dates and travelers side by side, each opening its sheet. */
export const TripBasics = ({
  startDate,
  endDate,
  adults,
  childrenAges,
  today,
  onDates,
  onTravelers,
}: TripBasicsProps) => {
  const [open, setOpen] = useState<'dates' | 'travelers' | null>(null);
  const close = (): void => {
    setOpen(null);
  };

  return (
    <View style={styles.row}>
      <PickerField
        label="Dates"
        value={formatDateRange(startDate, endDate)}
        Icon={CalendarDays}
        onPress={() => {
          setOpen('dates');
        }}
      />
      <PickerField
        label="Travelers"
        value={formatParty(adults, childrenAges)}
        Icon={Users}
        onPress={() => {
          setOpen('travelers');
        }}
      />
      {open === 'dates' && (
        <DateRangeSheet
          isOpen
          start={startDate}
          end={endDate}
          today={today}
          onClose={close}
          onDone={onDates}
        />
      )}
      {open === 'travelers' && (
        <TravelersSheet
          isOpen
          adults={adults}
          childrenAges={childrenAges}
          onClose={close}
          onDone={onTravelers}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    gap: theme.space[3],
  },
}));
