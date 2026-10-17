import { FlatList, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { TripCardModel } from '../utils/tripCardModel';
import { TripPostcard } from './TripPostcard';

type TripsRailProps = {
  readonly cards: readonly TripCardModel[];
  /** A grey postcard holds the place while the trips load. */
  readonly isLoading: boolean;
  readonly onOpen: (tripId: string) => void;
  readonly onDelete: (tripId: string) => void;
};

/**
 * The trips still to come as postcards in a sideways, snapping row that rises
 * over the hero, ending with the dashed new-waypoint card.
 */
export const TripsRail = ({
  cards,
  isLoading,
  onOpen,
  onDelete,
}: TripsRailProps) => {
  const { theme } = useUnistyles();

  return (
    <FlatList
      horizontal
      accessibilityRole="list"
      accessibilityLabel="Your waypoints"
      data={cards}
      keyExtractor={(card) => card.id}
      renderItem={({ item }) => (
        <TripPostcard
          card={item}
          onPress={() => {
            onOpen(item.id);
          }}
          onDelete={() => {
            onDelete(item.id);
          }}
        />
      )}
      ListHeaderComponent={
        isLoading ? <View style={styles.placeholder} /> : null
      }
      showsHorizontalScrollIndicator={false}
      snapToInterval={theme.size['postcard-w'] + theme.space[3]}
      decelerationRate="fast"
      contentContainerStyle={styles.rail}
      style={styles.list}
    />
  );
};

const styles = StyleSheet.create((theme) => ({
  list: {
    // Rises over the bottom of the hero.
    marginTop: -theme.size['postcard-overlap'],
    overflow: 'visible',
  },
  rail: {
    gap: theme.space[3],
    paddingHorizontal: theme.space[6],
    // A sideways list clips what's outside it: room for the cards' shadows.
    paddingBottom: theme.space[8] + theme.space[1],
  },
  placeholder: {
    width: theme.size['postcard-w'],
    height: theme.size['postcard-h'],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors['midnight-100'],
    boxShadow: theme.shadow.lifted,
  },
}));
