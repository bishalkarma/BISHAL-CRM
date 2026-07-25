"use client";

import * as React from "react";
import { ArrowRight, Building2, Search, UserPlus } from "lucide-react";
import type { Company } from "@/lib/companies";
import { useData } from "@/components/providers/data-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Step 1 of creating a deal: choose the customer.
 *
 * A deal can never be orphaned, so when no company matches we stop and send
 * the user to create one first, carrying their search text across.
 */
export function CompanyPicker({
  onSelect,
  onCreateCompany,
}: {
  onSelect: (company: Company) => void;
  onCreateCompany: (prefillName: string) => void;
}) {
  const { companies } = useData();
  const [query, setQuery] = React.useState("");
  const trimmed = query.trim();

  const results = React.useMemo(() => {
    if (!trimmed) return companies.slice(0, 6);
    const q = trimmed.toLowerCase();
    return companies.filter((c) =>
      `${c.name} ${c.area} ${c.emirate} ${c.contactName} ${c.cluster ?? ""}`
        .toLowerCase()
        .includes(q),
    ).slice(0, 8);
  }, [trimmed, companies]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customer by name, area or contact…"
          className="pl-9"
        />
      </div>

      {results.length > 0 ? (
        <ul className="max-h-[320px] space-y-1.5 overflow-y-auto scrollbar-thin">
          {results.map((company) => (
            <li key={company.id}>
              <button
                type="button"
                onClick={() => onSelect(company)}
                className="group flex w-full items-center gap-3 rounded-xl border border-border p-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[var(--shadow-soft)]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-semibold text-accent">
                  {company.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {company.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {company.area}, {company.emirate} · {company.contactName}
                  </span>
                </span>
                <Badge variant="outline" className="hidden shrink-0 gap-1 sm:flex">
                  <Building2 />
                  {company.business}
                </Badge>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        /* The guard: no customer, no deal. */
        <div className="rounded-xl border border-dashed border-warning/50 bg-warning/[0.06] p-5 text-center">
          <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-warning/15 text-warning">
            <UserPlus className="size-5" />
          </span>
          <p className="mt-2.5 text-sm font-medium">
            No customer matches &ldquo;{trimmed}&rdquo;
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            A deal must belong to a customer. Create the customer first — we&apos;ll
            bring you straight back here.
          </p>
          <Button
            className="mt-3"
            size="sm"
            onClick={() => onCreateCompany(trimmed)}
          >
            <UserPlus />
            Create &ldquo;{trimmed}&rdquo;
          </Button>
        </div>
      )}
    </div>
  );
}
