"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { Company } from "@/lib/companies";
import { LEAD_STATUS_META } from "@/lib/companies";
import { SPANCOP_MAP } from "@/lib/spancop";
import { cn, initials } from "@/lib/utils";
import { alertFor } from "./use-companies";
import { FollowUpCell } from "./follow-up-cell";

/** Fixed widths keep header/body aligned and leave the company readable on phones. */
const COLUMNS = [
  { label: "Company", width: 148 },
  { label: "Business", width: 80 },
  { label: "Stage", width: 100 },
  { label: "Follow-up", width: 144 },
  { label: "Type", width: 100 },
  { label: "Lead", width: 88 },
  { label: "Alert", width: 128 },
  { label: "Owner", width: 64 },
];

export function MobileCompanyTable({
  companies,
  onOpen,
}: {
  companies: Company[];
  onOpen: (company: Company) => void;
}) {
  return (
    <div className="min-w-0 space-y-2 xl:hidden">
      <div
        role="region"
        aria-label="Companies table. Scroll horizontally for more columns."
        tabIndex={0}
        className="w-full max-w-full overflow-x-auto rounded-xl border border-border bg-card scrollbar-thin focus-visible:outline-2 focus-visible:outline-accent"
      >
        <table className="w-full table-fixed border-separate border-spacing-0 text-left text-xs" style={{ minWidth: COLUMNS.reduce((sum, column) => sum + column.width, 0) }}>
          <caption className="sr-only">
            Companies with business, SPANCOP stage, follow-up, type, lead, alert and owner. Activate a company to open its details.
          </caption>
          <colgroup>
            {COLUMNS.map((column) => <col key={column.label} style={{ width: column.width }} />)}
          </colgroup>
          <thead>
            <tr>
              {COLUMNS.map((column, index) => (
                <th
                  key={column.label}
                  scope="col"
                  className={cn(
                    "border-b border-border bg-secondary px-2 py-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
                    index === 0 && "sticky left-0 z-20 border-r px-3 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]",
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => {
              const stage = SPANCOP_MAP[company.spancop];
              const lead = LEAD_STATUS_META[company.leadStatus];
              const alert = alertFor(company);
              const cell = (content: ReactNode) => (
                <td className="border-b border-border/60 p-0 align-middle group-last:border-b-0">
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => onOpen(company)}
                    aria-label={`Open ${company.name} details`}
                    className="flex min-h-[58px] w-full items-center overflow-hidden px-2 py-2 text-left"
                  >
                    {content}
                  </button>
                </td>
              );

              return (
                <tr key={company.id} className="group hover:bg-secondary/40">
                  <th scope="row" className="sticky left-0 z-10 border-b border-r border-border bg-card p-0 font-normal shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)] group-last:border-b-0 group-hover:bg-secondary">
                    <button
                      type="button"
                      onClick={() => onOpen(company)}
                      className="block min-h-[58px] w-full px-3 py-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                      title={company.name}
                      aria-label={`Open ${company.name} details`}
                    >
                      <span className="line-clamp-2 break-words text-xs font-medium leading-4">{company.name}</span>
                      <span className="mt-0.5 block truncate text-[10px] font-normal text-muted-foreground" title={[company.cluster, company.area, company.emirate].filter(Boolean).join(" · ")}>
                        {[company.area, company.emirate].filter(Boolean).join(", ")}
                      </span>
                    </button>
                  </th>
                  {cell(<span className="break-words text-[11px]">{company.business}</span>)}
                  {cell(
                    <span className={cn("inline-flex max-w-full items-center gap-1 rounded-full px-1.5 py-1 text-[10px] font-medium", stage.tint)}>
                      <span className={cn("size-1.5 shrink-0 rounded-full", stage.color)} />
                      {stage.label}
                    </span>,
                  )}
                  {cell(<FollowUpCell date={company.nextFollowUp} compact />)}
                  {cell(<span className="break-words text-[11px]">{company.type}</span>)}
                  {cell(<span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", lead.tint)}>{lead.label}</span>)}
                  {cell(alert ? (
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-[10px] font-medium", alert.kind === "reorder-gap" ? "bg-destructive/12 text-destructive" : "bg-warning/15 text-warning")} title={alert.detail}>
                      <AlertTriangle className="size-3 shrink-0" />
                      {alert.label}
                    </span>
                  ) : <span className="text-muted-foreground">—</span>)}
                  {cell(<span className="flex size-6 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold" title={company.owner} aria-label={company.owner}>{initials(company.owner)}</span>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="flex items-center justify-between gap-2 px-1 text-[10px] text-muted-foreground">
        <span>Company stays pinned · Tap a row for details</span>
        <span className="inline-flex shrink-0 items-center gap-1">Swipe for more <ArrowRight className="size-3" /></span>
      </p>
    </div>
  );
}
