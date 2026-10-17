import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { ProfileBubble } from '@/features/profile';
import { PaperBackground, Text } from '@/shared/components';
import { featureFlags } from '@/shared/utils/featureFlags';
import { useHome } from '../hooks/useHome';
import { BeenThere } from './BeenThere';
import { HomeHero } from './HomeHero';
import { InspirationBento } from './InspirationBento';
import { TripsError } from './TripsStates';
import { TripsRail } from './TripsRail';

/** How often the scroll position is read (for the status bar). */
const SCROLL_THROTTLE_MS = 100;

/** Home: a destination photo hero, the trips as postcards, places worth the trip, and past trips. */
export const HomeScreen = () => {
  const home = useHome();
  const { planning } = home;

  styles.useVariants({ hasTabBar: featureFlags.tabBar });

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="never"
        onScroll={home.onScroll}
        scrollEventThrottle={SCROLL_THROTTLE_MS}
      >
        <HomeHero
          {...home.hero}
          isStarting={planning.isCreating}
          error={planning.error}
          onStart={planning.startNew}
          isProfileOpen={home.profile.isShown}
          onProfilePress={home.profile.open}
        />
        {/* Everything below the hero sits on the paper background. */}
        <View style={styles.below}>
          <PaperBackground hasGlows />
          <TripsRail
            cards={home.cards}
            isLoading={home.trips.isLoading}
            onOpen={home.open}
            onDelete={home.remove}
          />
          {(home.trips.error !== undefined ||
            home.deleteError !== undefined) && (
            <View style={styles.notes}>
              {home.trips.error !== undefined && (
                <TripsError
                  message={home.trips.error}
                  onRetry={home.trips.retry}
                />
              )}
              {home.deleteError !== undefined && (
                <Text
                  variant="caption"
                  color="danger"
                  accessibilityLiveRegion="polite"
                >
                  {home.deleteError}
                </Text>
              )}
            </View>
          )}
          {home.inspiration.places.length > 0 && (
            <InspirationBento
              {...home.inspiration}
              onPick={home.startAt}
              onSeeAll={home.goToExplore}
            />
          )}
          {home.stamps.length > 0 && (
            <View style={styles.been}>
              <BeenThere stamps={home.stamps} onOpen={home.openPast} />
            </View>
          )}
        </View>
      </ScrollView>
      <ProfileBubble
        anchor={home.profile.anchor}
        initial={home.hero.initial}
        onClose={home.profile.close}
        onClosed={home.profile.closed}
      />
    </View>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flexGrow: 1,
  },
  below: {
    flexGrow: 1,
    variants: {
      // Clear of the tab bar floating over the end of the page, or of the home indicator.
      hasTabBar: {
        true: {
          paddingBottom: rt.insets.bottom + theme.size['tab-bar-clearance'],
        },
        false: { paddingBottom: rt.insets.bottom + theme.space[6] },
      },
    },
  },
  notes: {
    gap: theme.space[2],
    paddingHorizontal: theme.space[6],
    paddingBottom: theme.space[6],
  },
  been: {
    marginTop: theme.space[8],
  },
}));
