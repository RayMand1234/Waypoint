import { MapPin } from 'lucide-react-native';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import type { TripCardModel } from '../utils/tripCardModel';

type TripThumbProps = Pick<TripCardModel, 'code' | 'tone'>;

/** The square tile with the destination's letters: sunshine for drafts, midnight for ready trips, plain when past. */
export const TripThumb = ({ code, tone }: TripThumbProps) => {
  const { theme } = useUnistyles();

  styles.useVariants({ tone });

  return (
    <View
      style={styles.thumb}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {code === null ? (
        <MapPin
          size={theme.size['icon-lg']}
          strokeWidth={theme.size['icon-stroke']}
          color={theme.colors['midnight-900']}
        />
      ) : (
        <Text
          variant="thumb"
          color={tone === 'past' ? 'ink-muted' : 'midnight-900'}
        >
          {code}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  thumb: {
    width: theme.size['trip-thumb'],
    height: theme.size['trip-thumb'],
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    variants: {
      tone: {
        draft: { backgroundColor: theme.colors['sunshine-100'] },
        ready: { backgroundColor: theme.colors['midnight-100'] },
        past: {
          backgroundColor: theme.colors.surface,
          borderWidth: theme.size.hairline,
          borderColor: theme.colors.border,
        },
      },
    },
  },
}));
