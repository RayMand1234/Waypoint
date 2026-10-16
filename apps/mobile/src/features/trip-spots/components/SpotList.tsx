import type { Spot } from '@waypoint/contracts/destinations';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { spotMeta, topPickIds } from '../utils/spotRowModel';
import { SpotRow } from './SpotRow';

type SpotListProps = {
  readonly spots: readonly Spot[];
  readonly selectedIds: readonly string[];
  readonly fitLabel: string;
  readonly fits: boolean;
  readonly onToggle: (spotId: string) => void;
};

/** "Recommended spots" with the fit check, then one checkbox row per spot (best fit first). */
export const SpotList = ({
  spots,
  selectedIds,
  fitLabel,
  fits,
  onToggle,
}: SpotListProps) => {
  const topPicks = topPickIds(spots);

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
      <View style={styles.list}>
        {spots.map((spot, index) => (
          <SpotRow
            key={spot.id}
            name={spot.name}
            meta={spotMeta(spot)}
            isTopPick={topPicks.has(spot.id)}
            isSelected={selectedIds.includes(spot.id)}
            isFirst={index === 0}
            onPress={() => {
              onToggle(spot.id);
            }}
          />
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
  list: {
    borderRadius: theme.radius.lg,
    borderWidth: theme.size.hairline,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors['surface-card'],
    overflow: 'hidden',
  },
}));
