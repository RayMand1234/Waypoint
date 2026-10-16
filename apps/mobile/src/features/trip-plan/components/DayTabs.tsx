import type { TripDay } from '@waypoint/contracts/trips';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { dayTab } from '../utils/planModel';
import { DayTab } from './DayTab';

/** The trip's days side by side, scrolling sideways when they don't fit. */
export const DayTabs = ({
  days,
  shownIndex,
  onShow,
}: {
  readonly days: readonly TripDay[];
  readonly shownIndex: number;
  readonly onShow: (index: number) => void;
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.row}
    accessibilityRole="tablist"
  >
    {days.map((day, index) => {
      const tab = dayTab(day, index);

      return (
        <DayTab
          key={day.id}
          label={tab.label}
          date={tab.date}
          isOn={index === shownIndex}
          onPress={() => {
            onShow(index);
          }}
        />
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create((theme) => ({
  row: {
    gap: theme.space[2],
  },
}));
