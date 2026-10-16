import type { HotelDetail, HotelOffer } from '@waypoint/contracts/hotels';
import { Linking, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Sheet } from '@/shared/components';
import type { StayCardModel } from '../utils/stayCardModel';
import { lowestSource } from '../utils/staySelection';
import { StayFacts } from './StayFacts';
import { StayPhotos } from './StayPhotos';
import { StaySources } from './StaySources';

type StayDetailsSheetProps = {
  readonly offer: HotelOffer;
  readonly card: StayCardModel;
  /** The hotel's details; loads after the sheet opens. */
  readonly detail: HotelDetail | undefined;
  readonly photos: readonly string[];
  readonly isPicked: boolean;
  readonly onPick: (hotelId: string) => void;
  readonly onClose: () => void;
};

/** One stay up close: photos, terms, facilities and every site's price, then View or Select. */
export const StayDetailsSheet = ({
  offer,
  card,
  detail,
  photos,
  isPicked,
  onPick,
  onClose,
}: StayDetailsSheetProps) => {
  const source = lowestSource(offer);

  return (
    <Sheet
      isOpen
      title={offer.hotel.name}
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
              label={isPicked ? 'Selected' : 'Select stay'}
              isBlock
              onPress={() => {
                onPick(offer.hotel.id);
              }}
            />
          </View>
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.body}>
        <StayPhotos
          key={offer.hotel.id}
          name={offer.hotel.name}
          urls={photos}
        />
        <StayFacts offer={offer} card={card} detail={detail} />
        <StaySources offer={offer} />
      </ScrollView>
    </Sheet>
  );
};

const styles = StyleSheet.create((theme) => ({
  body: {
    gap: theme.space[6],
    paddingBottom: theme.space[2],
  },
  footer: {
    flexDirection: 'row',
    gap: theme.space[2],
  },
  action: {
    flex: 1,
  },
}));
