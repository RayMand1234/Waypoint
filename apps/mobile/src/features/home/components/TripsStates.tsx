import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button, Text } from '@/shared/components';

export const TripsLoading = () => {
  const { theme } = useUnistyles();

  return (
    <View style={styles.state} accessibilityLabel="Loading your waypoints">
      <ActivityIndicator color={theme.colors['midnight-900']} />
    </View>
  );
};

export const TripsError = ({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry: () => void;
}) => (
  <View style={styles.state}>
    <Text color="danger">{message}</Text>
    <Button label="Try again" kind="secondary" onPress={onRetry} />
  </View>
);

export const TripsEmpty = () => (
  <View style={styles.state}>
    <Text color="ink-muted">
      No waypoints yet. Your first trip is one tap away.
    </Text>
  </View>
);

const styles = StyleSheet.create((theme) => ({
  state: {
    gap: theme.space[3],
    paddingVertical: theme.space[6],
    alignItems: 'flex-start',
  },
}));
