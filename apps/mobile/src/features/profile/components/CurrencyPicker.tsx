import { currencySchema, type Currency } from '@waypoint/contracts/common';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Chip, Text } from '@/shared/components';

type CurrencyPickerProps = {
  readonly value: Currency;
  readonly onChange: (currency: Currency) => void;
};

/** Every currency Waypoint can show prices in, as chips. */
export const CurrencyPicker = ({ value, onChange }: CurrencyPickerProps) => (
  <View style={styles.field}>
    <Text variant="label">Currency</Text>
    <View
      style={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel="Currency"
    >
      {currencySchema.options.map((currency) => (
        <Chip
          key={currency}
          label={currency}
          isSelected={currency === value}
          onPress={() => {
            onChange(currency);
          }}
        />
      ))}
    </View>
    <Text variant="caption" color="ink-muted">
      Flights and stays are priced in this currency.
    </Text>
  </View>
);

const styles = StyleSheet.create((theme) => ({
  field: {
    gap: theme.space[2],
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[3],
  },
}));
