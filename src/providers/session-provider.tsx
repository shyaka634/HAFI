"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth/client";
import type { AppUser } from "@/lib/types";

type SessionContextValue = {
  user: AppUser | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  clearSession: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Reads the session once for the whole application. Protected pages reuse this
 * result while their server APIs continue to enforce every permission.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await authClient.getSession();
      setUser((data?.user as AppUser | undefined) ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void refreshSession(); }, [refreshSession]);

  const value = useMemo(() => ({
    user,
    isLoading,
    refreshSession,
    clearSession: () => { setUser(null); setIsLoading(false); },
  }), [isLoading, refreshSession, user]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAppSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useAppSession must be used inside SessionProvider.");
  return context;
}
