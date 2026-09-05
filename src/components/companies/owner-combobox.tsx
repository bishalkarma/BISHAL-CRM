"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type UserOption = {
  id: string;
  label: string;
  value: string;
  roleName: string;
};

export function OwnerCombobox({
  value,
  onChange,
  selectedLabel,
}: {
  value: string;
  onChange: (userId: string, userName: string) => void;
  selectedLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [users, setUsers] = React.useState<UserOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Fetch users from API with proper auth headers
  React.useEffect(() => {
    if (!open || users.length > 0) return;
    
    setLoading(true);
    
    // Get current user info from sessionStorage
    const userId = typeof window !== "undefined" ? sessionStorage.getItem("demo_user_id") : null;
    const userName = typeof window !== "undefined" ? sessionStorage.getItem("demo_user") : null;
    
    // Build headers for authentication
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (userId) headers["x-demo-user-id"] = userId;
    if (userName) headers["x-demo-user"] = userName;
    
    fetch("/api/team/users", { headers })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.users) {
          const options = data.users.map((u: { id: string; display_name: string | null; username: string; roleName: string | null }) => ({
            id: u.id,
            label: u.display_name || u.username || "Unknown",  // Always use display name
            value: u.id,  // UUID for owner_id
            roleName: u.roleName || "Viewer",
          }));
          setUsers(options);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch users:", err);
        setLoading(false);
      });
  }, [open, users.length]);

  const filtered = users.filter((u) =>
    u.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const select = (user: UserOption) => {
    onChange(user.value, user.label);
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
          {users.find(u => u.value === value)?.label || selectedLabel || "Select owner"}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover p-1 shadow-[var(--shadow-float)]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search owner..."
            className="mb-1 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-accent"
            autoFocus
          />
          <ul className="max-h-60 overflow-y-auto">
            {loading ? (
              <li className="px-2.5 py-6 text-center text-xs text-muted-foreground">
                Loading users...
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-2.5 py-6 text-center text-xs text-muted-foreground">
                No users found
              </li>
            ) : (
              filtered.map((user) => (
                <li key={user.value}>
                  <button
                    type="button"
                    onClick={() => select(user)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent/10",
                      value === user.value && "bg-accent/10",
                    )}
                  >
                    <span className="flex-1 truncate">{user.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.roleName}
                    </span>
                    {value === user.value && (
                      <Check className="size-4 text-accent" />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
