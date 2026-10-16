import { Plus } from 'lucide-react-native';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';

type CreateWaypointCardProps = {
  readonly onPress: () => void;
  readonly isCreating: boolean;
};

/** The one midnight card on Home that starts a new trip. */
export const CreateWaypointCard = ({
  onPress,
  isCreating,
}: CreateWaypointCardProps) => {
  const { theme } = useUnistyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create a waypoint. Start planning."
      accessibilityState={{ busy: isCreating, disabled: isCreating }}
      disabled={isCreating}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text variant="overline" color="sunshine-400">
        NEW TRIP
      </Text>
      <Text variant="title-lg" color="on-midnight">
        Create a waypoint
      </Text>
      <Text color="midnight-100">
        Pick a style, we'll plan the days and find the best-value flight and
        stay. About five minutes.
      </Text>
      <View style={styles.cta}>
        {isCreating ? (
          <ActivityIndicator color={theme.colors.ink} />
        ) : (
          <Plus
            size={theme.size['icon-md']}
            strokeWidth={theme.size['icon-stroke']}
            color={theme.colors.ink}
          />
        )}
        <Text variant="label">Start planning</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  card: {
    gap: theme.space[4],
    padding: theme.space[6],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors['midnight-900'],
  },
  pressed: {
    backgroundColor: theme.colors['midnight-700'],
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.space[2],
    minHeight: theme.size['tap-min'],
    paddingHorizontal: theme.space[4] + theme.space[1],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors['sunshine-400'],
  },
}));
