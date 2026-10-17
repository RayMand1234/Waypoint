import { GripVertical } from 'lucide-react-native';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';

/** Tells the traveler the day's cards can be dragged into a new order. */
export const DragTip = () => {
  const { theme } = useUnistyles();

  return (
    <View style={styles.tip}>
      <GripVertical
        size={theme.size['icon-sm']}
        strokeWidth={theme.size['icon-stroke']}
        color={theme.colors['midnight-900']}
      />
      <Text variant="caption" color="midnight-900">
        Hold a card, then drag it to reorder your day — lunch too.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    paddingVertical: theme.space[2],
    paddingHorizontal: theme.space[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors['midnight-100'],
  },
}));
