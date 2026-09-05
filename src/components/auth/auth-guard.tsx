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
      const hasDemoSession = Boolean(sessionStorage.getItem("demo_user"));
      if (hasDemoSession && !cancelled) {
        setReady(true);
        return;
      }

      // Then check Supabase session
      if (!isSupabaseConfigured || !supabase) {
        if (!cancelled) {
          router.replace("/login");
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session && !cancelled) {
        router.replace("/login");
      } else if (!cancelled) {
        setReady(true);
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
