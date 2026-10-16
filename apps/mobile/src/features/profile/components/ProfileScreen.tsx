import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useSignOut } from '@/features/auth';
import { Button, Screen, Text } from '@/shared/components';
import { useSession } from '@/shared/auth';
import { errorMessage } from '@/shared/utils/errorMessage';
import { useMe } from '../hooks/useMe';
import { ProfileForm } from './ProfileForm';

export const ProfileScreen = () => {
  const { theme } = useUnistyles();
  const me = useMe();
  const session = useSession();
  const signOut = useSignOut();
  const email =
    session.status === 'signed-in' ? session.session.user.email : undefined;

  return (
    <Screen>
      <View style={styles.page}>
        <View style={styles.header}>
          <Text variant="title-lg" accessibilityRole="header">
            Profile
          </Text>
          {email !== undefined && <Text color="ink-muted">{email}</Text>}
        </View>
        {me.isPending && (
          <ActivityIndicator color={theme.colors['midnight-900']} />
        )}
        {me.isError && (
          <View style={styles.header}>
            <Text color="danger">{errorMessage(me.error)}</Text>
            <Button
              label="Try again"
              kind="secondary"
              onPress={() => void me.refetch()}
            />
          </View>
        )}
        {me.isSuccess && <ProfileForm profile={me.data} />}
        <Button
          label="Sign out"
          kind="ghost"
          isLoading={signOut.isPending}
          onPress={() => {
            signOut.mutate();
          }}
        />
        {__DEV__ && (
          <Button
            label="Component gallery"
            kind="ghost"
            onPress={() => {
              router.push('/gallery');
            }}
          />
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create((theme) => ({
  page: {
    gap: theme.space[8],
    paddingTop: theme.space[6],
  },
  header: {
    gap: theme.space[1],
  },
}));
