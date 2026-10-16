import { ImageIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Image, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { StayThumb } from './StayThumb';

const MAX_THUMBS = 4;

/** One big photo, its count, and up to four thumbnails to switch it. */
export const StayPhotos = ({
  name,
  urls,
}: {
  readonly name: string;
  readonly urls: readonly string[];
}) => {
  const { theme } = useUnistyles();
  const [shown, setShown] = useState(0);
  const url = urls[shown];

  if (url === undefined)
    return (
      <View style={[styles.big, styles.placeholder]}>
        <ImageIcon
          size={theme.size['icon-xl']}
          strokeWidth={theme.size['icon-stroke-light']}
          color={theme.colors['midnight-900']}
        />
        <Text variant="caption" color="ink-muted">
          No photos yet
        </Text>
      </View>
    );

  return (
    <View style={styles.photos}>
      <View>
        <Image
          source={{ uri: url }}
          style={styles.big}
          accessibilityLabel={`Photo ${String(shown + 1)} of ${name}`}
        />
        <View style={styles.count}>
          <Text variant="caption-strong" color="surface-card">
            {`${String(shown + 1)} / ${String(urls.length)}`}
          </Text>
        </View>
      </View>
      <View style={styles.thumbs}>
        {urls.slice(0, MAX_THUMBS).map((thumb, index) => (
          <StayThumb
            key={thumb}
            url={thumb}
            index={index}
            isShown={index === shown}
            onPress={() => {
              setShown(index);
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  photos: {
    gap: theme.space[2],
  },
  big: {
    height: theme.size['stay-photo-h'],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors['midnight-100'],
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[1],
  },
  count: {
    position: 'absolute',
    right: theme.space[2],
    bottom: theme.space[2],
    paddingHorizontal: theme.space[2],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.scrim,
  },
  thumbs: {
    flexDirection: 'row',
    gap: theme.space[2],
  },
}));
