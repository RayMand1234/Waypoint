import { ActivityIndicator, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';

type ResultRowProps = {
  readonly title: string;
  readonly detail: string;
  readonly isLoading?: boolean;
  readonly onPress: () => void;
};

/** One search result: a name and where it is. */
export const ResultRow = ({
  title,
  detail,
  isLoading = false,
  onPress,
}: ResultRowProps) => {
  const { theme } = useUnistyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${detail}`}
      accessibilityState={{ busy: isLoading }}
      disabled={isLoading}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.text}>
        <Text variant="body-strong">{title}</Text>
        <Text variant="caption" color="ink-muted" numberOfLines={1}>
          {detail}
        </Text>
      </View>
      {/* Always mounted: a spinner mounted beside the row's text and then
          unmounted with the list crashes Fabric's mounting on iOS. */}
      <ActivityIndicator
        animating={isLoading}
        hidesWhenStopped
        color={theme.colors['midnight-900']}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    minHeight: theme.size['tap-min'],
    paddingVertical: theme.space[2],
    borderBottomWidth: theme.size.hairline,
    borderColor: theme.colors.border,
  },
  text: {
    flex: 1,
  },
}));
