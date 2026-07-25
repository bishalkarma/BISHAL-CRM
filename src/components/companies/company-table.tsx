"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Building2, Flag } from "lucide-react";
import type { Company } from "@/lib/companies";
import { LEAD_STATUS_META } from "@/lib/companies";
import { SPANCOP_MAP } from "@/lib/spancop";
import { alertFor } from "./use-companies";
import { SpancopStrip } from "./spancop-strip";
import { FollowUpCell } from "./follow-up-cell";
import { usePrioritisation } from "@/components/providers/prioritisation-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, initials } from "@/lib/utils";

export function CompanyTable({
  companies,
  onOpen,
}: {
  companies: Company[];
  onOpen: (company: Company) => void;
}) {
  const { mode } = usePrioritisation();
  const showLead = mode === "lead-status" || mode === "both";
  const showFollowUp = mode === "follow-up" || mode === "both";

  if (companies.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        No companies match your filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Desktop header */}
      <div className="hidden border-b border-border bg-secondary/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground xl:flex xl:items-center xl:gap-3">
        <span className="min-w-0 flex-[2.4]">Company</span>
        <span className="w-[96px] shrink-0">Business</span>
        <span className="w-[84px] shrink-0">Type</span>
        <span className="w-[168px] shrink-0">SPANCOP</span>
        {showLead && <span className="w-[86px] shrink-0">Lead</span>}
        {showFollowUp && <span className="w-[118px] shrink-0">Follow-up</span>}
        <span className="w-[104px] shrink-0">Alert</span>
        <span className="w-[52px] shrink-0 text-right">Owner</span>
      </div>

      <ul className="divide-y divide-border">
        {companies.map((company, index) => {
          const alert = alertFor(company);
          const lead = LEAD_STATUS_META[company.leadStatus];

          return (
            <motion.li
              key={company.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.26,
                delay: Math.min(index * 0.025, 0.25),
              }}
            >
              <button
                onClick={() => onOpen(company)}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-secondary/50 xl:flex xl:items-center xl:gap-3"
              >
                {/* Company */}
                <div className="flex min-w-0 flex-[2.4] items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-semibold text-accent">
                    {company.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {company.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {company.cluster && company.cluster !== "Independent"
                        ? `${company.cluster} · `
                        : ""}
                      {company.area}, {company.emirate}
                    </span>
                  </span>
                </div>

                {/* Business and Type are separate columns */}
                <div className="mt-2 flex items-center gap-1.5 xl:mt-0 xl:w-[96px] xl:shrink-0">
                  <Badge variant="outline" className="gap-1">
                    <Building2 />
                    {company.business}
                  </Badge>
                </div>
                <div className="mt-1.5 xl:mt-0 xl:w-[84px] xl:shrink-0">
                  <Badge
                    variant={company.business === "Hotel" ? "warning" : "default"}
                  >
                    {company.type}
                  </Badge>
                </div>

                {/* SPANCOP */}
                <div className="mt-2 xl:mt-0 xl:w-[168px] xl:shrink-0">
                  <SpancopStrip stage={company.spancop} size="sm" />
                  <span className="mt-1 block text-[10px] text-muted-foreground">
                    {SPANCOP_MAP[company.spancop].label}
                  </span>
                </div>

                {/* Prioritisation columns */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 xl:mt-0 xl:contents">
                  {showLead && (
                    <div className="xl:w-[86px] xl:shrink-0">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                          lead.tint,
                        )}
                      >
                        <Flag className="size-2.5" />
                        {lead.label}
                      </span>
                    </div>
                  )}
                  {showFollowUp && (
                    <div className="xl:w-[118px] xl:shrink-0">
                      <FollowUpCell date={company.nextFollowUp} />
                    </div>
                  )}

                  {/* Alert */}
                  <div className="xl:w-[104px] xl:shrink-0">
                    {alert ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          alert.kind === "reorder-gap"
                            ? "bg-destructive/12 text-destructive"
                            : "bg-warning/15 text-warning",
                        )}
                        title={alert.detail}
                      >
                        <AlertTriangle className="size-2.5" />
                        {alert.label}
                      </span>
                    ) : (
                      <span className="hidden text-xs text-muted-foreground xl:inline">
                        —
                      </span>
                    )}
                  </div>
                </div>

                {/* Owner */}
                <div className="mt-2 flex xl:mt-0 xl:w-[52px] xl:shrink-0 xl:justify-end">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-secondary text-[9px]">
                      {initials(company.owner)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
