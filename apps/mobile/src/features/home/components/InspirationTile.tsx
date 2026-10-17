import type { DestinationSuggestion } from '@waypoint/contracts/destinations';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { STYLE_SHORT_NAMES } from '@/features/trip-flow';
import { Text } from '@/shared/components';
import { photoAtWidth } from '@/shared/utils/photoUrl';
import { PhotoBackdrop } from './PhotoBackdrop';

export type TileShape = 'wide' | 'tall' | 'square';

type InspirationTileProps = {
  readonly place: DestinationSuggestion;
  readonly shape: TileShape;
  readonly onPress: () => void;
};

/** "Views · Food", or the country when no style matched. */
const metaOf = (place: DestinationSuggestion): string =>
  place.matchedStyles.length === 0
    ? place.countryName
    : place.matchedStyles.map((style) => STYLE_SHORT_NAMES[style]).join(' · ');

/**
 * One place worth the trip: its photo, city and what it suits. The wide tile
 * carries its first style as a tag; the single best match says so. Tapping it
 * starts a trip there.
 */
export const InspirationTile = ({
  place,
  shape,
  onPress,
}: InspirationTileProps) => {
  const tag = shape === 'wide' ? place.matchedStyles[0] : undefined;

  styles.useVariants({ shape });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        place.name,
        ...(place.isBestMatch ? ['best match for your styles'] : []),
        metaOf(place),
      ].join(', ')}
      accessibilityHint="Starts a trip here"
      onPress={onPress}
      style={styles.tile}
    >
      <View style={styles.clip}>
        <PhotoBackdrop
          uri={place.photo === null ? null : photoAtWidth(place.photo.url, 960)}
          fallback={place.airport}
          wash="tile"
        />
        <View style={styles.top}>
          {tag !== undefined && (
            <View style={styles.tag}>
              <Text variant="overline" color="on-midnight">
                {STYLE_SHORT_NAMES[tag].toUpperCase()}
              </Text>
            </View>
          )}
          {place.isBestMatch && (
            <View style={styles.best}>
              <Text variant="caption-strong" color="midnight-900">
                Best match
              </Text>
            </View>
          )}
        </View>
        <View style={styles.body}>
          <Text
            variant={shape === 'wide' ? 'tile-city-wide' : 'tile-city'}
            color="on-midnight"
            numberOfLines={1}
          >
            {place.name}
          </Text>
          <Text variant="caption" color="on-photo-muted" numberOfLines={1}>
            {metaOf(place)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  // The shadow sits on the tile; its photo is clipped to the corners inside.
  tile: {
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.lifted,
    variants: {
      shape: {
        wide: { height: theme.size['bento-row-h'] },
        tall: { flex: 1 },
        square: { flex: 1 },
      },
    },
  },
  clip: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: theme.radius.lg,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
    padding: theme.space[3],
  },
  tag: {
    paddingHorizontal: theme.space[2],
    paddingVertical: theme.size['focus-ring'],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.scrim,
  },
  best: {
    marginLeft: 'auto',
    paddingHorizontal: theme.space[2] + theme.size['focus-ring'],
    paddingVertical: theme.size['focus-ring'],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors['surface-card'],
  },
  body: {
    position: 'absolute',
    left: theme.space[3] + theme.size['focus-ring'],
    right: theme.space[3] + theme.size['focus-ring'],
    bottom: theme.space[3],
  },
}));
