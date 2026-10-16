import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';

type PickerFieldProps = {
  readonly label: string;
  readonly value: string;
  readonly Icon: LucideIcon;
  readonly onPress: () => void;
  readonly error?: string;
};

/** A field that looks like an input and opens a sheet to change its value (dates, travelers). */
export const PickerField = ({
  label,
  value,
  Icon,
  onPress,
  error,
}: PickerFieldProps) => {
  const { theme } = useUnistyles();

  styles.useVariants({ hasError: error !== undefined });

  return (
    <View style={styles.field}>
      <Text variant="label">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}. Change`}
        onPress={onPress}
        style={styles.control}
      >
        <Icon
          size={theme.size['icon-md']}
          strokeWidth={theme.size['icon-stroke']}
          color={theme.colors['ink-muted']}
        />
        <Text numberOfLines={1}>{value}</Text>
      </Pressable>
      {error !== undefined && (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  field: {
    flex: 1,
    gap: theme.space[1],
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    minHeight: theme.size['control-h'],
    paddingHorizontal: theme.space[3],
    borderWidth: theme.size.hairline,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors['surface-card'],
    variants: {
      hasError: {
        true: { borderColor: theme.colors.danger },
        false: { borderColor: theme.colors['border-strong'] },
      },
    },
  },
}));
