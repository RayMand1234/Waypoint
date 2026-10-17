import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Text } from '@/shared/components';

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

const styles = StyleSheet.create((theme) => ({
  state: {
    gap: theme.space[3],
    alignItems: 'flex-start',
  },
}));
