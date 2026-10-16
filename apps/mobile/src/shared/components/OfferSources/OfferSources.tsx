import type { OfferSource } from '@waypoint/contracts/common';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '../Text';
import { OfferSourceRow } from './OfferSourceRow';

type OfferSourcesProps = {
  readonly sources: readonly OfferSource[];
  /** What the prices cover: "4 nights, all fees", "2 travelers, round trip". */
  readonly caption: string;
  /** How Waypoint compares, for this kind of offer. */
  readonly footnote: string;
};

/** "Where we found it": each site's full price for the same offer, lowest first. */
export const OfferSources = ({
  sources,
  caption,
  footnote,
}: OfferSourcesProps) => {
  const sorted = [...sources].sort(
    (a, b) => a.price.amountMinor - b.price.amountMinor,
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="subtitle">Where we found it</Text>
        <Text variant="caption" color="ink-muted">
          {caption}
        </Text>
      </View>
      <View style={styles.list}>
        {sorted.map((source, index) => (
          <OfferSourceRow
            key={`${source.provider}-${source.providerOfferId}`}
            source={source}
            isLowest={index === 0}
            isOnlyOne={sorted.length === 1}
          />
        ))}
      </View>
      <Text variant="caption" color="ink-muted">
        {footnote}
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
