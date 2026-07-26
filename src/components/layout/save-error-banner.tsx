"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { useData } from "@/components/providers/data-provider";
import { Button } from "@/components/ui/button";

/**
 * A failed write must never be silent — the user would carry on believing
 * their record was saved. This surfaces the failure and offers a reload so
 * the screen can be re-synced with what is actually in the database.
 */
export function SaveErrorBanner() {
  const { saveError, clearSaveError, refresh } = useData();

  return (
    <AnimatePresence>
      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-3 top-3 z-[60] mx-auto max-w-xl"
        >
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/45 bg-destructive/[0.10] p-3 shadow-[var(--shadow-float)] backdrop-blur">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">
                Not saved to the database
              </div>
              <div className="mt-0.5 break-words text-xs text-muted-foreground">
                {saveError}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                It is still on screen, but a refresh will lose it.
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                clearSaveError();
                void refresh();
              }}
              className="shrink-0"
            >
              <RefreshCw />
              Reload
            </Button>
            <button
              onClick={clearSaveError}
              aria-label="Dismiss"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
