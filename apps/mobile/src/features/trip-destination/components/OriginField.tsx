import { PlaneTakeoff } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';

type OriginFieldProps = {
  /** The chosen airport code, or empty before one is chosen. */
  readonly airport: string;
  readonly error?: string;
  readonly onPress: () => void;
};

/** "Flying from TLV" — opens the airport search. */
export const OriginField = ({ airport, error, onPress }: OriginFieldProps) => {
  const { theme } = useUnistyles();

  styles.useVariants({ hasError: error !== undefined });

  return (
    <View style={styles.field}>
      <Text variant="label">Flying from</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          airport === ''
            ? 'Choose where you fly from'
            : `Flying from ${airport}. Change`
        }
        onPress={onPress}
        style={styles.control}
      >
        <PlaneTakeoff
          size={theme.size['icon-md']}
          strokeWidth={theme.size['icon-stroke']}
          color={theme.colors['ink-muted']}
        />
        <Text color={airport === '' ? 'ink-muted' : 'ink'}>
          {airport === '' ? 'Choose an airport' : airport}
        </Text>
      </Pressable>
      {error !== undefined && (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  field: {
    gap: theme.space[1],
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    minHeight: theme.size['control-h'],
    paddingHorizontal: theme.space[4],
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
