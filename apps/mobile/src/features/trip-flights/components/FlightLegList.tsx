import type { FlightLeg } from '@waypoint/contracts/flights';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { FlightLegItem } from './FlightLegItem';

/** The way out and the way back, in one bordered list. */
export const FlightLegList = ({
  legs,
}: {
  readonly legs: readonly FlightLeg[];
}) => (
  <View style={styles.list}>
    {legs.map((leg, index) => (
      <FlightLegItem key={leg.direction} leg={leg} isFirst={index === 0} />
    ))}
  </View>
);

const styles = StyleSheet.create((theme) => ({
  list: {
    borderWidth: theme.size.hairline,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
}));
