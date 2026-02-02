import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-provider";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to gallery
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/gallery" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-muted-fg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          Your photos, instantly searchable
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-fg">
          Upload your images and search them with natural language. Our AI analyzes
          every photo so you can find exactly what you're looking for.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link to="/auth/register">
            <Button intent="primary" size="lg">
              Get Started Free
            </Button>
          </Link>
          <Link to="/auth/login">
            <Button intent="outline" size="lg">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="mt-24 grid gap-8 md:grid-cols-3">
        <div className="rounded-xl border border-border p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Smart Analysis</h3>
          <p className="mt-2 text-muted-fg">
            AI automatically analyzes your images and extracts descriptions and tags.
          </p>
        </div>

        <div className="rounded-xl border border-border p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Semantic Search</h3>
          <p className="mt-2 text-muted-fg">
            Search in natural language. Find "sunset at the beach" or "birthday cake".
          </p>
        </div>

        <div className="rounded-xl border border-border p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Organize in Albums</h3>
          <p className="mt-2 text-muted-fg">
            Create albums to organize your photos. Share public albums with friends.
          </p>
        </div>
      </div>
    </div>
  );
}
