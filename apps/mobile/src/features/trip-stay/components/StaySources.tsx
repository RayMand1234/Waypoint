import type { HotelOffer } from '@waypoint/contracts/hotels';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { plural } from '@/shared/utils/text';
import { StaySourceRow } from './StaySourceRow';

/** "Where we found it": each site's price for the whole stay, lowest first. */
export const StaySources = ({ offer }: { readonly offer: HotelOffer }) => {
  const sources = [...offer.sources].sort(
    (a, b) => a.price.amountMinor - b.price.amountMinor,
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="subtitle">Where we found it</Text>
        <Text variant="caption" color="ink-muted">
          {`${plural(offer.nights, 'night')}, all fees`}
        </Text>
      </View>
      <View style={styles.list}>
        {sources.map((source, index) => (
          <StaySourceRow
            key={`${source.provider}-${source.providerOfferId}`}
            source={source}
            isLowest={index === 0}
            isOnlyOne={sources.length === 1}
          />
        ))}
      </View>
      <Text variant="caption" color="ink-muted">
        Waypoint compares booking sites and shows you the lowest full price for
        the same room. You book on the site itself.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.space[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  list: {
    borderWidth: theme.size.hairline,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
}));
