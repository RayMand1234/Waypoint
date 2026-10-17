import type { HotelReview } from '@waypoint/contracts/hotels';
import { Minus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { reviewByline, scoreText } from '../utils/reviewModel';

/** A long line is cut here until the review is opened. */
const CLAMPED_LINES = 4;

/**
 * A line of what the guest liked (+) or didn't (−), cut to a few lines
 * unless open. An unseen full-length copy measures it, so the card knows
 * whether there's more to read without anything jumping.
 */
const Said = ({
  text,
  isLiked,
  isOpen,
  onLong,
}: {
  readonly text: string;
  readonly isLiked: boolean;
  readonly isOpen: boolean;
  /** It runs past the cut. */
  readonly onLong: () => void;
}) => {
  const { theme } = useUnistyles();
  const Icon = isLiked ? Plus : Minus;

  return (
    <View style={styles.said}>
      <Icon
        size={theme.size['icon-sm']}
        strokeWidth={theme.size['icon-stroke-bold']}
        color={isLiked ? theme.colors.savings : theme.colors['ink-muted']}
        accessibilityLabel={isLiked ? 'Liked' : 'Disliked'}
      />
      <View style={styles.text}>
        <Text
          variant="body-sm"
          {...(isOpen ? {} : { numberOfLines: CLAMPED_LINES })}
        >
          {text}
        </Text>
        <View
          style={styles.measure}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text
            variant="body-sm"
            onTextLayout={({ nativeEvent }) => {
              if (nativeEvent.lines.length > CLAMPED_LINES) onLong();
            }}
          >
            {text}
          </Text>
        </View>
      </View>
    </View>
  );
};

/**
 * One guest review: score, who and when, headline, and what they liked and
 * didn't. A long one is cut to a few lines; tapping it opens it in full,
 * tapping again closes it.
 */
export const ReviewCard = ({ review }: { readonly review: HotelReview }) => {
  const [isOpen, setOpen] = useState(false);
  const [isLong, setLong] = useState(false);
  const markLong = (): void => {
    setLong(true);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen, disabled: !isLong }}
      accessibilityHint={
        isLong ? (isOpen ? 'Shows less' : 'Shows the whole review') : undefined
      }
      disabled={!isLong}
      onPress={() => {
        setOpen((open) => !open);
      }}
      style={styles.review}
    >
      <View style={styles.head}>
        <View
          style={styles.score}
          accessibilityLabel={`${scoreText(review.score)} out of 10`}
        >
          <Text variant="caption-strong" color="midnight-900" tabular>
            {scoreText(review.score)}
          </Text>
        </View>
        <View style={styles.text}>
          <Text variant="caption" color="ink-muted" numberOfLines={1}>
            {reviewByline(review)}
          </Text>
        </View>
      </View>
      {review.headline !== null && (
        <Text variant="body-strong">{review.headline}</Text>
      )}
      {review.liked !== null && (
        <Said text={review.liked} isLiked isOpen={isOpen} onLong={markLong} />
      )}
      {review.disliked !== null && (
        <Said
          text={review.disliked}
          isLiked={false}
          isOpen={isOpen}
          onLong={markLong}
        />
      )}
      {isLong && (
        <Text variant="caption-strong" color="midnight-900">
          {isOpen ? 'Show less' : 'Read more'}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  review: {
    gap: theme.space[2],
    padding: theme.space[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
  score: {
    minWidth: theme.size['icon-lg'] + theme.space[2],
    alignItems: 'center',
    paddingVertical: theme.size['focus-ring'],
    paddingHorizontal: theme.space[2],
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors['midnight-100'],
  },
  said: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space[2],
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  // Same width as the shown text, laid out but never seen.
  measure: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
  },
}));
