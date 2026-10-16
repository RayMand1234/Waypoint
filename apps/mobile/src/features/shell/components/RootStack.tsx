import { Stack } from 'expo-router';
import type { SessionState } from '@/shared/auth';

/**
 * Signed-out travelers can only reach sign-in; signed-in ones everything else.
 * When the session changes, Expo Router moves them to the first allowed screen.
 */
export const RootStack = ({ session }: { readonly session: SessionState }) => {
  const isSignedIn = session.status === 'signed-in';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="trip/[id]/style" />
        <Stack.Screen name="trip/[id]/destination" />
        <Stack.Screen name="trip/[id]/spots" />
        <Stack.Screen
          name="trip/[id]/moment"
          options={{ animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen name="trip/[id]/[step]" />
        <Stack.Protected guard={__DEV__}>
          <Stack.Screen name="gallery" />
        </Stack.Protected>
      </Stack.Protected>
    </Stack>
  );
};
