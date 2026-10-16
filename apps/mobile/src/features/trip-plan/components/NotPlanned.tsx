import type { TripSpot } from '@waypoint/contracts/trips';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Text } from '@/shared/components';

/** The trip's spots outside the plan, each one tap from the day shown. */
export const NotPlanned = ({
  spots,
  dayLabel,
  onAdd,
}: {
  readonly spots: readonly TripSpot[];
  /** "Day 2" — where an added spot goes. */
  readonly dayLabel: string;
  readonly onAdd: (spotId: string) => void;
}) =>
  spots.length === 0 ? null : (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="subtitle">Didn't fit</Text>
        <Text variant="caption" color="ink-muted">
          Add one to {dayLabel}; the day is re-timed.
        </Text>
      </View>
      {spots.map((spot) => (
        <View key={spot.spotId} style={styles.row}>
          <View style={styles.name}>
            <Text>{spot.name}</Text>
          </View>
          <Button
            label="Add"
            kind="secondary"
            onPress={() => {
              onAdd(spot.spotId);
            }}
          />
        </View>
      ))}
    </View>
  );

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.space[2],
  },
  header: {
    gap: theme.size['focus-ring'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
}));
