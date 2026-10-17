import type { Photo } from '@waypoint/contracts/destinations';
import { useRef } from 'react';
import { Pressable, View } from 'react-native';
import type { Anchor } from '@/features/profile';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/components';
import { photoAtWidth } from '@/shared/utils/photoUrl';
import { useFocusCount } from '../hooks/useFocusCount';
import { HeroHeadline } from './HeroHeadline';
import { PhotoBackdrop } from './PhotoBackdrop';
import { PhotoCreditButton } from './PhotoCreditButton';
import { StartPlanningButton } from './StartPlanningButton';

type HomeHeroProps = {
  readonly initial: string;
  /** The place behind the headline: the next trip's, else a suggested one. */
  readonly backdrop: { readonly place: string; readonly photo: Photo } | null;
  /** "2 in progress", or the empty-state line. */
  readonly tripsNote: string;
  readonly isStarting: boolean;
  readonly error: string | undefined;
  readonly onStart: () => void;
  /** The profile has grown out of the avatar: the avatar here steps aside. */
  readonly isProfileOpen: boolean;
  /** With where the avatar is on screen, for the profile to grow from. */
  readonly onProfilePress: (anchor: Anchor) => void;
};

/**
 * Home's top: a destination photo under a midnight wash, running under the
 * status bar — greeting and avatar, "Where to next?", Start planning, the
 * photo's credit, and the "Your waypoints" header the postcards rise over.
 */
export const HomeHero = ({
  initial,
  backdrop,
  tripsNote,
  isStarting,
  error,
  onStart,
  isProfileOpen,
  onProfilePress,
}: HomeHeroProps) => {
  const avatar = useRef<View>(null);
  const focusCount = useFocusCount();

  styles.useVariants({ isProfileOpen });

  return (
    <View style={styles.hero}>
      <PhotoBackdrop
        uri={backdrop === null ? null : photoAtWidth(backdrop.photo.url, 1280)}
        wash="hero"
      />
      <View style={styles.top}>
        <Pressable
          ref={avatar}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          onPress={() => {
            avatar.current?.measureInWindow((x, y, width, height) => {
              onProfilePress({ x, y, width, height });
            });
          }}
          style={styles.avatar}
        >
          <Text variant="body-strong" color="on-midnight">
            {initial}
          </Text>
        </Pressable>
      </View>
      {/* Types itself out again each time Home comes into view. */}
      <HeroHeadline key={focusCount} />
      <View style={styles.action}>
        <StartPlanningButton onPress={onStart} isBusy={isStarting} />
        {backdrop !== null && (
          <PhotoCreditButton place={backdrop.place} photo={backdrop.photo} />
        )}
      </View>
      {error !== undefined && (
        <Text
          variant="caption"
          color="on-midnight"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
      <View style={styles.tripsHeader}>
        <Text variant="title" color="on-midnight" accessibilityRole="header">
          Your waypoints
        </Text>
        <Text variant="delta" color="on-photo-muted">
          {tripsNote}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  hero: {
    minHeight: theme.size['home-hero-h'],
    gap: theme.space[4],
    paddingTop: rt.insets.top + theme.space[2],
    paddingHorizontal: theme.space[6],
    // The postcards rise over the bottom of the photo, under the header.
    paddingBottom: theme.size['postcard-overlap'] + theme.space[3],
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.space[3],
    marginBottom: theme.space[8],
  },
  avatar: {
    width: theme.size['tap-min'],
    height: theme.size['tap-min'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    borderWidth: theme.size.hairline,
    borderColor: theme.colors['frost-border'],
    backgroundColor: theme.colors['frost-fill'],
    variants: {
      isProfileOpen: {
        true: { opacity: 0 },
        false: {},
      },
    },
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space[3],
  },
  tripsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.space[3],
    marginTop: 'auto',
  },
}));
