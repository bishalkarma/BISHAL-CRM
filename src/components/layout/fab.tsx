"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  CalendarPlus,
  Plus,
  Target,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FabAction = "deal" | "company" | "contact" | "activity";

const ACTIONS: { id: FabAction; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "deal", label: "New deal", icon: Target },
  { id: "company", label: "New company", icon: Building2 },
  { id: "contact", label: "New contact", icon: UserPlus },
  { id: "activity", label: "Log activity", icon: CalendarPlus },
];

/**
 * Floating action button with a speed-dial menu.
 *
 * Each action fires an `onAction` callback — the caller decides whether to
 * navigate or open a dialog.
 */
export function FloatingActionButton({
  onAction,
}: {
  onAction?: (action: FabAction) => void;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tap = (id: FabAction) => {
    setOpen(false);
    onAction?.(id);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <div className="safe-bottom fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-2.5 lg:bottom-6 lg:right-6">
        <AnimatePresence>
          {open &&
            ACTIONS.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  type="button"
                  onClick={() => tap(action.id)}
                  initial={{ opacity: 0, y: 12, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.85 }}
                  transition={{
                    duration: 0.22,
                    delay: (ACTIONS.length - index - 1) * 0.035,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-center gap-2.5 rounded-full border border-border bg-popover py-2 pl-3.5 pr-4 text-sm font-medium shadow-[var(--shadow-float)] transition-transform duration-150 hover:scale-[1.03] active:scale-95"
                >
                  <Icon className="size-4 text-accent" />
                  {action.label}
                </motion.button>
              );
            })}
        </AnimatePresence>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close quick actions" : "Open quick actions"}
          aria-expanded={open}
          className={cn(
            "flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[var(--shadow-float)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:shadow-[var(--shadow-glow)] active:scale-90 lg:size-16",
          )}
        >
          <motion.span
            animate={{ rotate: open ? 135 : 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center"
          >
            <Plus className="size-6" />
          </motion.span>
        </button>
      </div>
    </>
  );
}
