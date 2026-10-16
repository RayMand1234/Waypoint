import { Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Badge, Text } from '@/shared/components';
import type { TripCardModel } from '../utils/tripCardModel';
import { TripProgress } from './TripProgress';
import { TripThumb } from './TripThumb';

type TripCardProps = {
  readonly card: TripCardModel;
  readonly onPress: () => void;
  /** Shown as a trash button in the corner, for drafts. */
  readonly onDelete: () => void;
};

/** One row of "My waypoints"; a draft has a trash button in its bottom-right corner. */
export const TripCard = ({ card, onPress, onDelete }: TripCardProps) => {
  const { theme } = useUnistyles();

  styles.useVariants({
    isPast: card.tone === 'past',
    canDelete: card.canDelete,
  });

  return (
    <View>
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
          <View style={styles.action}>
            <Text
              variant={card.action.isLink ? 'caption-strong' : 'caption'}
              color={card.action.isLink ? 'midnight-900' : 'ink-muted'}
            >
              {card.action.text}
            </Text>
          </View>
        </View>
      </Pressable>
      {card.canDelete && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete draft ${card.title}`}
          onPress={onDelete}
          style={styles.delete}
        >
          <Trash2
            size={theme.size['icon-md']}
            strokeWidth={theme.size['icon-stroke']}
            color={theme.colors['ink-muted']}
          />
        </Pressable>
      )}
    </View>
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
  action: {
    variants: {
      // Room for the trash button beside the bottom line only, so the badge stays top-right.
      canDelete: {
        true: { paddingRight: theme.size['tap-min'] },
        false: {},
      },
    },
  },
  delete: {
    position: 'absolute',
    right: theme.space[1],
    bottom: theme.space[1],
    width: theme.size['tap-min'],
    height: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.space[2],
  },
}));
