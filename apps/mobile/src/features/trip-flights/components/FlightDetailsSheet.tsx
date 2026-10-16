import type { FlightOffer } from '@waypoint/contracts/flights';
import { Linking, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { lowestSource } from '@/features/trip-flow';
import {
  Badge,
  Button,
  DetailRows,
  OfferSources,
  Sheet,
} from '@/shared/components';
import { plural } from '@/shared/utils/text';
import type { FlightCardModel } from '../utils/flightCardModel';
import { fareRows } from '../utils/flightDetails';
import { FlightLegList } from './FlightLegList';

type FlightDetailsSheetProps = {
  readonly offer: FlightOffer;
  readonly card: FlightCardModel;
  readonly travelers: number;
  readonly isPicked: boolean;
  readonly onPick: (offerId: string) => void;
  readonly onClose: () => void;
};

/** One fare up close: each way in full, its terms and every site's price, then View or Select. */
export const FlightDetailsSheet = ({
  offer,
  card,
  travelers,
  isPicked,
  onPick,
  onClose,
}: FlightDetailsSheetProps) => {
  const source = lowestSource(offer.sources);

  return (
    <Sheet
      isOpen
      title={card.title}
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          {source !== undefined && (
            <View style={styles.action}>
              <Button
                label="View on site"
                kind="secondary"
                isBlock
                onPress={() => void Linking.openURL(source.deepLink)}
              />
            </View>
          )}
          <View style={styles.action}>
            <Button
              label={isPicked ? 'Selected' : 'Select flight'}
              isBlock
              onPress={() => {
                onPick(offer.id);
              }}
            />
          </View>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.badges}>
          {card.badges.map((badge) => (
            <Badge key={badge.label} {...badge} />
          ))}
        </View>
        <FlightLegList legs={offer.legs} />
        <DetailRows rows={fareRows(offer)} />
        <OfferSources
          sources={offer.sources}
          caption={`${plural(travelers, 'traveler')}, all fees`}
          footnote="Waypoint compares airline and travel sites and shows you the lowest full price. You book on the site itself."
        />
      </ScrollView>
    </Sheet>
  );
};

const styles = StyleSheet.create((theme) => ({
  body: {
    gap: theme.space[6],
    paddingBottom: theme.space[2],
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
  footer: {
    flexDirection: 'row',
    gap: theme.space[2],
  },
  action: {
    flex: 1,
  },
}));
