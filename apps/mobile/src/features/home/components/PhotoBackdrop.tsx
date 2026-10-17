import { Image } from 'expo-image';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';

const FADE_IN_MS = 250;

export type PhotoWash = 'hero' | 'card' | 'tile' | 'none';

type PhotoBackdropProps = {
  /** Already sized for where it shows; `null` shows the stand-in. */
  readonly uri: string | null;
  /** Letters on the stand-in when there's no photo (the destination code). */
  readonly fallback?: string | null;
  /** What's laid over the photo so text on it stays readable. */
  readonly wash: PhotoWash;
};

/**
 * A photo filling its parent (which sets size and corners), under a wash: the
 * hero's midnight gradient, or a dark fade at the bottom of a card. Midnight-100
 * shows while it loads, and stands in, with the destination code, without one.
 * Decorative: screen readers skip it.
 */
export const PhotoBackdrop = ({
  uri,
  fallback = null,
  wash,
}: PhotoBackdropProps) => {
  const reduceMotion = useReducedMotion();

  styles.useVariants({ wash });

  return (
    <View
      style={styles.fill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {uri === null ? (
        fallback !== null && (
          <View style={styles.standIn}>
            <Text variant="thumb" color="midnight-900">
              {fallback}
            </Text>
          </View>
        )
      ) : (
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          transition={reduceMotion ? 0 : FADE_IN_MS}
        />
      )}
      <View style={styles.wash} />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  fill: {
    ...StyleSheet.absoluteFillObject,
    variants: {
      wash: {
        hero: { backgroundColor: theme.colors['midnight-900'] },
        card: { backgroundColor: theme.colors['midnight-100'] },
        tile: { backgroundColor: theme.colors['midnight-100'] },
        none: { backgroundColor: theme.colors['midnight-100'] },
      },
    },
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  standIn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    variants: {
      wash: {
        // Readable at the top (greeting) and bottom (section header); the photo shows in between.
        hero: {
          experimental_backgroundImage: `linear-gradient(180deg, ${theme.colors['photo-wash-top']} 0%, ${theme.colors['photo-wash-mid']} 40%, ${theme.colors['photo-wash-bottom']} 100%)`,
        },
        card: {
          experimental_backgroundImage: `linear-gradient(180deg, transparent 35%, ${theme.colors['photo-fade']} 100%)`,
        },
        tile: {
          experimental_backgroundImage: `linear-gradient(180deg, transparent 40%, ${theme.colors['photo-fade']} 100%)`,
        },
        none: {},
      },
    },
  },
}));
