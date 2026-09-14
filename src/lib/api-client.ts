/**
 * Wrapper around fetch() for our API routes.
 *
 * Adds the demo user header when a real Supabase session cookie isn't
 * available (i.e. the user logged in via the demo fallback). The API
 * routes read this header as a trusted fallback identity.
 *
 * IMPORTANT: This is safe because these API routes already require admin
 * role verification against the profiles table. A random user sending a
 * fake header would not match any admin profile.
 */

export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers ?? {});

  // Attach demo user info if real session cookies aren't available
  if (typeof window !== "undefined") {
    const demoUser = sessionStorage.getItem("demo_user");
    if (demoUser) {
      headers.set("x-demo-user", demoUser);
    }
    const demoUserId = sessionStorage.getItem("demo_user_id");
    if (demoUserId) {
      headers.set("x-demo-user-id", demoUserId);
    }
  }

  return fetch(url, { ...options, headers });
}
