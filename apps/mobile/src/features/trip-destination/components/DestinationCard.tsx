import { MapPin } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Badge, Text } from '@/shared/components';
import type { DestinationCardModel } from '../utils/destinationCardModel';

type DestinationCardProps = {
  readonly card: DestinationCardModel;
  readonly isSelected: boolean;
  readonly onPress: () => void;
};

/** One suggested destination: airport tile, name, what it's known for, a stay estimate and why it fits. */
export const DestinationCard = ({
  card,
  isSelected,
  onPress,
}: DestinationCardProps) => {
  const { theme } = useUnistyles();

  styles.useVariants({ isSelected });

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`${card.title}. ${card.meta}. ${card.price ?? ''} ${card.why}`}
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.thumb}>
        <MapPin
          size={theme.size['icon-md']}
          strokeWidth={theme.size['icon-stroke']}
          color={theme.colors['midnight-900']}
        />
        <Text variant="body-strong" color="midnight-900">
          {card.code}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="subtitle" numberOfLines={1}>
            {card.title}
          </Text>
          {card.isBestMatch && <Badge kind="neutral" label="Best match" />}
        </View>
        <Text variant="body-sm" color="ink-muted" numberOfLines={2}>
          {card.meta}
        </Text>
        <View style={styles.footRow}>
          {card.price !== null && (
            <Text variant="label" tabular>
              {card.price}
            </Text>
          )}
          <Text
            variant="caption-strong"
            color={card.isBestMatch ? 'savings' : 'ink-muted'}
          >
            {card.why}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    gap: theme.space[3],
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors['surface-card'],
    variants: {
      isSelected: {
        true: {
          borderWidth: theme.size['focus-ring'],
          borderColor: theme.colors['midnight-900'],
          boxShadow: theme.shadow.raised,
        },
        false: {
          borderWidth: theme.size.hairline,
          borderColor: theme.colors.border,
          margin: theme.size.hairline,
          boxShadow: theme.shadow.card,
        },
      },
    },
  },
  thumb: {
    width: theme.size['destination-thumb'],
    justifyContent: 'space-between',
    padding: theme.space[3],
    backgroundColor: theme.colors['midnight-100'],
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: theme.space[1],
    paddingVertical: theme.space[3],
    paddingRight: theme.space[3],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space[2],
  },
  footRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.space[2],
  },
}));
