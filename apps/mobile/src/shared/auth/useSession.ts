import { useContext } from 'react';
import { SessionContext } from './SessionProvider';
import type { SessionState } from './sessionState';

/** `loading | signed-out | signed-in`, from the app-wide `SessionProvider`. */
export const useSession = (): SessionState => useContext(SessionContext);
