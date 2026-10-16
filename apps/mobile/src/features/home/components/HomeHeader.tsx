import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';

type HomeHeaderProps = {
  readonly greeting: string;
  readonly hiLine: string;
  readonly initial: string;
  readonly onProfilePress: () => void;
};

export const HomeHeader = ({
  greeting,
  hiLine,
  initial,
  onProfilePress,
}: HomeHeaderProps) => (
  <View style={styles.header}>
    <View style={styles.text}>
      <Text variant="caption" color="ink-muted">
        {greeting}
      </Text>
      <Text variant="title-lg" accessibilityRole="header">
        {hiLine}
      </Text>
    </View>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profile"
      onPress={onProfilePress}
      style={styles.avatar}
    >
      <Text variant="body-strong" color="midnight-900">
        {initial}
      </Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.space[6],
    paddingBottom: theme.space[2],
  },
  text: {
    gap: theme.size['focus-ring'],
  },
  avatar: {
    width: theme.size['tap-min'],
    height: theme.size['tap-min'],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors['midnight-100'],
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
