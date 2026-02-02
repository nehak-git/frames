"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { authClient, type AuthState } from "./auth-client";

interface AuthContextType extends AuthState {
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  refetch: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  const checkSession = useCallback(async () => {
    try {
      const { data } = await authClient.getSession();
      if (data?.session && data?.user) {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: data.user as AuthState["user"],
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });
      }
    } catch {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <AuthContext.Provider value={{ ...authState, refetch: checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
