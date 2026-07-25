"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GROUPS = [
  {
    title: "General",
    items: [
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["/"], label: "Focus search" },
      { keys: ["?"], label: "Show this dialog" },
      { keys: ["ESC"], label: "Close overlay" },
    ],
  },
  {
    title: "Navigation",
    items: [
      { keys: ["G", "D"], label: "Go to Dashboard" },
      { keys: ["G", "P"], label: "Go to Pipeline" },
      { keys: ["G", "C"], label: "Go to Companies" },
      { keys: ["G", "A"], label: "Go to Activities" },
      { keys: ["G", "S"], label: "Go to Settings" },
    ],
  },
  {
    title: "Actions",
    items: [
      { keys: ["N"], label: "New deal" },
      { keys: ["⌘", "B"], label: "Toggle sidebar" },
      { keys: ["⌘", "J"], label: "Toggle dark mode" },
    ],
  },
];

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Work at the speed of thought — no mouse required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <div className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </div>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="min-w-[26px] rounded-md border border-border bg-secondary px-1.5 py-1 text-center text-[11px] font-semibold"
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
