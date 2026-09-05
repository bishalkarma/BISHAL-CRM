"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useTheme } from "next-themes";
import {
  Building2,
  CalendarClock,
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
import { cn, formatCurrency } from "@/lib/utils";

type SearchResult = {
  type: "company" | "contact" | "deal" | "activity";
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  onNavigate: () => void;
};

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
  const { companies, contacts, deals, activities } = useData();
  const [search, setSearch] = React.useState("");

  const run = React.useCallback(
    (fn: () => void) => {
      onOpenChange(false);
      setSearch("");
      requestAnimationFrame(fn);
    },
    [onOpenChange],
  );

  // Build a single unified search index from all CRM data.
  const results = React.useMemo<SearchResult[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];

    const matches = (text: string) =>
      text.toLowerCase().includes(q);

    const companiesFound = companies
      .filter(
        (c) =>
          matches(c.name) ||
          matches(c.cluster ?? "") ||
          matches(c.area) ||
          matches(c.emirate) ||
          matches(c.owner),
      )
      .map<SearchResult>((c) => ({
        type: "company" as const,
        label: c.name,
        subtitle: `${c.cluster ?? "—"} · ${c.area}, ${c.emirate} · ${c.owner}`,
        icon: Building2,
        onNavigate: () => run(() => router.push(`/companies`)),
      }));

    const contactsFound = contacts
      .filter(
        (c) =>
          matches(c.name) ||
          matches(c.email ?? "") ||
          matches(c.phone) ||
          matches(c.role),
      )
      .map<SearchResult>((c) => ({
        type: "contact" as const,
        label: c.name,
        subtitle: `${c.role} · ${c.email ?? c.phone}`,
        icon: Users,
        onNavigate: () => run(() => router.push(`/contacts`)),
      }));

    const dealsFound = deals
      .filter(
        (d) =>
          matches(d.title) ||
          matches(d.company) ||
          matches(d.category) ||
          matches(d.owner),
      )
      .map<SearchResult>((d) => ({
        type: "deal" as const,
        label: d.title,
        subtitle: `${formatCurrency(d.value)} · ${d.stage} · ${d.company}`,
        icon: Target,
        onNavigate: () => run(() => router.push(`/pipeline`)),
      }));

    const activitiesFound = activities
      .filter(
        (a) =>
          matches(a.report) ||
          matches(a.task ?? "") ||
          matches(a.type),
      )
      .map<SearchResult>((a) => ({
        type: "activity" as const,
        label: a.report,
        subtitle: `${a.type} · ${new Date(a.occurredAt).toLocaleDateString()}`,
        icon: CalendarClock,
        onNavigate: () => run(() => router.push(`/activities`)),
      }));

    return [
      ...companiesFound,
      ...contactsFound,
      ...dealsFound,
      ...activitiesFound,
    ];
  }, [search, companies, contacts, deals, activities, run, router]);

  // Counts per type for section headings.
  const counts = React.useMemo(() => {
    const c: Record<string, number> = {};
    results.forEach((r) => {
      c[r.type] = (c[r.type] ?? 0) + 1;
    });
    return c;
  }, [results]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="max-w-xl gap-0 overflow-hidden p-0 sm:top-[18%] sm:translate-y-0"
      >
        <DialogTitle className="sr-only">Search the CRM</DialogTitle>
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
              placeholder="Search companies, contacts, deals, activities…"
              className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[min(64vh,440px)] overflow-y-auto p-2 scrollbar-thin">
            {/* No query → show default groups (actions + navigation) */}
            {!search.trim() && (
              <>
                <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
                  Start typing to search…
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
              </>
            )}

            {/* Has query → show filtered results grouped by type */}
            {search.trim() && (
              <>
                <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{search}&rdquo;
                </Command.Empty>

                {counts.company > 0 && (
                  <Command.Group heading={`Companies · ${counts.company}`}>
                    {results
                      .filter((r) => r.type === "company")
                      .map((r, i) => (
                        <ResultItem key={`c${i}`} result={r} />
                      ))}
                  </Command.Group>
                )}

                {counts.contact > 0 && (
                  <Command.Group heading={`Contacts · ${counts.contact}`}>
                    {results
                      .filter((r) => r.type === "contact")
                      .map((r, i) => (
                        <ResultItem key={`ct${i}`} result={r} />
                      ))}
                  </Command.Group>
                )}

                {counts.deal > 0 && (
                  <Command.Group heading={`Deals · ${counts.deal}`}>
                    {results
                      .filter((r) => r.type === "deal")
                      .map((r, i) => (
                        <ResultItem key={`d${i}`} result={r} />
                      ))}
                  </Command.Group>
                )}

                {counts.activity > 0 && (
                  <Command.Group heading={`Activities · ${counts.activity}`}>
                    {results
                      .filter((r) => r.type === "activity")
                      .map((r, i) => (
                        <ResultItem key={`a${i}`} result={r} />
                      ))}
                  </Command.Group>
                )}
              </>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function ResultItem({ result }: { result: SearchResult }) {
  const Icon = result.icon;
  return (
    <Command.Item
      value={`${result.label} ${result.subtitle}`}
      onSelect={result.onNavigate}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors data-[selected=true]:bg-secondary"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{result.label}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {result.subtitle}
        </span>
      </span>
    </Command.Item>
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
