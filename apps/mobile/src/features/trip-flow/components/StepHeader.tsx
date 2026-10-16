import { ChevronLeft, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';

type StepHeaderProps = {
  readonly title: string;
  readonly onBack: () => void;
  readonly onClose: () => void;
};

/** Back, the trip so far ("Lisbon · 12–16 May"), close. */
export const StepHeader = ({ title, onBack, onClose }: StepHeaderProps) => {
  const { theme } = useUnistyles();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack}
        style={styles.icon('left')}
      >
        <ChevronLeft
          size={theme.size['icon-lg']}
          strokeWidth={theme.size['icon-stroke']}
          color={theme.colors.ink}
        />
      </Pressable>
      <Text variant="label" numberOfLines={1}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        accessibilityHint="Your trip is saved as a draft"
        onPress={onClose}
        style={styles.icon('right')}
      >
        <X
          size={theme.size['icon-lg']}
          strokeWidth={theme.size['icon-stroke']}
          color={theme.colors.ink}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: (side: 'left' | 'right') => ({
    width: theme.size['tap-min'],
    height: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    ...(side === 'left'
      ? { marginLeft: -theme.space[2] }
      : { marginRight: -theme.space[2] }),
  }),
}));
