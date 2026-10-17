import type { Spot } from '@waypoint/contracts/destinations';
import type { TripDay } from '@waypoint/contracts/trips';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import type { DayDrag } from '../hooks/useDayDrag';
import { dragKeyOf } from '../utils/planEdits';
import { timelineItem } from '../utils/planModel';
import { DragCard } from './DragCard';
import { DragRow } from './DragRow';
import { DragTip } from './DragTip';
import { TimelineRow } from './TimelineRow';

/** A tip is worth showing once there is something to reorder. */
const MIN_TO_REORDER = 2;

type DayTimelineProps = {
  readonly day: TripDay;
  /** "4 stops · balanced". */
  readonly meta: string;
  readonly spotsById: ReadonlyMap<string, Spot>;
  /** The day's draggable stops in order: its spots, and lunch. */
  readonly keys: readonly string[];
  readonly drag: DayDrag;
  readonly onEdit: (spotId: string) => void;
  readonly onNudge: (key: string, by: -1 | 1) => void;
};

/** One day: its title and how full it is, then its stops on a line; spot and lunch cards are held to drag them into a new order. */
export const DayTimeline = ({
  day,
  meta,
  spotsById,
  keys,
  drag,
  onEdit,
  onNudge,
}: DayTimelineProps) => (
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
    {keys.length >= MIN_TO_REORDER && <DragTip />}
    <View style={styles.stops}>
      {day.stops.map((stop) => {
        const item = timelineItem(stop, spotsById);
        const key = dragKeyOf(stop);
        const index = key === null ? -1 : keys.indexOf(key);

        return key === null ? (
          <TimelineRow
            key={stop.id}
            item={item}
            isDraggable={false}
            onEdit={onEdit}
          />
        ) : (
          <DragRow key={stop.id} dragKey={key} index={index} drag={drag}>
            <TimelineRow
              item={item}
              isDraggable
              renderCard={(card) => (
                <DragCard index={index} drag={drag}>
                  {card}
                </DragCard>
              )}
              onEdit={onEdit}
              onNudge={(by) => {
                onNudge(key, by);
              }}
            />
          </DragRow>
        );
      })}
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
