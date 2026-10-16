import type { DestinationSuggestion } from '@waypoint/contracts/destinations';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Input, Text } from '@/shared/components';
import { useDestinationPicker } from '../hooks/useDestinationPicker';
import type { ChosenDestination } from '../utils/destinationFormSchema';
import { CityResults } from './CityResults';
import { DestinationList } from './DestinationList';

type DestinationPickerProps = {
  readonly suggestions: readonly DestinationSuggestion[];
  readonly value: ChosenDestination | null;
  readonly onChange: (destination: ChosenDestination) => void;
};

/**
 * Our suggestions, and a search over every city: matching suggestions first,
 * then other cities from search, each turned into a destination when picked.
 */
export const DestinationPicker = ({
  suggestions,
  value,
  onChange,
}: DestinationPickerProps) => {
  const picker = useDestinationPicker(suggestions, onChange);

  return (
    <>
      <Input
        label="Search"
        placeholder="Already know? Search any city"
        value={picker.search}
        onChangeText={picker.setSearch}
        autoCorrect={false}
        returnKeyType="search"
      />
      {picker.showPicks && (
        <View style={styles.section}>
          <Text variant="subtitle">
            {picker.isSearching ? 'Our picks' : 'Suggested for you'}
          </Text>
          <DestinationList
            destinations={picker.picks}
            selectedId={value?.id ?? ''}
            onSelect={picker.pickSuggestion}
          />
        </View>
      )}
      {picker.isSearching && (
        <CityResults
          state={picker.cities}
          addingPlaceId={picker.addingPlaceId}
          onPick={picker.pickCity}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.space[3],
  },
}));
