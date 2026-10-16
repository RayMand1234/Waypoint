import type { PlaceSuggestion } from '@waypoint/contracts/geo';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import type { SearchState } from '../utils/searchState';
import { ResultRow } from './ResultRow';

type CityResultsProps = {
  readonly state: SearchState<PlaceSuggestion>;
  /** The city being turned into a destination, while that runs. */
  readonly addingPlaceId: string | undefined;
  readonly onPick: (placeId: string) => void;
};

/** "More cities": search results beyond our own destinations. */
export const CityResults = ({
  state,
  addingPlaceId,
  onPick,
}: CityResultsProps) => {
  const { theme } = useUnistyles();
  const cities = state.status === 'error' ? [] : state.items;

  return (
    <View style={styles.section}>
      <Text variant="subtitle">More cities</Text>
      {/* Always mounted, like ResultRow's spinner. */}
      <ActivityIndicator
        animating={state.status === 'searching'}
        hidesWhenStopped
        color={theme.colors['midnight-900']}
      />
      {state.status === 'error' && (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {state.message}
        </Text>
      )}
      {state.status === 'done' && cities.length === 0 && (
        <Text color="ink-muted">No other city matches that name.</Text>
      )}
      <View>
        {cities.map((city) => (
          <ResultRow
            key={city.placeId}
            title={city.name}
            detail={city.address}
            isLoading={city.placeId === addingPlaceId}
            onPress={() => {
              onPick(city.placeId);
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.space[2],
  },
}));
