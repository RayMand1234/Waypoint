import { Plus } from 'lucide-react-native';
import { ActivityIndicator, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';

/** The sunshine "Start planning" button on the hero; busy while the draft is created. */
export const StartPlanningButton = ({
  onPress,
  isBusy,
}: {
  readonly onPress: () => void;
  readonly isBusy: boolean;
}) => {
  const { theme } = useUnistyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Start planning a new trip"
      accessibilityState={{ busy: isBusy, disabled: isBusy }}
      disabled={isBusy}
      onPress={onPress}
      style={styles.button}
    >
      {isBusy ? (
        <ActivityIndicator color={theme.colors.ink} />
      ) : (
        <Plus
          size={theme.size['icon-md']}
          strokeWidth={theme.size['icon-stroke']}
          color={theme.colors.ink}
        />
      )}
      <Text variant="label">Start planning</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.space[2],
    minHeight: theme.size['control-h'],
    paddingHorizontal: theme.space[4] + theme.space[1],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors['sunshine-400'],
  },
}));
