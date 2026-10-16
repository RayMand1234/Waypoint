import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Badge, Text } from '@/shared/components';
import type { TripCardModel } from '../utils/tripCardModel';
import { TripProgress } from './TripProgress';
import { TripThumb } from './TripThumb';

type TripCardProps = {
  readonly card: TripCardModel;
  readonly onPress: () => void;
};

/** One row of "My waypoints". */
export const TripCard = ({ card, onPress }: TripCardProps) => {
  styles.useVariants({ isPast: card.tone === 'past' });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${card.title}, ${card.line}. ${card.action.text}`}
      onPress={onPress}
      style={styles.card}
    >
      <TripThumb code={card.code} tone={card.tone} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="subtitle" numberOfLines={1}>
            {card.title}
          </Text>
          {card.status.kind === 'badge' ? (
            <Badge {...card.status.badge} />
          ) : (
            <Text variant="caption" color="ink-muted">
              {card.status.text}
            </Text>
          )}
        </View>
        <Text variant="body-sm" color="ink-muted">
          {card.line}
        </Text>
        {card.progress !== null && <TripProgress completed={card.progress} />}
        <Text
          variant={card.action.isLink ? 'caption-strong' : 'caption'}
          color={card.action.isLink ? 'midnight-900' : 'ink-muted'}
        >
          {card.action.text}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    gap: theme.space[3],
    padding: theme.space[3],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors['surface-card'],
    borderWidth: theme.size.hairline,
    borderColor: theme.colors.border,
    variants: {
      isPast: {
        true: {},
        false: { boxShadow: theme.shadow.card },
      },
    },
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: theme.space[1] + theme.size['focus-ring'],
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.space[2],
  },
}));
