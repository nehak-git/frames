import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || window.location.origin,
});

// Type for auth state used in router context
export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; email: string; name?: string; image?: string } | null;
};

// Helper to get current auth state (for use outside React components)
export async function getAuthState(): Promise<AuthState> {
  try {
    const { data } = await authClient.getSession();
    if (data?.session && data?.user) {
      return {
        isAuthenticated: true,
        isLoading: false,
        user: data.user as AuthState["user"],
      };
    }
    return { isAuthenticated: false, isLoading: false, user: null };
  } catch {
    return { isAuthenticated: false, isLoading: false, user: null };
  }
}
