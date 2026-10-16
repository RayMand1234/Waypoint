import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button, Text } from '@/shared/components';

/** While the trip loads, or when it can't: the step can't show without it. */
export const StepStatus = ({
  error,
  onRetry,
}: {
  readonly error?: string;
  readonly onRetry?: () => void;
}) => {
  const { theme } = useUnistyles();

  return (
    <View style={styles.center}>
      {error === undefined ? (
        <ActivityIndicator
          color={theme.colors['midnight-900']}
          accessibilityLabel="Loading your trip"
        />
      ) : (
        <>
          <Text color="danger" align="center">
            {error}
          </Text>
          {onRetry !== undefined && (
            <Button label="Try again" kind="secondary" onPress={onRetry} />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[4],
    padding: theme.space[6],
    backgroundColor: theme.colors.surface,
  },
}));
