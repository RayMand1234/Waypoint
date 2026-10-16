import type { Spot } from '@waypoint/contracts/destinations';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import {
  cardPhotoUrl,
  spotMeta,
  topPickIds,
  topPicksFirst,
} from '../utils/spotRowModel';
import { SpotCard } from './SpotCard';

const COLUMNS = 2;

type SpotListProps = {
  readonly spots: readonly Spot[];
  readonly selectedIds: readonly string[];
  readonly fitLabel: string;
  readonly fits: boolean;
  readonly onToggle: (spotId: string) => void;
  readonly onInfo: (spotId: string) => void;
};

/** "Recommended spots" with the fit check, then a two-column grid of photo cards: top picks first, then best fit. */
export const SpotList = ({
  spots,
  selectedIds,
  fitLabel,
  fits,
  onToggle,
  onInfo,
}: SpotListProps) => {
  const topPicks = topPickIds(spots);
  const ordered = topPicksFirst(spots, topPicks);

  if (spots.length === 0)
    return (
      <View style={styles.section}>
        <Text variant="subtitle">Recommended spots</Text>
        <Text color="ink-muted">
          We haven't picked spots here yet. Set your dates and travelers, and
          we'll still find your flights and stay.
        </Text>
      </View>
    );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="subtitle">Recommended spots</Text>
        <Text
          variant="caption-strong"
          color={fits ? 'midnight-900' : 'warning'}
          accessibilityLiveRegion="polite"
        >
          {fitLabel}
        </Text>
      </View>
      <View style={styles.grid}>
        {Array.from({ length: Math.ceil(ordered.length / COLUMNS) }, (_, row) =>
          ordered.slice(row * COLUMNS, (row + 1) * COLUMNS),
        ).map((pair) => (
          <View key={pair[0]?.id} style={styles.row}>
            {pair.map((spot) => (
              <SpotCard
                key={spot.id}
                name={spot.name}
                meta={spotMeta(spot)}
                photoUrl={
                  spot.photo === null ? null : cardPhotoUrl(spot.photo.url)
                }
                isTopPick={topPicks.has(spot.id)}
                isSelected={selectedIds.includes(spot.id)}
                onPress={() => {
                  onToggle(spot.id);
                }}
                onInfo={() => {
                  onInfo(spot.id);
                }}
              />
            ))}
            {/* An odd last card keeps its column's width. */}
            {pair.length < COLUMNS && <View style={styles.filler} />}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.space[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  grid: {
    gap: theme.space[3],
  },
  row: {
    flexDirection: 'row',
    gap: theme.space[3],
  },
  filler: {
    flex: 1,
  },
}));
