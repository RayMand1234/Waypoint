import type { FlightLeg } from '@waypoint/contracts/flights';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { legDetail } from '../utils/flightDetails';

/** One way in full: the day, the times, the airports, the length and any change of plane. */
export const FlightLegItem = ({
  leg,
  isFirst,
}: {
  readonly leg: FlightLeg;
  readonly isFirst: boolean;
}) => {
  const detail = legDetail(leg);

  styles.useVariants({ isFirst });

  return (
    <View style={styles.leg}>
      <Text variant="caption-strong" color="ink-muted">
        {detail.label}
      </Text>
      <Text variant="subtitle" tabular>
        {detail.times}
      </Text>
      <Text variant="caption" color="ink-muted">
        {detail.meta}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  leg: {
    gap: theme.space[1],
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[4],
    variants: {
      // Ways after the first are divided by a hairline.
      isFirst: {
        true: {},
        false: {
          borderTopWidth: theme.size.hairline,
          borderColor: theme.colors.border,
        },
      },
    },
  },
}));
