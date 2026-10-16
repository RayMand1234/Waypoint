import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';

type StyleCardProps = {
  readonly label: string;
  readonly hint: string;
  readonly isSelected: boolean;
  readonly onPress: () => void;
};

/** One selectable trip style: name, a hint, and a check when picked. */
export const StyleCard = ({
  label,
  hint,
  isSelected,
  onPress,
}: StyleCardProps) => {
  const { theme } = useUnistyles();

  styles.useVariants({ isSelected });

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={`${label}. ${hint}`}
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.top}>
        <Text variant="body-strong">{label}</Text>
        {isSelected && (
          <Check
            size={theme.size['icon-md']}
            strokeWidth={theme.size['icon-stroke']}
            color={theme.colors['midnight-900']}
          />
        )}
      </View>
      <Text variant="caption" color="ink-muted">
        {hint}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    gap: theme.space[1],
    minHeight: theme.size['style-card-h'],
    borderRadius: theme.radius.md,
    variants: {
      isSelected: {
        true: {
          padding: theme.space[3] - theme.size.hairline,
          backgroundColor: theme.colors['midnight-100'],
          borderWidth: theme.size['focus-ring'],
          borderColor: theme.colors['midnight-900'],
        },
        false: {
          padding: theme.space[3],
          backgroundColor: theme.colors['surface-card'],
          borderWidth: theme.size.hairline,
          borderColor: theme.colors.border,
        },
      },
    },
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}));
