import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <Link to="/" className="font-semibold text-fg hover:text-primary">
            Frames
          </Link>
          <div className="flex gap-4">
            <Link
              to="/"
              className="text-muted-fg transition-colors hover:text-fg [&.active]:text-fg [&.active]:font-medium"
            >
              Home
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
          </div>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </>
  ),
});
