import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '../Text';

/** One option of a segmented control; the chosen one is raised on white. */
export const Segment = ({
  label,
  isOn,
  onPress,
}: {
  readonly label: string;
  readonly isOn: boolean;
  readonly onPress: () => void;
}) => {
  styles.useVariants({ isOn });

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: isOn }}
      onPress={onPress}
      style={styles.segment}
    >
      <Text variant="label" color={isOn ? 'midnight-900' : 'ink-muted'}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  segment: {
    flex: 1,
    minHeight: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    variants: {
      isOn: {
        true: {
          backgroundColor: theme.colors['surface-card'],
          boxShadow: theme.shadow.card,
        },
        false: { backgroundColor: 'transparent' },
      },
    },
  },
}));
