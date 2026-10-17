import type { HotelReview, HotelReviews } from '@waypoint/contracts/hotels';
import { Minus, Plus } from 'lucide-react-native';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import {
  hasSomethingToSay,
  reviewByline,
  reviewCount,
  scoreText,
} from '../utils/reviewModel';

const REVIEW_LINES = 4;

/** Phrases guests repeat, as small pills. */
const Phrases = ({
  label,
  phrases,
}: {
  readonly label: string;
  readonly phrases: readonly string[];
}) => (
  <View style={styles.phrases}>
    <Text variant="caption" color="ink-muted">
      {label}
    </Text>
    <View style={styles.pills}>
      {phrases.map((phrase) => (
        <View key={phrase} style={styles.pill}>
          <Text variant="caption">{phrase}</Text>
        </View>
      ))}
    </View>
  </View>
);

/** A line of what the guest liked (+) or didn't (−). */
const Said = ({
  text,
  isLiked,
}: {
  readonly text: string;
  readonly isLiked: boolean;
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
      <View style={styles.saidText}>
        <Text variant="body-sm" numberOfLines={REVIEW_LINES}>
          {text}
        </Text>
      </View>
    </View>
  );
};

const Review = ({ review }: { readonly review: HotelReview }) => (
  <View style={styles.review}>
    <View style={styles.reviewHead}>
      <View
        style={styles.score}
        accessibilityLabel={`${scoreText(review.score)} out of 10`}
      >
        <Text variant="caption-strong" color="midnight-900" tabular>
          {scoreText(review.score)}
        </Text>
      </View>
      <View style={styles.saidText}>
        <Text variant="caption" color="ink-muted" numberOfLines={1}>
          {reviewByline(review)}
        </Text>
      </View>
    </View>
    {review.headline !== null && (
      <Text variant="body-strong">{review.headline}</Text>
    )}
    {review.liked !== null && <Said text={review.liked} isLiked />}
    {review.disliked !== null && (
      <Said text={review.disliked} isLiked={false} />
    )}
  </View>
);

/**
 * What guests say: how many reviews there are, what they like and dislike
 * most, and the best few written reviews, unedited. Nothing shows until they
 * load, or when there's nothing to say.
 */
export const StayReviews = ({
  reviews,
}: {
  readonly reviews: HotelReviews | undefined;
}) => {
  if (reviews === undefined || !hasSomethingToSay(reviews)) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="subtitle" accessibilityRole="header">
          What guests say
        </Text>
        <Text variant="caption" color="ink-muted">
          {reviewCount(reviews.total)}
        </Text>
      </View>
      {reviews.likes.length > 0 && (
        <Phrases label="Guests like" phrases={reviews.likes} />
      )}
      {reviews.dislikes.length > 0 && (
        <Phrases label="Some mention" phrases={reviews.dislikes} />
      )}
      {reviews.reviews.map((review) => (
        <Review key={`${review.date}-${review.name ?? ''}`} review={review} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.space[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.space[3],
  },
  phrases: {
    gap: theme.space[2],
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  pill: {
    paddingVertical: theme.space[1],
    paddingHorizontal: theme.space[3],
    borderRadius: theme.radius.full,
    borderWidth: theme.size.hairline,
    borderColor: theme.colors.border,
  },
  review: {
    gap: theme.space[2],
    padding: theme.space[3],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  reviewHead: {
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
  saidText: {
    flex: 1,
    minWidth: 0,
  },
}));
