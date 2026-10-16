import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import type { FlightLegLine } from '../utils/flightCardModel';

/** The way out and back on a fare's card: "Out  Sun 15 · 08:10 → 11:25 · 5h 15m". */
export const FlightLegLines = ({
  legs,
}: {
  readonly legs: readonly FlightLegLine[];
}) => (
  <View style={styles.lines}>
    {legs.map((leg) => (
      <View key={leg.label} style={styles.line}>
        <View style={styles.label}>
          <Text variant="caption-strong" color="ink-muted">
            {leg.label}
          </Text>
        </View>
        <Text variant="body-sm" tabular>
          {leg.text}
        </Text>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create((theme) => ({
  lines: {
    gap: theme.space[1],
  },
  line: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  label: {
    width: theme.size['flight-leg-label-w'],
  },
}));
