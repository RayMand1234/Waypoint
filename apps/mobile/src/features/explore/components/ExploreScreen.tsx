import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Screen, Text } from '@/shared/components';

/** The Explore tab — a placeholder until destination ideas exist. */
export const ExploreScreen = () => (
  <Screen>
    <View style={styles.page}>
      <Text variant="title-lg" accessibilityRole="header">
        Explore
      </Text>
      <Text color="ink-muted">
        Ideas for your next trip are coming soon. For now, start one from
        Waypoints.
      </Text>
    </View>
  </Screen>
);

const styles = StyleSheet.create((theme) => ({
  page: {
    gap: theme.space[2],
    paddingTop: theme.space[6],
  },
}));
