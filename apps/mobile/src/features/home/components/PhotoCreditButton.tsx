import type { Photo } from '@waypoint/contracts/destinations';
import { Info } from 'lucide-react-native';
import { Alert, Linking, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { photoCredit } from '@/shared/utils/photoUrl';

/**
 * The place a photo shows, small on the photo; tapping it gives the full
 * credit the licence requires, and a way to the photo's own page.
 */
export const PhotoCreditButton = ({
  place,
  photo,
}: {
  readonly place: string;
  readonly photo: Photo;
}) => {
  const { theme } = useUnistyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Photo of ${place}. ${photoCredit(photo)}`}
      accessibilityHint="Shows who took it and its licence"
      onPress={() => {
        Alert.alert(place, photoCredit(photo), [
          {
            text: 'Photo page',
            onPress: () => void Linking.openURL(photo.sourceUrl),
          },
          { text: 'OK', style: 'cancel' },
        ]);
      }}
      hitSlop={theme.space[3]}
      style={styles.credit}
    >
      <Text variant="caption" color="on-photo-muted" numberOfLines={1}>
        {place}
      </Text>
      <Info
        size={theme.size['icon-sm']}
        strokeWidth={theme.size['icon-stroke']}
        color={theme.colors['on-photo-muted']}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  credit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1],
    flexShrink: 1,
  },
}));
