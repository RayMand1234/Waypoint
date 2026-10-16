import type { TripListItem } from '@waypoint/contracts/trips';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { errorMessage } from '@/shared/utils/errorMessage';
import type { TripTarget } from '../utils/tripCardModel';
import { toTripCard } from '../utils/tripCardModel';
import { TripCard } from './TripCard';
import { TripsEmpty, TripsError, TripsLoading } from './TripsStates';

type TripsSectionProps = {
  readonly trips:
    | { readonly status: 'pending' }
    | { readonly status: 'error'; readonly error: unknown }
    | { readonly status: 'success'; readonly data: readonly TripListItem[] };
  readonly onRetry: () => void;
  readonly onOpen: (trip: TripListItem, target: TripTarget) => void;
  readonly onDelete: (tripId: string, title: string) => void;
};

/** "My waypoints": drafts, planned, booked and past trips, newest first. */
export const TripsSection = ({
  trips,
  onRetry,
  onOpen,
  onDelete,
}: TripsSectionProps) => (
  <View style={styles.section}>
    <Text variant="title" accessibilityRole="header">
      My waypoints
    </Text>
    {trips.status === 'pending' && <TripsLoading />}
    {trips.status === 'error' && (
      <TripsError message={errorMessage(trips.error)} onRetry={onRetry} />
    )}
    {trips.status === 'success' && trips.data.length === 0 && <TripsEmpty />}
    {trips.status === 'success' &&
      trips.data.map((trip) => {
        const card = toTripCard(trip);

        return (
          <TripCard
            key={trip.id}
            card={card}
            onPress={() => {
              onOpen(trip, card.target);
            }}
            onDelete={() => {
              onDelete(trip.id, card.title);
            }}
          />
        );
      })}
  </View>
);

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.space[3],
  },
}));
