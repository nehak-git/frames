import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { AuthProvider, useAuth } from "./lib/auth-provider";
import { type AuthState } from "./lib/auth-client";
import "./index.css";

// Define router context type
export interface RouterContext {
  auth: AuthState;
}

// Create router with context type
const router = createRouter({
  routeTree,
  context: {
    auth: undefined!, // Will be provided by InnerApp
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Inner component that provides auth context to router
function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

// Root App with AuthProvider wrapping everything
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  </StrictMode>
);
