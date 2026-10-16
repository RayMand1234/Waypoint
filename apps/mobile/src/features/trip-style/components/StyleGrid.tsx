import type { TripStyle } from '@waypoint/contracts/trips';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { STYLE_OPTIONS, toggleStyle } from '../utils/styleOptions';
import { StyleCard } from './StyleCard';

const COLUMNS = 2;

type StyleGridProps = {
  readonly value: readonly TripStyle[];
  readonly onChange: (styles: TripStyle[]) => void;
};

/** The eight styles, two per row; several can be picked. */
export const StyleGrid = ({ value, onChange }: StyleGridProps) => (
  <View style={styles.grid}>
    {Array.from(
      { length: Math.ceil(STYLE_OPTIONS.length / COLUMNS) },
      (_, row) => (
        <View key={row} style={styles.row}>
          {STYLE_OPTIONS.slice(row * COLUMNS, (row + 1) * COLUMNS).map(
            (option) => (
              <StyleCard
                key={option.id}
                label={option.label}
                hint={option.hint}
                isSelected={value.includes(option.id)}
                onPress={() => {
                  onChange(toggleStyle(value, option.id));
                }}
              />
            ),
          )}
        </View>
      ),
    )}
  </View>
);

const styles = StyleSheet.create((theme) => ({
  grid: {
    gap: theme.space[3],
  },
  row: {
    flexDirection: 'row',
    gap: theme.space[3],
  },
}));
