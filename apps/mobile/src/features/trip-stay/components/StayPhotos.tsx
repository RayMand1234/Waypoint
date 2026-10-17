import { Image } from 'expo-image';
import { ImageIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, View, type LayoutChangeEvent } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { pageAt } from '../utils/gallery';
import { StayThumb } from './StayThumb';

/**
 * Every photo of the stay: a big one to swipe through, its count, and a
 * scrolling strip of all the thumbnails — tapping one shows it.
 */
export const StayPhotos = ({
  name,
  urls,
}: {
  readonly name: string;
  readonly urls: readonly string[];
}) => {
  const { theme } = useUnistyles();
  const [width, setWidth] = useState(0);
  const [shown, setShown] = useState(0);
  const pager = useRef<FlatList<string>>(null);
  const strip = useRef<FlatList<string>>(null);

  const show = (index: number, { scrollPager }: { scrollPager: boolean }) => {
    setShown(index);

    if (scrollPager) pager.current?.scrollToIndex({ index, animated: true });

    strip.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  };

  if (urls.length === 0)
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
    <View
      style={styles.photos}
      onLayout={(event: LayoutChangeEvent) => {
        setWidth(event.nativeEvent.layout.width);
      }}
    >
      <View style={styles.big}>
        {width > 0 && (
          <FlatList
            ref={pager}
            data={urls}
            keyExtractor={(url) => url}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onMomentumScrollEnd={(event) => {
              show(
                pageAt(event.nativeEvent.contentOffset.x, width, urls.length),
                { scrollPager: false },
              );
            }}
            renderItem={({ item, index }) => (
              <Image
                source={{ uri: item }}
                style={styles.page(width)}
                contentFit="cover"
                accessibilityLabel={`Photo ${String(index + 1)} of ${name}`}
              />
            )}
          />
        )}
        <View style={styles.count} pointerEvents="none">
          <Text variant="caption-strong" color="surface-card" tabular>
            {`${String(shown + 1)} / ${String(urls.length)}`}
          </Text>
        </View>
      </View>
      {urls.length > 1 && (
        <FlatList
          ref={strip}
          data={urls}
          keyExtractor={(url) => url}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
          getItemLayout={(_, index) => ({
            length: theme.size['stay-thumb-w'] + theme.space[2],
            offset: (theme.size['stay-thumb-w'] + theme.space[2]) * index,
            index,
          })}
          renderItem={({ item, index }) => (
            <StayThumb
              url={item}
              index={index}
              isShown={index === shown}
              onPress={() => {
                show(index, { scrollPager: true });
              }}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  photos: {
    gap: theme.space[2],
  },
  big: {
    height: theme.size['stay-photo-h'],
    overflow: 'hidden',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors['midnight-100'],
  },
  page: (width: number) => ({
    width,
    height: theme.size['stay-photo-h'],
  }),
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
    gap: theme.space[2],
  },
}));
