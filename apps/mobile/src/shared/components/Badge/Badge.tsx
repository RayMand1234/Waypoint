import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { ColorName } from '@/theme/tokens';
import { Text } from '../Text';

/** `value` is the sunshine "Best value" badge — one per list, on the top option. */
export type BadgeKind = 'value' | 'savings' | 'warning' | 'danger' | 'neutral';

export type BadgeProps = {
  readonly kind: BadgeKind;
  /** One to three words; shown uppercase. The words carry the meaning, not the color. */
  readonly label: string;
};

const TEXT_COLOR: Readonly<Record<BadgeKind, ColorName>> = {
  value: 'ink',
  savings: 'savings',
  warning: 'warning',
  danger: 'danger',
  neutral: 'midnight-900',
};

export const Badge = ({ kind, label }: BadgeProps) => {
  styles.useVariants({ kind });

  return (
    <View style={styles.badge}>
      <Text variant="overline" color={TEXT_COLOR[kind]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
    paddingVertical: theme.space[1],
    paddingHorizontal: theme.space[2],
    borderRadius: theme.radius.full,
    variants: {
      kind: {
        value: { backgroundColor: theme.colors['sunshine-400'] },
        savings: { backgroundColor: theme.colors['savings-100'] },
        warning: { backgroundColor: theme.colors['warning-100'] },
        danger: { backgroundColor: theme.colors['danger-100'] },
        neutral: { backgroundColor: theme.colors['midnight-100'] },
      },
    },
  },
}));
