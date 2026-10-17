import { ArrowRight, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { photoAtWidth } from '@/shared/utils/photoUrl';
import type { TripCardModel } from '../utils/tripCardModel';
import { PhotoBackdrop } from './PhotoBackdrop';
import { TripProgress } from './TripProgress';

const DELETE_ACTION = [{ name: 'delete', label: 'Delete draft' }];

type TripPostcardProps = {
  readonly card: TripCardModel;
  readonly onPress: () => void;
  /** A draft's X button, a long-press, or the screen reader's action. */
  readonly onDelete: () => void;
};

/**
 * One trip as a photo postcard: its code on top; city with its status pill,
 * dates, progress and what's next at the bottom. A draft has an X in the
 * top-left corner that deletes it (holding the card does too).
 */
export const TripPostcard = ({
  card,
  onPress,
  onDelete,
}: TripPostcardProps) => {
  const { theme } = useUnistyles();

  styles.useVariants({ isDraft: card.tone === 'draft' });

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={card.label}
        {...(card.canDelete
          ? {
              accessibilityActions: DELETE_ACTION,
              onAccessibilityAction: onDelete,
              onLongPress: onDelete,
            }
          : {})}
        onPress={onPress}
        style={styles.clip}
      >
        <PhotoBackdrop
          uri={card.photo === null ? null : photoAtWidth(card.photo.url, 960)}
          fallback={card.code}
          wash="card"
        />
        <View style={styles.top}>
          {/* Without a photo, the stand-in already shows the code. */}
          {card.code !== null && card.photo !== null && (
            <Text variant="overline" color="on-photo-muted">
              {card.code}
            </Text>
          )}
        </View>
        <View style={styles.body}>
          <View style={styles.cityRow}>
            <View style={styles.city}>
              <Text
                variant="postcard-city"
                color="on-midnight"
                numberOfLines={1}
              >
                {card.title}
              </Text>
            </View>
            <View style={styles.pill}>
              <Text
                variant="overline"
                color={card.tone === 'draft' ? 'ink' : 'midnight-900'}
              >
                {card.pill.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text variant="body-sm" color="on-photo-muted" numberOfLines={1}>
            {card.line}
          </Text>
          {card.progress !== null && (
            <View style={styles.progress}>
              <TripProgress completed={card.progress} onPhoto />
            </View>
          )}
          <View style={styles.next}>
            <Text
              variant="caption-strong"
              color="on-midnight"
              numberOfLines={1}
            >
              {card.action.text}
            </Text>
            {card.action.isLink && (
              <ArrowRight
                size={theme.size['icon-sm']}
                strokeWidth={theme.size['icon-stroke']}
                color={theme.colors['on-midnight']}
              />
            )}
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
          <View style={styles.deleteCircle}>
            <X
              size={theme.size['icon-sm']}
              strokeWidth={theme.size['icon-stroke']}
              color={theme.colors['on-midnight']}
            />
          </View>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  card: {
    width: theme.size['postcard-w'],
    height: theme.size['postcard-h'],
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.lifted,
  },
  // Corners clip the photo; the shadow sits on the card outside them.
  clip: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: theme.radius.lg,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: theme.space[3] + theme.size['focus-ring'],
  },
  pill: {
    paddingHorizontal: theme.space[2] + theme.size['focus-ring'],
    paddingVertical: theme.size['focus-ring'],
    borderRadius: theme.radius.full,
    variants: {
      isDraft: {
        true: { backgroundColor: theme.colors['sunshine-400'] },
        false: { backgroundColor: theme.colors['surface-card'] },
      },
    },
  },
  body: {
    position: 'absolute',
    left: theme.space[4] + theme.size['focus-ring'],
    right: theme.space[4] + theme.size['focus-ring'],
    bottom: theme.space[4] + theme.size['focus-ring'],
    gap: theme.size['focus-ring'],
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
  city: {
    flexShrink: 1,
  },
  progress: {
    marginTop: theme.space[2],
  },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
    marginTop: theme.space[2],
  },
  // The card's top-left corner.
  delete: {
    position: 'absolute',
    left: theme.space[1],
    top: theme.space[1],
    width: theme.size['tap-min'],
    height: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCircle: {
    width: theme.size['icon-lg'] + theme.space[2],
    height: theme.size['icon-lg'] + theme.space[2],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    borderWidth: theme.size.hairline,
    borderColor: theme.colors['frost-border'],
    // Dark enough to show on a light stand-in as well as on a photo.
    backgroundColor: theme.colors.scrim,
  },
}));
