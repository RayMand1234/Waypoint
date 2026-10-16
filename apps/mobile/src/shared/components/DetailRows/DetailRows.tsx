import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '../Text';

/** Term and value, one per line, the value right-aligned: an offer's terms in its details sheet. */
export const DetailRows = ({
  rows,
}: {
  readonly rows: readonly (readonly [term: string, value: string])[];
}) => (
  <View style={styles.rows}>
    {rows.map(([term, value]) => (
      <View key={term} style={styles.row}>
        <Text variant="body-sm" color="ink-muted">
          {term}
        </Text>
        <View style={styles.value}>
          <Text variant="label" align="right">
            {value}
          </Text>
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create((theme) => ({
  rows: {
    gap: theme.space[3],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.space[3],
  },
  value: {
    flexShrink: 1,
  },
}));
