"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/use-current-user";

type Counts = Record<string, number>;

export function DangerZone() {
  const { user, loading } = useCurrentUser();
  const [open, setOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [backup, setBackup] = React.useState(true);
  const [counts, setCounts] = React.useState<Counts | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isAdmin = user?.roleName === "Admin";

  // Fetch counts when the modal opens.
  React.useEffect(() => {
    if (!open || !isAdmin) return;
    let cancelled = false;
    fetchCounts().then((c) => {
      if (!cancelled) setCounts(c);
    });
    return () => {
      cancelled = true;
    };
  }, [open, isAdmin]);

  async function fetchCounts(): Promise<Counts> {
    const userId = sessionStorage.getItem("demo_user_id");
    const userName = sessionStorage.getItem("demo_user");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (userId) headers["x-demo-user-id"] = userId;
    if (userName) headers["x-demo-user"] = userName;
    const res = await fetch("/api/admin/reset-data", { headers });
    if (!res.ok) throw new Error("Failed to load counts");
    return (await res.json()).counts;
  }

  async function handleDelete() {
    if (confirmText.trim().toUpperCase() !== "DELETE") return;
    setError(null);
    setBusy(true);

    const userId = sessionStorage.getItem("demo_user_id");
    const userName = sessionStorage.getItem("demo_user");
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (userId) headers["x-demo-user-id"] = userId;
    if (userName) headers["x-demo-user"] = userName;

    try {
      const res = await fetch("/api/admin/reset-data", {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setBusy(false);
        return;
      }
      setDone(true);
      // Auto-close + refresh after a beat.
      setTimeout(() => {
        window.location.reload();
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setBusy(false);
    }
  }

  // Non-admin users see nothing.
  if (loading || !isAdmin) return null;

  return (
    <>
      <section className="rounded-xl border border-destructive/30 bg-destructive/[0.04]">
        <div className="border-b border-destructive/20 px-5 py-3">
          <h2 className="text-sm font-semibold tracking-wide text-destructive">
            DANGER ZONE
          </h2>
        </div>

        <div className="px-5 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0 text-destructive" />
                <h3 className="text-base font-semibold">Delete All CRM Data</h3>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Permanently remove all companies, contacts, deals, activities, and stage history.
                User accounts and roles are preserved. This cannot be undone.
              </p>
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={backup}
                  onChange={(e) => setBackup(e.target.checked)}
                  className="size-3.5 accent-[hsl(var(--destructive))]"
                />
                <span className="text-muted-foreground">
                  Export a JSON backup before deleting
                </span>
              </label>
            </div>
            <Button
              variant="destructive"
              className="shrink-0"
              onClick={() => {
                setOpen(true);
                setConfirmText("");
                setDone(false);
                setError(null);
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Reset All Data
            </Button>
          </div>
        </div>
      </section>

      {/* Confirmation dialog */}
      <Dialog open={open} onOpenChange={(v) => !v && !busy && setOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Confirm Delete All Data
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 py-4 text-center"
              >
                <CheckCircle2 className="mx-auto size-12 text-green-500" />
                <p className="text-base font-semibold">All CRM data deleted</p>
                <p className="text-sm text-muted-foreground">
                  Reloading the app…
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 py-2"
              >
                <p className="text-sm text-muted-foreground">
                  This action is <strong className="text-foreground">permanent</strong> and cannot be undone.
                  The following will be erased:
                </p>

                {counts && (
                  <ul className="space-y-1.5 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm">
                    {(Object.entries(counts) as [string, number][]).map(([label, count]) => (
                      <li key={label} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold tabular-nums">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="text-xs text-muted-foreground">
                  User accounts and roles will be <strong className="text-foreground">preserved</strong>.
                </p>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Type DELETE to confirm
                  </label>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="h-10 font-mono tracking-widest"
                    disabled={busy}
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setOpen(false)}
                    disabled={busy}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDelete}
                    disabled={confirmText.trim().toUpperCase() !== "DELETE" || busy}
                  >
                    {busy ? "Deleting…" : "I Understand, Delete All"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
