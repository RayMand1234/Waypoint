import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Screen } from '@/shared/components';
import { useSignInStep } from '../hooks/useSignInStep';
import { BrandMark } from './BrandMark';
import { CodeForm } from './CodeForm';
import { EmailForm } from './EmailForm';
import { LegalNote } from './LegalNote';
import { SignInHero } from './SignInHero';
import { SocialSignIn } from './SocialSignIn';

/** Log in: email → 6-digit code, or Google / Apple. No password. */
export const SignInScreen = () => {
  const { step, toCode, toEmail } = useSignInStep();

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <View style={styles.page}>
          <BrandMark />
          <SignInHero />
          <View style={styles.actions}>
            {step.kind === 'email' ? (
              <EmailForm onSent={toCode} />
            ) : (
              <CodeForm email={step.email} onChangeEmail={toEmail} />
            )}
            {step.kind === 'email' && <SocialSignIn />}
          </View>
          <LegalNote />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create((theme) => ({
  fill: {
    flex: 1,
  },
  page: {
    flex: 1,
    gap: theme.space[8],
    paddingTop: theme.space[12],
    paddingHorizontal: theme.space[2],
  },
  actions: {
    marginTop: 'auto',
    gap: theme.space[4],
  },
}));
