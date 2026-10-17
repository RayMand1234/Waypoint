import { Image } from 'expo-image';
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

/** One gallery thumbnail; the shown photo's has a strong border. */
export const StayThumb = ({
  url,
  index,
  isShown,
  onPress,
}: {
  readonly url: string;
  readonly index: number;
  readonly isShown: boolean;
  readonly onPress: () => void;
}) => {
  styles.useVariants({ isShown });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Show photo ${String(index + 1)}`}
      accessibilityState={{ selected: isShown }}
      onPress={onPress}
      style={styles.frame}
    >
      <Image source={{ uri: url }} style={styles.image} contentFit="cover" />
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  frame: {
    width: theme.size['stay-thumb-w'],
    height: theme.size['stay-thumb-h'],
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    variants: {
      isShown: {
        true: {
          borderWidth: theme.size['focus-ring'],
          borderColor: theme.colors['midnight-900'],
        },
        false: {
          borderWidth: theme.size.hairline,
          borderColor: theme.colors.border,
        },
      },
    },
  },
  image: {
    flex: 1,
  },
}));
