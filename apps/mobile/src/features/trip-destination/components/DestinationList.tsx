import type { DestinationSuggestion } from '@waypoint/contracts/destinations';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { toDestinationCard } from '../utils/destinationCardModel';
import { DestinationCard } from './DestinationCard';

type DestinationListProps = {
  readonly destinations: readonly DestinationSuggestion[];
  readonly selectedId: string;
  readonly onSelect: (destination: DestinationSuggestion) => void;
};

/** The suggestions, best match first; one can be chosen. */
export const DestinationList = ({
  destinations,
  selectedId,
  onSelect,
}: DestinationListProps) => (
  <View
    style={styles.list}
    accessibilityRole="radiogroup"
    accessibilityLabel="Destinations"
  >
    {destinations.length === 0 ? (
      <Text color="ink-muted">No destination matches that yet.</Text>
    ) : (
      destinations.map((destination) => (
        <DestinationCard
          key={destination.id}
          card={toDestinationCard(destination)}
          isSelected={destination.id === selectedId}
          onPress={() => {
            onSelect(destination);
          }}
        />
      ))
    )}
  </View>
);

const styles = StyleSheet.create((theme) => ({
  list: {
    gap: theme.space[3],
  },
}));
