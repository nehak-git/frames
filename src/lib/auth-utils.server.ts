import type { H3Event } from "nitro/h3";
import { auth } from "@/lib/auth";

/**
 * Get the authenticated session from the request
 */
export async function getSession(event: H3Event) {
  return auth.api.getSession({
    headers: new Headers({
      cookie: event.req.headers.get("cookie") || "",
    }),
  });
}

/**
 * Get the authenticated user ID or throw 401
 */
export async function requireAuth(event: H3Event) {
  const session = await getSession(event);
  
  if (!session?.user?.id) {
    return null;
  }
  
  return session;
}
