import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Chip } from '@/shared/components';
import { FLIGHT_FILTERS, type FlightFilter } from '../utils/flightFilters';

/** The filter chips, in a row that scrolls sideways on narrow screens. */
export const FlightFilters = ({
  filters,
  onToggle,
}: {
  readonly filters: readonly FlightFilter[];
  readonly onToggle: (filter: FlightFilter) => void;
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.row}
  >
    {FLIGHT_FILTERS.map(({ value, label }) => (
      <Chip
        key={value}
        label={label}
        isSelected={filters.includes(value)}
        onPress={() => {
          onToggle(value);
        }}
      />
    ))}
  </ScrollView>
);

const styles = StyleSheet.create((theme) => ({
  row: {
    gap: theme.space[2],
  },
}));
