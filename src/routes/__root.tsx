"use client";

import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Button } from "@/components/ui/button";
import { authClient, type AuthState } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-provider";
import { useNavigate } from "@tanstack/react-router";

export interface RouterContext {
  auth: AuthState;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { isAuthenticated, isLoading, user, refetch } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    await refetch();
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
                  to="/gallery"
                  className="text-muted-fg transition-colors hover:text-fg [&.active]:text-fg [&.active]:font-medium"
                >
                  Gallery
                </Link>
                <Link
                  to="/albums"
                  className="text-muted-fg transition-colors hover:text-fg [&.active]:text-fg [&.active]:font-medium"
                >
                  Albums
                </Link>
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
