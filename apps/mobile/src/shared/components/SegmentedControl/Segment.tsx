import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '../Text';

export type SegmentTone = 'light' | 'midnight';

/** One option of a segmented control; the white highlight behind the chosen one is the control's. */
export const Segment = ({
  label,
  isOn,
  tone,
  onPress,
}: {
  readonly label: string;
  readonly isOn: boolean;
  readonly tone: SegmentTone;
  readonly onPress: () => void;
}) => {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: isOn }}
      onPress={onPress}
      style={styles.segment}
    >
      <Text
        variant="label"
        color={
          isOn
            ? 'midnight-900'
            : tone === 'midnight'
              ? 'midnight-100'
              : 'ink-muted'
        }
      >
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
  },
}));
