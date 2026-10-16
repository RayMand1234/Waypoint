import { router } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useMe } from '@/features/profile';
import { useSession } from '@/shared/auth';
import { Screen, Text } from '@/shared/components';
import { useGreeting } from '../hooks/useGreeting';
import { useOpenTrip } from '../hooks/useOpenTrip';
import { useStartPlanning } from '../hooks/useStartPlanning';
import { useTrips } from '../hooks/useTrips';
import { hiLine, initialOf } from '../utils/greeting';
import { CreateWaypointCard } from './CreateWaypointCard';
import { HomeHeader } from './HomeHeader';
import { TripsSection } from './TripsSection';

/** Home — my waypoints: greeting, "Create a waypoint", and every trip. */
export const HomeScreen = () => {
  const greeting = useGreeting();
  const me = useMe();
  const session = useSession();
  const trips = useTrips();
  const planning = useStartPlanning();
  const openTrip = useOpenTrip(planning.planAgain);
  const name = me.data?.name ?? null;
  const email =
    session.status === 'signed-in' ? session.session.user.email : undefined;

  return (
    <Screen>
      <HomeHeader
        greeting={greeting}
        hiLine={hiLine(name)}
        initial={initialOf(name, email)}
        onProfilePress={() => {
          router.navigate('/profile');
        }}
      />
      <View style={styles.main}>
        <View style={styles.create}>
          <CreateWaypointCard
            onPress={planning.startNew}
            isCreating={planning.isCreating}
          />
          {planning.error !== undefined && (
            <Text
              variant="caption"
              color="danger"
              accessibilityLiveRegion="polite"
            >
              {planning.error}
            </Text>
          )}
        </View>
        <TripsSection
          trips={trips}
          onRetry={() => void trips.refetch()}
          onOpen={openTrip}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create((theme) => ({
  main: {
    gap: theme.space[8],
    paddingTop: theme.space[4],
  },
  create: {
    gap: theme.space[2],
  },
}));
