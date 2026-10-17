import type { HotelReviews } from '@waypoint/contracts/hotels';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { hasSomethingToSay, reviewCount } from '../utils/reviewModel';
import { ReviewCard } from './ReviewCard';

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
        <ReviewCard
          key={`${review.date}-${review.name ?? ''}`}
          review={review}
        />
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
}));
