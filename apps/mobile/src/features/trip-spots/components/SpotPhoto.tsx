import type { Photo } from '@waypoint/contracts/destinations';
import { Image, Linking, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { photoCredit } from '../utils/spotDetails';

/** The spot's photo with the credit its licence requires; the credit opens the photo's page. */
export const SpotPhoto = ({
  name,
  photo,
}: {
  readonly name: string;
  readonly photo: Photo;
}) => (
  <View style={styles.photo}>
    <Image
      source={{ uri: photo.url }}
      style={styles.image}
      resizeMode="cover"
      accessibilityLabel={`Photo of ${name}`}
    />
    <Pressable
      accessibilityRole="link"
      onPress={() => void Linking.openURL(photo.sourceUrl)}
    >
      <Text variant="caption" color="ink-muted" numberOfLines={1}>
        {photoCredit(photo)}
      </Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create((theme) => ({
  photo: {
    gap: theme.space[1],
  },
  image: {
    height: theme.size['spot-photo-h'],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors['midnight-100'],
  },
}));
