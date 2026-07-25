"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Filter,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { Company } from "@/lib/companies";
import { BUSINESS_TYPES, EMIRATES } from "@/lib/companies";
import { SPANCOP_MAP, type SpancopStage } from "@/lib/spancop";
import { DEAL_OWNERS } from "@/lib/deals";
import { useCompanies } from "./use-companies";
import { CompanyTable } from "./company-table";
import { CompanyDrawer } from "./company-drawer";
import { SpancopFunnel } from "./spancop-funnel";
import { PrioritisationSwitch } from "./prioritisation-switch";
import { SuggestionsDialog } from "./suggestions-dialog";
import { NewCompanyDialog } from "./new-company-dialog";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function CompaniesView() {
  const {
    companies,
    filtered,
    transitions,
    filters,
    setFilters,
    resetFilters,
    activeFilterCount,
    snapshot,
    pendingSuggestions,
    alerts,
    moveStage,
    dismissSuggestion,
    addCompany,
  } = useCompanies();

  const [selected, setSelected] = React.useState<Company | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);

  const openCompany = React.useCallback((company: Company) => {
    setSelected(company);
    setDrawerOpen(true);
  }, []);

  const live = selected
    ? (filtered.find((c) => c.id === selected.id) ?? selected)
    : null;

  const toggleStage = (stage: SpancopStage) =>
    setFilters((f) => ({
      ...f,
      stages: f.stages.includes(stage)
        ? f.stages.filter((s) => s !== stage)
        : [...f.stages, stage],
    }));

  const toggleIn = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Companies"
        description="Customer relationships tracked through the SPANCOP cycle."
        actions={
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus />
            New Company
          </Button>
        }
      />

      {/* SPANCOP snapshot */}
      <div>
        <div className="flex items-baseline justify-between pb-2">
          <h2 className="text-sm font-semibold">SPANCOP snapshot</h2>
          <span className="text-xs text-muted-foreground">
            Tap a stage to filter · {filtered.length} companies
          </span>
        </div>
        <SpancopFunnel
          snapshot={snapshot}
          activeStages={filters.stages}
          onToggleStage={toggleStage}
        />
      </div>

      <PrioritisationSwitch />

      {/* Suggestions — count only; the list opens in a dialog */}
      <AnimatePresence initial={false}>
        {pendingSuggestions.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            onClick={() => setSuggestionsOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-xl border border-accent/40 bg-accent/[0.06] p-3 text-left transition-colors hover:bg-accent/[0.1]"
          >
            <Sparkles className="size-4 shrink-0 text-accent" />
            <span className="min-w-0 flex-1 text-sm">
              <span className="font-medium">
                {pendingSuggestions.length} stage{" "}
                {pendingSuggestions.length === 1 ? "change" : "changes"} suggested
              </span>
              <span className="ml-1.5 text-muted-foreground">
                · nothing moves until you approve
              </span>
            </span>
            <span className="shrink-0 rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              Review
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.query}
            onChange={(e) =>
              setFilters((f) => ({ ...f, query: e.target.value }))
            }
            placeholder="Search companies…"
            className="h-9 pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <Badge variant="accent" className="ml-0.5 px-1.5 py-0">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[420px] w-56 overflow-y-auto">
            <DropdownMenuLabel>Business</DropdownMenuLabel>
            {BUSINESS_TYPES.map((b) => (
              <DropdownMenuItem
                key={b}
                onSelect={(e) => {
                  e.preventDefault();
                  setFilters((f) => ({ ...f, business: toggleIn(f.business, b) }));
                }}
              >
                <span className="flex-1">{b}</span>
                {filters.business.includes(b) && (
                  <Check className="size-4 text-accent" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Emirate</DropdownMenuLabel>
            {EMIRATES.map((e2) => (
              <DropdownMenuItem
                key={e2}
                onSelect={(e) => {
                  e.preventDefault();
                  setFilters((f) => ({ ...f, emirates: toggleIn(f.emirates, e2) }));
                }}
              >
                <span className="flex-1">{e2}</span>
                {filters.emirates.includes(e2) && (
                  <Check className="size-4 text-accent" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Owner</DropdownMenuLabel>
            {DEAL_OWNERS.map((o) => (
              <DropdownMenuItem
                key={o}
                onSelect={(e) => {
                  e.preventDefault();
                  setFilters((f) => ({ ...f, owners: toggleIn(f.owners, o) }));
                }}
              >
                <span className="flex-1 truncate">{o}</span>
                {filters.owners.includes(o) && (
                  <Check className="size-4 text-accent" />
                )}
              </DropdownMenuItem>
            ))}
            {activeFilterCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={resetFilters}>
                  <X className="size-4" />
                  Clear all
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={filters.alertsOnly ? "default" : "outline"}
          size="sm"
          onClick={() =>
            setFilters((f) => ({ ...f, alertsOnly: !f.alertsOnly }))
          }
        >
          <AlertTriangle />
          <span className="hidden sm:inline">Needs attention</span>
          <Badge
            variant={filters.alertsOnly ? "default" : "warning"}
            className="ml-0.5 px-1.5 py-0"
          >
            {alerts.length}
          </Badge>
        </Button>

        {filters.stages.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {filters.stages.map((s) => (
              <button
                key={s}
                onClick={() => toggleStage(s)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  SPANCOP_MAP[s].tint,
                )}
              >
                {SPANCOP_MAP[s].label}
                <X className="size-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      <CompanyTable companies={filtered} onOpen={openCompany} />

      <SuggestionsDialog
        open={suggestionsOpen}
        onOpenChange={setSuggestionsOpen}
        suggestions={pendingSuggestions}
        onApprove={(id, stage, reason) =>
          moveStage(id, stage, reason, "accepted-suggestion")
        }
        onDismiss={dismissSuggestion}
      />

      <NewCompanyDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreate={addCompany}
        existingNames={companies.map((c) => c.name)}
      />

      <CompanyDrawer
        company={live}
        transitions={transitions}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onMoveStage={moveStage}
        onDismissSuggestion={dismissSuggestion}
      />
    </div>
  );
}
