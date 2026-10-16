import type { HotelDetail, HotelOffer } from '@waypoint/contracts/hotels';
import { MapPin, Star } from 'lucide-react-native';
import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import {
  CANCELLATION_TEXT,
  ratingWords,
  type StayCardModel,
} from '../utils/stayCardModel';

const MAX_FACILITIES = 8;

/** Rating, nearness, the room's terms, and what the hotel has. */
export const StayFacts = ({
  offer,
  card,
  detail,
}: {
  readonly offer: HotelOffer;
  readonly card: StayCardModel;
  /** Loads after the sheet opens. */
  readonly detail: HotelDetail | undefined;
}) => {
  const { theme } = useUnistyles();
  const { rating, reviewCount } = offer.hotel;
  const rows = [
    ['Room', offer.roomName],
    ['Meals', offer.boardName ?? 'Room only'],
    ['Cancellation', CANCELLATION_TEXT[offer.cancellation]],
    [
      'Check-in / out',
      `${detail?.checkinFrom ?? '—'} / ${detail?.checkoutUntil ?? '—'}`,
    ],
  ] as const;

  return (
    <View style={styles.facts}>
      <View style={styles.lines}>
        {rating !== null && (
          <View style={styles.line}>
            <Star
              size={theme.size['icon-sm']}
              fill={theme.colors['midnight-900']}
              color={theme.colors['midnight-900']}
            />
            <Text variant="body-strong">
              {`${rating.toFixed(1)} ${ratingWords(rating)}`}
            </Text>
            {reviewCount !== null && (
              <Text variant="caption" color="ink-muted">
                {`· ${String(reviewCount)} guest reviews`}
              </Text>
            )}
          </View>
        )}
        {card.note !== null && (
          <View style={styles.line}>
            <MapPin
              size={theme.size['icon-sm']}
              strokeWidth={theme.size['icon-stroke']}
              color={theme.colors['midnight-900']}
            />
            <Text variant="caption-strong">{card.note}</Text>
          </View>
        )}
      </View>
      <View style={styles.rows}>
        {rows.map(([term, value]) => (
          <View key={term} style={styles.row}>
            <Text variant="body-sm" color="ink-muted">
              {term}
            </Text>
            <View style={styles.value}>
              <Text variant="label" align="right">
                {value}
              </Text>
            </View>
          </View>
        ))}
      </View>
      {detail !== undefined && detail.facilities.length > 0 && (
        <View style={styles.facilities}>
          {detail.facilities.slice(0, MAX_FACILITIES).map((facility) => (
            <View key={facility} style={styles.facility}>
              <Text variant="caption">{facility}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  facts: {
    gap: theme.space[6],
  },
  lines: {
    gap: theme.space[2],
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
  rows: {
    gap: theme.space[3],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.space[3],
  },
  value: {
    flexShrink: 1,
  },
  facilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  facility: {
    paddingVertical: theme.space[1],
    paddingHorizontal: theme.space[3],
    borderRadius: theme.radius.full,
    borderWidth: theme.size.hairline,
    borderColor: theme.colors.border,
  },
}));
