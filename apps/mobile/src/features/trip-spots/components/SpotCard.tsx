import { Check, ImageIcon, Info } from 'lucide-react-native';
import { Image, Pressable, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Badge, Text } from '@/shared/components';

type SpotCardProps = {
  readonly name: string;
  readonly meta: string;
  /** A photo sized for the card; `null` shows a placeholder. */
  readonly photoUrl: string | null;
  readonly isTopPick: boolean;
  readonly isSelected: boolean;
  readonly onPress: () => void;
  /** Opens the spot's details. */
  readonly onInfo: () => void;
};

/** One recommended spot, photo first: tap to pick it; the info button opens its details. */
export const SpotCard = ({
  name,
  meta,
  photoUrl,
  isTopPick,
  isSelected,
  onPress,
  onInfo,
}: SpotCardProps) => {
  const { theme } = useUnistyles();

  styles.useVariants({ isSelected });

  return (
    <View style={styles.slot}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${name}. ${meta}${isTopPick ? '. Top pick' : ''}`}
        accessibilityState={{ checked: isSelected }}
        onPress={onPress}
        style={styles.card}
      >
        <View style={styles.photo}>
          {photoUrl === null ? (
            <ImageIcon
              size={theme.size['icon-lg']}
              strokeWidth={theme.size['icon-stroke-light']}
              color={theme.colors['ink-muted']}
            />
          ) : (
            <Image
              source={{ uri: photoUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
          {isTopPick && (
            <View style={styles.badge}>
              <Badge kind="value" label="Top pick" />
            </View>
          )}
          <View style={styles.check}>
            {isSelected && (
              <Check
                size={theme.size['icon-sm']}
                strokeWidth={theme.size['icon-stroke-bold']}
                color={theme.colors['on-midnight']}
              />
            )}
          </View>
        </View>
        <View style={styles.text}>
          <Text variant="body-strong" numberOfLines={2}>
            {name}
          </Text>
          <Text variant="caption" color="ink-muted" numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`About ${name}`}
        onPress={onInfo}
        style={styles.info}
      >
        <View style={styles.infoCircle}>
          <Info
            size={theme.size['icon-sm']}
            strokeWidth={theme.size['icon-stroke']}
            color={theme.colors['surface-card']}
          />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  slot: {
    flex: 1,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors['surface-card'],
    variants: {
      // The thicker border takes the margin's place, so the card never shifts.
      isSelected: {
        true: {
          borderWidth: theme.size['focus-ring'],
          borderColor: theme.colors['midnight-900'],
        },
        false: {
          margin: theme.size['focus-ring'] - theme.size.hairline,
          borderWidth: theme.size.hairline,
          borderColor: theme.colors.border,
        },
      },
    },
  },
  photo: {
    aspectRatio: theme.size['spot-card-photo-ratio'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors['midnight-100'],
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: theme.space[2],
    left: theme.space[2],
  },
  check: {
    position: 'absolute',
    right: theme.space[2],
    bottom: theme.space[2],
    width: theme.size.checkbox,
    height: theme.size.checkbox,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    borderWidth: theme.size['checkbox-border'],
    borderColor: theme.colors['surface-card'],
    variants: {
      isSelected: {
        true: { backgroundColor: theme.colors['midnight-900'] },
        false: { backgroundColor: theme.colors.scrim },
      },
    },
  },
  text: {
    gap: theme.size['focus-ring'],
    padding: theme.space[2],
  },
  info: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: theme.size['tap-min'],
    height: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCircle: {
    width: theme.size['spot-info-circle'],
    height: theme.size['spot-info-circle'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.scrim,
  },
}));
