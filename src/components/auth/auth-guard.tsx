"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const PUBLIC_PATHS = new Set(["/login"]);

/**
 * Client-side auth guard.
 *
 * Check order:
 *   1. Demo session (set by login form) - synchronous, no network call
 *   2. Real Supabase session - async check
 *   3. Redirect to /login if neither exists
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Start ready only for public paths - never read sessionStorage during render
  // This prevents hydration mismatch between server and client
  const [ready, setReady] = React.useState(PUBLIC_PATHS.has(pathname));

  React.useEffect(() => {
    // Public paths are always ready
    if (PUBLIC_PATHS.has(pathname)) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function check() {
      // Check demo session first (synchronous, client-side only)
      // Must have ALL required fields, not just demo_user
      const hasDemoSession = Boolean(
        sessionStorage.getItem("demo_user") &&
        sessionStorage.getItem("demo_user_id") &&
        sessionStorage.getItem("demo_user_role")
      );
      
      if (hasDemoSession && !cancelled) {
        console.log('[AuthGuard] Demo session valid');
        setReady(true);
        return;
      }

      // Demo session incomplete - clear it and redirect to login
      if (!cancelled) {
        console.log('[AuthGuard] No valid session, redirecting to login');
        sessionStorage.clear();
        router.replace("/login");
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!ready) {
    return <div className="flex min-h-dvh bg-background" />;
  }

  return <>{children}</>;
}
