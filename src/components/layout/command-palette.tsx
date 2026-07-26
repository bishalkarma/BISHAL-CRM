"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useTheme } from "next-themes";
import {
  Building2,
  FileText,
  Keyboard,
  Moon,
  Palette,
  Plus,
  Search,
  Sun,
  Target,
  Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ALL_NAV_ITEMS } from "@/lib/navigation";
import { useData } from "@/components/providers/data-provider";
import { THEMES } from "@/lib/themes";
import { useAccentTheme } from "@/components/theme/theme-provider";
import { formatCurrency } from "@/lib/utils";

export function CommandPalette({
  open,
  onOpenChange,
  onShowShortcuts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowShortcuts: () => void;
}) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { setAccent } = useAccentTheme();
  const { deals } = useData();
  const [search, setSearch] = React.useState("");

  const run = React.useCallback(
    (fn: () => void) => {
      onOpenChange(false);
      setSearch("");
      // Let the dialog close animation start before navigating.
      requestAnimationFrame(fn);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="max-w-xl gap-0 overflow-hidden p-0 sm:top-[22%] sm:translate-y-0"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command
          loop
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/70"
        >
          <div className="flex items-center gap-2.5 border-b border-border px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              autoFocus
              placeholder="Search deals, companies, or jump to…"
              className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[min(64vh,420px)] overflow-y-auto p-2 scrollbar-thin">
            <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Quick actions">
              <Item
                icon={Plus}
                label="Create new deal"
                shortcut="N"
                onSelect={() => run(() => router.push("/pipeline"))}
              />
              <Item
                icon={Building2}
                label="Add company"
                onSelect={() => run(() => router.push("/companies"))}
              />
              <Item
                icon={Users}
                label="Add contact"
                onSelect={() => run(() => router.push("/contacts"))}
              />
              <Item
                icon={FileText}
                label="Create quotation"
                onSelect={() => run(() => router.push("/quotations"))}
              />
            </Command.Group>

            <Command.Group heading="Go to">
              {ALL_NAV_ITEMS.map((item) => (
                <Item
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  shortcut={item.shortcut}
                  onSelect={() => run(() => router.push(item.href))}
                />
              ))}
            </Command.Group>

            <Command.Group heading="Open deals">
              {deals.slice(0, 6).map((deal) => (
                <Command.Item
                  key={deal.id}
                  value={`${deal.title} ${deal.company} ${deal.id}`}
                  onSelect={() => run(() => router.push("/pipeline"))}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors data-[selected=true]:bg-secondary"
                >
                  <Target className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {deal.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {deal.company} · {deal.city}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                    {formatCurrency(deal.value)}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Appearance">
              <Item
                icon={Sun}
                label="Light mode"
                onSelect={() => run(() => setTheme("light"))}
              />
              <Item
                icon={Moon}
                label="Dark mode"
                onSelect={() => run(() => setTheme("dark"))}
              />
              {THEMES.map((theme) => (
                <Item
                  key={theme.id}
                  icon={Palette}
                  label={`Theme: ${theme.name}`}
                  onSelect={() => run(() => setAccent(theme.id))}
                />
              ))}
            </Command.Group>

            <Command.Group heading="Help">
              <Item
                icon={Keyboard}
                label="Keyboard shortcuts"
                shortcut="?"
                onSelect={() => run(onShowShortcuts)}
              />
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function Item({
  icon: Icon,
  label,
  shortcut,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={label}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors data-[selected=true]:bg-secondary"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{label}</span>
      {shortcut && (
        <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}
