import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { photoAtWidth } from '@/shared/utils/photoUrl';
import type { StampModel } from '../utils/stampModel';
import { PhotoBackdrop } from './PhotoBackdrop';

/** Past trips as small round photo stamps with the city and when; tapping one opens it. */
export const BeenThere = ({
  stamps,
  onOpen,
}: {
  readonly stamps: readonly StampModel[];
  readonly onOpen: (tripId: string) => void;
}) => (
  <View style={styles.section}>
    <View style={styles.header}>
      <Text variant="title" accessibilityRole="header">
        Been there
      </Text>
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroller}
    >
      {stamps.map((stamp) => (
        <Pressable
          key={stamp.id}
          accessibilityRole="button"
          accessibilityLabel={[stamp.city, stamp.when]
            .filter(Boolean)
            .join(', ')}
          onPress={() => {
            onOpen(stamp.id);
          }}
          style={styles.stamp}
        >
          <View style={styles.ring}>
            <View style={styles.photo}>
              <PhotoBackdrop
                uri={
                  stamp.photo === null
                    ? null
                    : photoAtWidth(stamp.photo.url, 250)
                }
                wash="none"
              />
            </View>
          </View>
          <Text variant="caption-strong" numberOfLines={1}>
            {stamp.city}
          </Text>
          {stamp.when !== null && (
            <Text variant="caption" color="ink-muted">
              {stamp.when}
            </Text>
          )}
        </Pressable>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create((theme) => ({
  section: {
    gap: theme.space[3],
  },
  header: {
    paddingHorizontal: theme.space[6],
  },
  scroller: {
    overflow: 'visible',
  },
  row: {
    gap: theme.space[4],
    paddingHorizontal: theme.space[6],
    // Room for the stamps' shadows, which a sideways list would clip.
    paddingVertical: theme.space[2],
    paddingBottom: theme.space[4],
  },
  stamp: {
    alignItems: 'center',
    gap: theme.size['focus-ring'],
    maxWidth: theme.size.stamp + theme.space[6],
  },
  // A white ring around the photo, lifted off the page.
  ring: {
    padding: theme.size['focus-ring'] + theme.size.hairline,
    marginBottom: theme.space[1],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors['surface-card'],
    boxShadow: theme.shadow.lifted,
  },
  photo: {
    width: theme.size.stamp,
    height: theme.size.stamp,
    overflow: 'hidden',
    borderRadius: theme.radius.full,
  },
}));
