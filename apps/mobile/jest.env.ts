// Environment the app reads at import time (src/shared/utils/env.ts). Local,
// harmless values: tests never reach a real server.
process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key';
process.env.EXPO_PUBLIC_API_URL = 'http://127.0.0.1:4002';
