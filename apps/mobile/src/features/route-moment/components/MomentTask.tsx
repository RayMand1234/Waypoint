import { Check } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { useAppear } from '../hooks/useAppear';

const CHECK_SIZE = 12;
const CHECK_STROKE = 3.5;
const CHECK_FROM = 0.4;

/** One "building your trip" line: a spinner while it runs, a green check when it's done. */
export const MomentTask = ({
  text,
  isDone,
}: {
  readonly text: string;
  readonly isDone: boolean;
}) => {
  const { theme } = useUnistyles();
  // Spinner and check both stay mounted; the check grows over the spinner when done.
  const check = useAppear({
    durationMs: 300,
    fromScale: CHECK_FROM,
    isShown: isDone,
  });

  return (
    <View
      style={styles.row}
      accessibilityLabel={`${text}${isDone ? ', done' : ', working'}`}
    >
      <View style={styles.icon}>
        <ActivityIndicator
          size="small"
          animating={!isDone}
          hidesWhenStopped
          color={theme.colors['midnight-900']}
        />
        <Animated.View style={[styles.done, check]}>
          <Check
            size={CHECK_SIZE}
            strokeWidth={CHECK_STROKE}
            color={theme.colors['on-midnight']}
          />
        </Animated.View>
      </View>
      <Text variant="task">{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  icon: {
    width: theme.size['task-icon'],
    height: theme.size['task-icon'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: {
    position: 'absolute',
    width: theme.size['task-icon'],
    height: theme.size['task-icon'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.savings,
  },
}));
