import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { env } from '../utils/env';

/**
 * The one Supabase client, for **auth calls only** — the single exception to
 * "the app never calls outside sources directly". Data always goes through
 * the backend (`apiRequest`), never through Supabase.
 */
export const supabase = createClient(
  env.supabaseUrl,
  env.supabasePublishableKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Refresh the session only while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});

/** The current access token, or `undefined` when signed out. */
export const getAccessToken = async (): Promise<string | undefined> => {
  const { data } = await supabase.auth.getSession();

  return data.session?.access_token;
};
