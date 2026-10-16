import type { OfferSource } from '@waypoint/contracts/common';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Badge, Text } from '@/shared/components';
import { formatMoney } from '@/shared/utils/format';
import { SITE_NAMES } from '../utils/stayCardModel';

/** One site's price for the whole stay; the lowest is tinted (and badged when there are others). */
export const StaySourceRow = ({
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
        <Text variant="label">{SITE_NAMES[source.provider]}</Text>
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
