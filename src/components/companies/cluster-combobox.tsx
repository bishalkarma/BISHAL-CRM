"use client";

import * as React from "react";
import { Check, ChevronDown, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Search existing clusters or type a new name to create one.
 * Deliberately not a plain <select>: the list grows over time and the user
 * must be able to add a cluster without leaving the form.
 */
export function ClusterCombobox({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const trimmed = query.trim();
  const canCreate =
    trimmed.length > 0 &&
    !options.some((o) => o.toLowerCase() === trimmed.toLowerCase());

  const select = (val: string) => {
    onChange(val);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 text-left text-sm shadow-[var(--shadow-soft)] transition-colors hover:border-accent/40 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <span
          className={cn(
            "flex-1 truncate",
            !value && "text-muted-foreground",
          )}
        >
          {value || "Search or create cluster…"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-[var(--shadow-float)] animate-[scale-in_0.14s_cubic-bezier(0.16,1,0.3,1)]">
          <div className="border-b border-border p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search or create…"
              className="h-8 w-full rounded-md bg-secondary px-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto p-1 scrollbar-thin">
            {filtered.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => select(option)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-secondary"
                >
                  <span className="flex-1 truncate">{option}</span>
                  {value === option && (
                    <Check className="size-4 text-accent" />
                  )}
                </button>
              </li>
            ))}

            {canCreate && (
              <li>
                <button
                  type="button"
                  onClick={() => select(trimmed)}
                  className="flex w-full items-center gap-2 rounded-lg bg-accent/10 px-2.5 py-2 text-left text-sm font-medium text-accent transition-colors hover:bg-accent/15"
                >
                  <Plus className="size-4" />
                  Create &ldquo;{trimmed}&rdquo;
                </button>
              </li>
            )}

            {filtered.length === 0 && !canCreate && (
              <li className="px-2.5 py-6 text-center text-xs text-muted-foreground">
                Start typing to create a cluster
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
