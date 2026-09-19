"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, LogIn, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher, ModeToggle } from "@/components/theme/theme-switcher";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

/** Demo admin credentials — fallback when Supabase auth fails during setup. */

export function LoginForm() {
  const router = useRouter();

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [exiting, setExiting] = React.useState(false);

  // Removing the forced-dark effect so the user's light/dark choice on the
  // login page sticks across visits.

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError("Username and password are required.");
      setLoading(false);
      return;
    }

    try {
      // Call our username-based login API
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUser, password: trimmedPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid username or password");
        setLoading(false);
        return;
      }

      // Store user info in sessionStorage for the topbar and API routes
      sessionStorage.setItem("demo_user", data.user.username);
      sessionStorage.setItem("demo_user_id", data.user.id);
      sessionStorage.setItem("demo_display_name", data.user.displayName);
      sessionStorage.setItem("demo_user_role", data.user.roleName ?? "Viewer");

      // Exit animation and navigate
      setExiting(true);
      setTimeout(() => router.push("/dashboard"), 650);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[140px]" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-accent/3 blur-[140px]" />
      </div>

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(128,128,128,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="absolute right-4 top-4 z-20 flex items-center gap-1">
        <ThemeSwitcher />
        <ModeToggle />
      </div>

      {/* Login card */}
      <AnimatePresence mode="wait">
        {!exiting && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md px-4"
          >
            <div className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] backdrop-blur-xl">
              {/* Brand */}
              <div className="mb-8 flex flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  <Logo size={40} />
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="mt-4 text-xl font-semibold tracking-tight"
                >
                  Bishal Sales
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="mt-1 text-xs font-medium uppercase tracking-widest text-muted-foreground"
                >
                  CRM
                </motion.p>
              </div>

              {/* Form */}
              <form onSubmit={submit} className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <label className="mb-1.5 block text-sm font-medium">
                    Username
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      autoComplete="username"
                      className="h-11 pl-10"
                      disabled={loading}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <label className="mb-1.5 block text-sm font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      className="h-11 pl-10"
                      disabled={loading}
                    />
                  </div>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <Button
                    type="submit"
                    className={cn(
                      "relative h-12 w-full text-sm font-semibold transition-all",
                      loading && "pointer-events-none opacity-80",
                    )}
                    disabled={loading}
                  >
                    {loading ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: "linear",
                        }}
                        className="inline-block"
                      >
                        ⟳
                      </motion.span>
                    ) : (
                      <>
                        <LogIn className="mr-2 size-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                  className="pt-2 text-center text-xs text-muted-foreground"
                >
                  Credentials provided by admin
                </motion.p>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit shimmer */}
      <AnimatePresence>
        {exiting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-20 bg-accent/5"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 left-0 right-0 h-[2px] origin-left bg-accent"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
