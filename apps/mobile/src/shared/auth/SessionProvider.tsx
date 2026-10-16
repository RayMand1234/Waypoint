import { createContext, useEffect, useState, type ReactNode } from 'react';
import { toSessionState, type SessionState } from './sessionState';
import { supabase } from './supabase';

export const SessionContext = createContext<SessionState>({
  status: 'loading',
});

/** One subscription to Supabase's auth state for the whole app. */
export const SessionProvider = ({
  children,
}: {
  readonly children: ReactNode;
}) => {
  const [state, setState] = useState<SessionState>({ status: 'loading' });

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setState(toSessionState(data.session));
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(toSessionState(session));
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
  );
};
