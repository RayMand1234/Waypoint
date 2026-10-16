import type { OfferSource, ProviderId } from '@waypoint/contracts/common';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { formatMoney } from '../../utils/format';
import { Badge } from '../Badge';
import { Text } from '../Text';

/** Where the prices come from, by provider. */
const SITE_NAMES: Readonly<Record<ProviderId, string>> = {
  liteapi: 'Booking partner',
  google: 'Google',
};

export const siteName = (provider: ProviderId): string => SITE_NAMES[provider];

/** One site's price; the lowest is tinted (and badged when there are others). */
export const OfferSourceRow = ({
  source,
  isLowest,
  isOnlyOne,
}: {
  readonly source: OfferSource;
  readonly isLowest: boolean;
  readonly isOnlyOne: boolean;
}) => {
  styles.useVariants({ isLowest });

  return (
    <View style={styles.row}>
      <View style={styles.site}>
        <Text variant="label">{siteName(source.provider)}</Text>
      </View>
      {isLowest && !isOnlyOne && <Badge kind="savings" label="Lowest" />}
      <Text variant="body-strong" tabular>
        {formatMoney(source.price)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    minHeight: theme.size['control-h'],
    paddingHorizontal: theme.space[4],
    variants: {
      isLowest: {
        true: { backgroundColor: theme.colors['savings-100'] },
        false: { backgroundColor: theme.colors['surface-card'] },
      },
    },
  },
  site: {
    flex: 1,
  },
}));
