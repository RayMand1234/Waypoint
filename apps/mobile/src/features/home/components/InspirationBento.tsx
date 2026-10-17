import type { DestinationSuggestion } from '@waypoint/contracts/destinations';
import { assertNever } from '@waypoint/contracts/common';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { bentoLayout, type BentoBlock } from '../utils/bentoLayout';
import { InspirationTile } from './InspirationTile';

type InspirationBentoProps = {
  /** "Worth the trip this autumn". */
  readonly title: string;
  /** "Picked for your styles: views, food and culture". */
  readonly line: string;
  readonly places: readonly DestinationSuggestion[];
  readonly onPick: (place: DestinationSuggestion) => void;
  readonly onSeeAll: () => void;
};

/** Places worth the trip, as a two-column grid of photos: a wide tile, then a tall one beside two squares. */
export const InspirationBento = ({
  title,
  line,
  places,
  onPick,
  onSeeAll,
}: InspirationBentoProps) => {
  const { theme } = useUnistyles();
  const tile = (
    place: DestinationSuggestion,
    shape: 'wide' | 'tall' | 'square',
  ) => (
    <InspirationTile
      key={place.id}
      place={place}
      shape={shape}
      onPress={() => {
        onPick(place);
      }}
    />
  );
  const block = (item: BentoBlock<DestinationSuggestion>, index: number) => {
    switch (item.kind) {
      case 'wide':
        return <View key={index}>{tile(item.tile, 'wide')}</View>;
      case 'pair':
        return (
          <View key={index} style={styles.pair}>
            {item.tiles.map((place) => tile(place, 'square'))}
          </View>
        );
      case 'cluster':
        return (
          <View key={index} style={styles.cluster}>
            {tile(item.tall, 'tall')}
            <View style={styles.squares}>
              {item.squares.map((place) => tile(place, 'square'))}
            </View>
          </View>
        );
      default:
        return assertNever(item);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        <Pressable
          accessibilityRole="link"
          onPress={onSeeAll}
          // The link is small; its touch area isn't.
          hitSlop={theme.space[3]}
        >
          <Text variant="delta" color="midnight-900">
            See all
          </Text>
        </Pressable>
      </View>
      <Text variant="body-sm" color="ink-muted">
        {line}
      </Text>
      <View style={styles.grid}>{bentoLayout(places).map(block)}</View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.space[1],
    paddingHorizontal: theme.space[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space[3],
  },
  grid: {
    gap: theme.space[3],
    marginTop: theme.space[3],
  },
  pair: {
    flexDirection: 'row',
    gap: theme.space[3],
    height: theme.size['bento-row-h'],
  },
  cluster: {
    flexDirection: 'row',
    gap: theme.space[3],
    height: theme.size['bento-row-h'] * 2 + theme.space[3],
  },
  squares: {
    flex: 1,
    gap: theme.space[3],
  },
}));
