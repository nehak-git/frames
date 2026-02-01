"use client";

import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { AuthProvider, useAuth } from "@/lib/auth-provider";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";

interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: { id: string; email: string; name?: string; image?: string } | null;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <InnerRootComponent />
    </AuthProvider>
  );
}

function InnerRootComponent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: "/" });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-muted-fg">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <Link to="/" className="font-semibold text-fg hover:text-primary">
            Frames
          </Link>
          <div className="flex flex-1 gap-4">
            <Link
              to="/"
              className="text-muted-fg transition-colors hover:text-fg [&.active]:text-fg [&.active]:font-medium"
            >
              Home
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/upload"
                  className="text-muted-fg transition-colors hover:text-fg [&.active]:text-fg [&.active]:font-medium"
                >
                  Upload
                </Link>
                <Link
                  to="/search"
                  className="text-muted-fg transition-colors hover:text-fg [&.active]:text-fg [&.active]:font-medium"
                >
                  Search
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-fg">{user?.name || user?.email}</span>
                <Button size="sm" intent="secondary" onPress={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/auth/login"
                  className="text-sm text-muted-fg transition-colors hover:text-fg"
                >
                  Sign In
                </Link>
                <Button
                  size="sm"
                  intent="primary"
                  onPress={() => navigate({ to: "/auth/register" })}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </>
  );
}
