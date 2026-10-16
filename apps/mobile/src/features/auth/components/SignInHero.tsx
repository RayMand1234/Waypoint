import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';

export const SignInHero = () => (
  <View style={styles.hero}>
    <Text variant="display" accessibilityRole="header">
      Your whole trip, planned in five minutes.
    </Text>
    <Text color="ink-muted">
      Destination, day plan, flights and a place to sleep — at the best value,
      in one flow.
    </Text>
  </View>
);

const styles = StyleSheet.create((theme) => ({
  hero: {
    gap: theme.space[3],
    marginTop: theme.space[12],
  },
}));
