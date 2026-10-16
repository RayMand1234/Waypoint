import type { ConfigContext, ExpoConfig } from 'expo/config';
import { withEntitlementsPlist, type ConfigPlugin } from 'expo/config-plugins';

// Google sign-in's native setup needs the iOS URL scheme (the reversed iOS
// client id). It is only added when configured, so the app builds without it.
const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
const appleSignIn = process.env.EXPO_PUBLIC_APPLE_SIGN_IN === 'enabled';

const APPLE_SIGN_IN_ENTITLEMENT = 'com.apple.developer.applesignin';

/**
 * expo-apple-authentication's plugin runs whenever the package is installed
 * and always adds the Sign in with Apple entitlement. That entitlement makes
 * even simulator builds need an Apple signing certificate, so it is removed
 * unless Apple sign-in is switched on.
 */
const withoutAppleSignInEntitlement: ConfigPlugin = (config) =>
  withEntitlementsPlist(config, (mod) => {
    const { [APPLE_SIGN_IN_ENTITLEMENT]: _removed, ...entitlements } =
      mod.modResults;

    return { ...mod, modResults: entitlements };
  });

const appConfig = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Waypoint',
  slug: 'waypoint',
  scheme: 'waypoint',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: 'com.raymandelvei.waypoint',
    supportsTablet: false,
    usesAppleSignIn: appleSignIn,
  },
  android: {
    package: 'com.raymandelvei.waypoint',
    adaptiveIcon: {
      backgroundColor: '#1E2A5A',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  experiments: { typedRoutes: true },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FAF8F4',
        image: './assets/splash-icon.png',
        imageWidth: 120,
      },
    ],
    ...(appleSignIn ? ['expo-apple-authentication'] : []),
    ...(googleIosUrlScheme === undefined || googleIosUrlScheme === ''
      ? []
      : [
          [
            '@react-native-google-signin/google-signin',
            { iosUrlScheme: googleIosUrlScheme },
          ] as [string, object],
        ]),
  ],
});

export default (context: ConfigContext): ExpoConfig =>
  appleSignIn
    ? appConfig(context)
    : withoutAppleSignInEntitlement(appConfig(context));
