import type { LucideIcon } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';

type TabBarItemProps = {
  readonly label: string;
  readonly Icon: LucideIcon;
  readonly isActive: boolean;
  readonly onPress: () => void;
};

export const TabBarItem = ({
  label,
  Icon,
  isActive,
  onPress,
}: TabBarItemProps) => {
  const { theme } = useUnistyles();

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      style={styles.item}
    >
      <Icon
        size={theme.size['icon-lg']}
        strokeWidth={theme.size['icon-stroke']}
        color={
          isActive ? theme.colors['midnight-900'] : theme.colors['ink-muted']
        }
      />
      <Text
        variant={isActive ? 'caption-strong' : 'caption'}
        color={isActive ? 'midnight-900' : 'ink-muted'}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  item: {
    flex: 1,
    minHeight: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.size['focus-ring'],
  },
}));
