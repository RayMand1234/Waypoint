import { env } from './env';

/**
 * Parts of the app that are built but switched off until they're worth
 * showing. Each is an `EXPO_PUBLIC_FEATURE_*` env var set to "enabled"
 * (see `.env.example`); unset means off. Read at build time, so changing one
 * needs Metro restarted.
 */
export const featureFlags = {
  /** The bottom tab bar (Waypoints, Explore). Off: Home is the only tab; Explore opens from "See all". */
  tabBar: env.tabBar,
} as const;
