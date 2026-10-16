import type { TripDay, TripStop } from '@waypoint/contracts/trips';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Sheet, Text } from '@/shared/components';
import { dayTab } from '../utils/planModel';

type StopActionsSheetProps = {
  readonly stop: TripStop;
  readonly days: readonly TripDay[];
  /** The day the stop is on — not offered as a move. */
  readonly currentDate: string;
  readonly onMove: (spotId: string, date: string) => void;
  readonly onRemove: (spotId: string) => void;
  readonly onClose: () => void;
};

/** One spot's edits: move it to another day, or take it out of the plan. */
export const StopActionsSheet = ({
  stop,
  days,
  currentDate,
  onMove,
  onRemove,
  onClose,
}: StopActionsSheetProps) => {
  const { spotId } = stop;

  if (spotId === null) return null;

  return (
    <Sheet
      isOpen
      title={stop.name}
      onClose={onClose}
      footer={
        <Button
          label="Remove from plan"
          kind="ghost"
          isBlock
          onPress={() => {
            onRemove(spotId);
          }}
        />
      }
    >
      <View style={styles.body}>
        <Text color="ink-muted">
          Move it to another day. The day is re-ordered and re-timed for you.
        </Text>
        <View style={styles.days}>
          {days.map((day, index) => {
            if (day.date === currentDate) return null;

            const tab = dayTab(day, index);

            return (
              <Button
                key={day.id}
                label={`${tab.label} · ${tab.date}`}
                kind="secondary"
                isBlock
                onPress={() => {
                  onMove(spotId, day.date);
                }}
              />
            );
          })}
        </View>
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create((theme) => ({
  body: {
    gap: theme.space[4],
  },
  days: {
    gap: theme.space[2],
  },
}));
