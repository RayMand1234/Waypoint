import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';

export const OrDivider = () => (
  <View
    style={styles.row}
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
  >
    <View style={styles.line} />
    <Text variant="caption" color="ink-muted">
      or
    </Text>
    <View style={styles.line} />
  </View>
);

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  line: {
    flex: 1,
    height: theme.size.hairline,
    backgroundColor: theme.colors.border,
  },
}));
