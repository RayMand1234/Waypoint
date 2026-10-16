import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';

/** One day's tab: "Day 2" over its date; the shown day is filled midnight. */
export const DayTab = ({
  label,
  date,
  isOn,
  onPress,
}: {
  readonly label: string;
  readonly date: string;
  readonly isOn: boolean;
  readonly onPress: () => void;
}) => {
  styles.useVariants({ isOn });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={`${label}, ${date}`}
      accessibilityState={{ selected: isOn }}
      onPress={onPress}
      style={styles.tab}
    >
      <Text variant="body-strong" color={isOn ? 'on-midnight' : 'ink'}>
        {label}
      </Text>
      <Text variant="caption" color={isOn ? 'midnight-100' : 'ink-muted'}>
        {date}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  tab: {
    minHeight: theme.size['plan-day-tab-h'],
    justifyContent: 'center',
    gap: theme.size['focus-ring'],
    paddingHorizontal: theme.space[4],
    borderRadius: theme.radius.md,
    borderWidth: theme.size.hairline,
    variants: {
      isOn: {
        true: {
          backgroundColor: theme.colors['midnight-900'],
          borderColor: theme.colors['midnight-900'],
        },
        false: {
          backgroundColor: theme.colors['surface-card'],
          borderColor: theme.colors['border-strong'],
        },
      },
    },
  },
}));
