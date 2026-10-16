import type { FlightOffer } from '@waypoint/contracts/flights';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button, OfferCard, Text } from '@/shared/components';
import { flightCard } from '../utils/flightCardModel';
import type { FlightResultsState } from '../utils/flightResults';
import { FlightLegLines } from './FlightLegLines';

type FlightResultsProps = {
  readonly state: FlightResultsState;
  readonly bestValue: FlightOffer | undefined;
  readonly travelers: number;
  readonly pickedId: string | undefined;
  readonly onPick: (offerId: string) => void;
  readonly onDetails: (offerId: string) => void;
  readonly onRetry: () => void;
  readonly onClearFilters: () => void;
};

/** The fares found — while searching, when it fails, when none fit, or one card each. */
export const FlightResults = ({
  state,
  bestValue,
  travelers,
  pickedId,
  onPick,
  onDetails,
  onRetry,
  onClearFilters,
}: FlightResultsProps) => {
  const { theme } = useUnistyles();

  switch (state.status) {
    case 'loading':
      return (
        <View style={styles.status}>
          <ActivityIndicator color={theme.colors['midnight-900']} />
          <Text color="ink-muted" align="center">
            Finding flights for your dates…
          </Text>
        </View>
      );
    case 'error':
      return (
        <View style={styles.status}>
          <Text color="danger" align="center">
            {state.message}
          </Text>
          <Button label="Try again" kind="secondary" onPress={onRetry} />
        </View>
      );
    case 'loaded':
      if (state.isFilteredOut)
        return (
          <View style={styles.status}>
            <Text color="ink-muted" align="center">
              No flights match all these filters.
            </Text>
            <Button
              label="Clear filters"
              kind="secondary"
              onPress={onClearFilters}
            />
          </View>
        );

      return state.offers.length === 0 ? (
        <Text color="ink-muted" align="center">
          No flights for these dates. Try other dates in step 3.
        </Text>
      ) : (
        <View style={styles.list}>
          {state.hasMissingSources && (
            <Text variant="caption" color="ink-muted">
              Some sites didn't answer. These are the rest.
            </Text>
          )}
          {state.offers.map((offer) => {
            const card = flightCard(offer, bestValue, travelers);

            return (
              <OfferCard
                key={offer.id}
                title={card.title}
                meta={card.meta}
                details={<FlightLegLines legs={card.legs} />}
                price={card.price}
                unit={card.unit}
                {...(card.delta === undefined ? {} : { delta: card.delta })}
                badges={card.badges}
                isBestValue={card.isBestValue}
                isSelected={offer.id === pickedId}
                onPress={() => {
                  onPick(offer.id);
                }}
                info={{
                  label: `Details for ${card.title}`,
                  onPress: () => {
                    onDetails(offer.id);
                  },
                }}
              />
            );
          })}
        </View>
      );
  }
};

const styles = StyleSheet.create((theme) => ({
  status: {
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[8],
  },
  list: {
    gap: theme.space[3],
  },
}));
