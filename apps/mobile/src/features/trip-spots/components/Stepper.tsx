import { Minus, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';

type StepperProps = {
  readonly label: string;
  readonly hint?: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly onChange: (value: number) => void;
};

/** A labelled number with − and + (adults, a child's age). */
export const Stepper = ({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: StepperProps) => {
  const { theme } = useUnistyles();

  const button = (direction: -1 | 1, isDisabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${direction === 1 ? 'More' : 'Fewer'} ${label.toLowerCase()}`}
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={() => {
        onChange(value + direction);
      }}
      style={styles.button(isDisabled)}
    >
      {direction === 1 ? (
        <Plus
          size={theme.size['icon-md']}
          strokeWidth={theme.size['icon-stroke']}
          color={theme.colors['midnight-900']}
        />
      ) : (
        <Minus
          size={theme.size['icon-md']}
          strokeWidth={theme.size['icon-stroke']}
          color={theme.colors['midnight-900']}
        />
      )}
    </Pressable>
  );

  return (
    <View
      style={styles.row}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ now: value, min, max }}
    >
      <View style={styles.text}>
        <Text variant="body-strong">{label}</Text>
        {hint !== undefined && (
          <Text variant="caption" color="ink-muted">
            {hint}
          </Text>
        )}
      </View>
      {button(-1, value <= min)}
      <Text variant="price" tabular align="center">
        {String(value)}
      </Text>
      {button(1, value >= max)}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    minHeight: theme.size['control-h'],
  },
  text: {
    flex: 1,
  },
  button: (isDisabled: boolean) => ({
    width: theme.size['tap-min'],
    height: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors['midnight-100'],
    opacity: isDisabled ? theme.opacity.disabled : 1,
  }),
}));
