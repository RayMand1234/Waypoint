import type { Spot } from '@waypoint/contracts/destinations';
import type { TripDay } from '@waypoint/contracts/trips';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { timelineItem } from '../utils/planModel';
import { TimelineRow } from './TimelineRow';

/** One day: its title and how full it is, then its stops on a line. */
export const DayTimeline = ({
  day,
  meta,
  spotsById,
  onEdit,
}: {
  readonly day: TripDay;
  /** "4 stops · balanced". */
  readonly meta: string;
  readonly spotsById: ReadonlyMap<string, Spot>;
  readonly onEdit: (spotId: string) => void;
}) => (
  <View style={styles.day}>
    <View style={styles.header}>
      <View style={styles.title}>
        <Text variant="subtitle" accessibilityRole="header">
          {day.title ?? 'Your day'}
        </Text>
      </View>
      <Text variant="caption" color="ink-muted">
        {meta}
      </Text>
    </View>
    <View style={styles.stops}>
      {day.stops.map((stop) => (
        <TimelineRow
          key={stop.id}
          item={timelineItem(stop, spotsById)}
          onEdit={onEdit}
        />
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create((theme) => ({
  day: {
    gap: theme.space[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.space[3],
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  stops: {
    gap: theme.space[2],
  },
}));
