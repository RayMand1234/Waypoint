import {
  CryptoDigestAlgorithm,
  digestStringAsync,
  randomUUID,
} from 'expo-crypto';

export type Nonce = { readonly raw: string; readonly hashed: string };

/** Apple gets the SHA-256 of the nonce; Supabase gets the raw value to check it. */
export const createNonce = async (): Promise<Nonce> => {
  const raw = randomUUID();

  return {
    raw,
    hashed: await digestStringAsync(CryptoDigestAlgorithm.SHA256, raw),
  };
};
