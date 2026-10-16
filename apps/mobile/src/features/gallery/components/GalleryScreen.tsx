import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Screen, Text } from '@/shared/components';
import { ControlsDemo } from './ControlsDemo';
import { OffersDemo } from './OffersDemo';
import { RouteDemo } from './RouteDemo';

/** Dev-only: every design-system component in every variant, to compare with the previews. */
export const GalleryScreen = () => (
  <Screen>
    <View style={styles.page}>
      <Text variant="display">Components</Text>
      <RouteDemo />
      <ControlsDemo />
      <OffersDemo />
    </View>
  </Screen>
);

const styles = StyleSheet.create((theme) => ({
  page: {
    gap: theme.space[8],
    paddingTop: theme.space[6],
  },
}));
