import type { Airport } from '@waypoint/contracts/geo';
import { ActivityIndicator, ScrollView } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import type { SearchState } from '../utils/searchState';
import { ResultRow as Row } from './ResultRow';

type AirportResultsProps = {
  readonly state: SearchState<Airport>;
  /** A typed 3-letter code, offered even when the search finds nothing. */
  readonly typedCode: string | undefined;
  readonly onPick: (code: string) => void;
};

/** Search results for the airport sheet. */
export const AirportResults = ({
  state,
  typedCode,
  onPick,
}: AirportResultsProps) => {
  const { theme } = useUnistyles();
  const airports = state.status === 'error' ? [] : state.items;
  const showTyped =
    typedCode !== undefined &&
    !airports.some((airport) => airport.iata === typedCode);

  return (
    <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
      {/* Always mounted, like ResultRow's spinner. */}
      <ActivityIndicator
        animating={state.status === 'searching'}
        hidesWhenStopped
        color={theme.colors['midnight-900']}
      />
      {state.status === 'error' && (
        <Text variant="caption" color="danger">
          {state.message}
        </Text>
      )}
      {showTyped && (
        <Row
          title={typedCode}
          detail="Use this airport code"
          onPress={() => {
            onPick(typedCode);
          }}
        />
      )}
      {airports.map((airport) => (
        <Row
          key={airport.iata}
          title={`${airport.iata} · ${airport.city ?? airport.name}`}
          detail={[airport.name, airport.country]
            .filter((part) => part !== null)
            .join(', ')}
          onPress={() => {
            onPick(airport.iata);
          }}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create((theme) => ({
  list: {
    maxHeight: theme.size['sheet-list-max'],
  },
}));
