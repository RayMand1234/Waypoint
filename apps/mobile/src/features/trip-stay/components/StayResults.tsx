import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button, OfferCard, Text } from '@/shared/components';
import { stayCard } from '../utils/stayCardModel';
import type { StayResultsState } from '../utils/stayResults';

type StayResultsProps = {
  readonly state: StayResultsState;
  readonly pickedId: string | undefined;
  readonly onPick: (hotelId: string) => void;
  readonly onDetails: (hotelId: string) => void;
  readonly onRetry: () => void;
};

/** The stays found — while searching, when it fails, when none are free, or one card each. */
export const StayResults = ({
  state,
  pickedId,
  onPick,
  onDetails,
  onRetry,
}: StayResultsProps) => {
  const { theme } = useUnistyles();

  switch (state.status) {
    case 'loading':
      return (
        <View style={styles.status}>
          <ActivityIndicator color={theme.colors['midnight-900']} />
          <Text color="ink-muted" align="center">
            Finding stays near your spots…
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
      return state.offers.length === 0 ? (
        <Text color="ink-muted" align="center">
          No stays have free rooms for these dates. Try other dates in step 3.
        </Text>
      ) : (
        <View style={styles.list}>
          {state.hasMissingSources && (
            <Text variant="caption" color="ink-muted">
              Some booking sites didn't answer. These are the rest.
            </Text>
          )}
          {state.offers.map((offer) => {
            const card = stayCard(offer, state.highlights);
            const hotelId = offer.hotel.id;

            return (
              <OfferCard
                key={hotelId}
                title={card.title}
                meta={card.meta}
                {...(card.note === null ? {} : { note: card.note })}
                price={card.price}
                unit={card.unit}
                {...(card.delta === undefined ? {} : { delta: card.delta })}
                badges={card.badges}
                isBestValue={card.isBestValue}
                isSelected={hotelId === pickedId}
                photoUrl={offer.hotel.mainPhotoUrl}
                onPress={() => {
                  onPick(hotelId);
                }}
                info={{
                  label: `Details and photos for ${card.title}`,
                  onPress: () => {
                    onDetails(hotelId);
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
