import { Info, MapPin } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Badge, type BadgeProps } from '../Badge';
import { Text } from '../Text';

/** `down` is cheaper than the comparison (savings color), `up` pricier (danger). */
export type OfferDelta = {
  readonly text: string;
  readonly direction: 'down' | 'up';
};

export type OfferCardProps = {
  readonly title: string;
  /** One line; details belong in a bottom sheet. */
  readonly meta: string;
  /** Where it is, with a pin: "≈ 12 min to your spots". */
  readonly note?: string;
  /** Formatted, including all fees: "€ 189". */
  readonly price: string;
  /** "per person", "per night", "whole trip". */
  readonly unit: string;
  readonly delta?: OfferDelta;
  readonly badges?: readonly BadgeProps[];
  /** Only the top best-value option: sunshine tint (and its `value` badge). */
  readonly isBestValue?: boolean;
  readonly isSelected?: boolean;
  readonly onPress: () => void;
  /** An info button in the corner that opens the option's details. */
  readonly info?: { readonly label: string; readonly onPress: () => void };
};

/** One bookable option — flight, stay or extra — in the shared layout. */
export const OfferCard = ({
  title,
  meta,
  note,
  price,
  unit,
  delta,
  badges = [],
  isBestValue = false,
  isSelected = false,
  onPress,
  info,
}: OfferCardProps) => {
  const { theme } = useUnistyles();

  styles.useVariants({ isBestValue, isSelected, hasInfo: info !== undefined });

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${price} ${unit}`}
        accessibilityState={{ selected: isSelected }}
        onPress={onPress}
        style={styles.card}
      >
        {badges.length > 0 && (
          <View style={styles.row}>
            {badges.map((badge) => (
              <Badge key={`${badge.kind}-${badge.label}`} {...badge} />
            ))}
          </View>
        )}
        <View>
          <Text variant="subtitle">{title}</Text>
          <Text variant="body" color="ink-muted" numberOfLines={1}>
            {meta}
          </Text>
        </View>
        {note !== undefined && (
          <View style={styles.note}>
            <MapPin
              size={theme.size['icon-sm']}
              strokeWidth={theme.size['icon-stroke']}
              color={theme.colors['midnight-900']}
            />
            <Text variant="caption-strong">{note}</Text>
          </View>
        )}
        <View style={styles.foot}>
          <View>
            <Text variant="price" tabular>
              {price}
            </Text>
            <Text variant="caption" color="ink-muted">
              {unit}
            </Text>
          </View>
          {delta !== undefined && (
            <Text
              variant="delta"
              tabular
              color={delta.direction === 'down' ? 'savings' : 'danger'}
            >
              {delta.text}
            </Text>
          )}
        </View>
      </Pressable>
      {info !== undefined && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={info.label}
          onPress={info.onPress}
          style={styles.info}
        >
          <Info
            size={theme.size['icon-md']}
            strokeWidth={theme.size['icon-stroke']}
            color={theme.colors['midnight-900']}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  card: {
    gap: theme.space[3],
    padding: theme.space[4],
    borderWidth: theme.size.hairline,
    borderRadius: theme.radius.lg,
    variants: {
      isBestValue: {
        true: {
          backgroundColor: theme.colors['sunshine-100'],
          borderColor: theme.colors['sunshine-400'],
        },
        false: {
          backgroundColor: theme.colors['surface-card'],
          borderColor: theme.colors.border,
        },
      },
      isSelected: {
        true: {
          borderWidth: theme.size['focus-ring'],
          borderColor: theme.colors['midnight-900'],
          padding: theme.space[4] - theme.size.hairline,
          boxShadow: theme.shadow.raised,
        },
        false: { boxShadow: theme.shadow.card },
      },
    },
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.space[2],
    variants: {
      // Room for the info button in the corner.
      hasInfo: {
        true: {
          justifyContent: 'flex-start',
          paddingRight: theme.size['tap-min'],
        },
        false: {},
      },
    },
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
  },
  info: {
    position: 'absolute',
    top: theme.space[1],
    right: theme.space[1],
    width: theme.size['tap-min'],
    height: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
  },
  foot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: theme.space[2],
  },
}));
