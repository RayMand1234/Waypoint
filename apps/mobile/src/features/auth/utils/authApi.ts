import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { supabase } from '@/shared/auth';
import { env } from '@/shared/utils/env';
import { createNonce } from './nonce';

// Every Supabase Auth call the app makes. Each throws on failure, so React
// Query mutations surface it; a traveler cancelling a native sheet is not a
// failure and resolves to `'cancelled'`.

export type SignInOutcome = 'signed-in' | 'cancelled';

/** Emails a 6-digit code (the template prints `{{ .Token }}`), creating the account on first use. */
export const sendCode = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error !== null) throw error;
};

export const verifyCode = async (
  email: string,
  token: string,
): Promise<void> => {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error !== null) throw error;
};

export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();

  if (error !== null) throw error;
};

export const isGoogleConfigured = (): boolean =>
  env.googleWebClientId !== undefined;

export const signInWithGoogle = async (): Promise<SignInOutcome> => {
  GoogleSignin.configure({
    ...(env.googleWebClientId === undefined
      ? {}
      : { webClientId: env.googleWebClientId }),
    ...(env.googleIosClientId === undefined
      ? {}
      : { iosClientId: env.googleIosClientId }),
  });
  await GoogleSignin.hasPlayServices();

  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) return 'cancelled';

  const token = response.data.idToken;

  if (token === null) throw new Error('Google returned no ID token');

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token,
  });

  if (error !== null) throw error;

  return 'signed-in';
};

const isAppleCancel = (error: unknown): boolean =>
  error instanceof Error &&
  'code' in error &&
  error.code === 'ERR_REQUEST_CANCELED';

export const signInWithApple = async (): Promise<SignInOutcome> => {
  const nonce = await createNonce();

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: nonce.hashed,
    });

    if (credential.identityToken === null)
      throw new Error('Apple returned no identity token');

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: nonce.raw,
    });

    if (error !== null) throw error;

    return 'signed-in';
  } catch (error) {
    if (isAppleCancel(error)) return 'cancelled';

    throw error;
  }
};
