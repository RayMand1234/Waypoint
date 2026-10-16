import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button, Text } from '@/shared/components';
import { useSocialSignIn } from '../hooks/useSocialSignIn';
import { OrDivider } from './OrDivider';

/** "or" + Google and Apple — renders nothing when neither is configured. */
export const SocialSignIn = () => {
  const social = useSocialSignIn();

  if (!social.isGoogleAvailable && !social.isAppleAvailable) return null;

  return (
    <View style={styles.group}>
      <OrDivider />
      {social.isGoogleAvailable && (
        <Button
          label="Continue with Google"
          kind="secondary"
          isBlock
          isLoading={social.isGooglePending}
          onPress={social.signInWithGoogle}
        />
      )}
      {social.isAppleAvailable && (
        <Button
          label="Continue with Apple"
          kind="secondary"
          isBlock
          isLoading={social.isApplePending}
          onPress={social.signInWithApple}
        />
      )}
      {social.error !== undefined && (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {social.error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  group: {
    gap: theme.space[4],
  },
}));
