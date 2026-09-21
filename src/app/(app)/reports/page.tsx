"use client";

import * as React from "react";
import { useData } from "@/components/providers/data-provider";
import { useCurrentUser } from "@/hooks/use-current-user";
import dynamic from "next/dynamic";
import { PeriodKey } from "@/lib/reports";

// Lazy load heavy report components
const SalesPerformanceReport = dynamic(
  () => import("@/components/reports/sales-performance").then(mod => ({ default: mod.SalesPerformanceReport })),
  { loading: () => <div className="h-64 rounded-lg border border-border bg-secondary/30 animate-pulse" /> }
);

const PipelineHealthReport = dynamic(
  () => import("@/components/reports/pipeline-health").then(mod => ({ default: mod.PipelineHealthReport })),
  { loading: () => <div className="h-64 rounded-lg border border-border bg-secondary/30 animate-pulse" /> }
);

const CustomerRevenueReport = dynamic(
  () => import("@/components/reports/customer-revenue").then(mod => ({ default: mod.CustomerRevenueReport })),
  { loading: () => <div className="h-64 rounded-lg border border-border bg-secondary/30 animate-pulse" /> }
);

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "quarter", label: "This Quarter" },
  { key: "year", label: "This Year" },
  { key: "all", label: "All Time" },
];

export default function ReportsPage() {
  const { companies, contacts, deals, activities } = useData();
  const { user } = useCurrentUser();

  // Use sessionStorage as primary role source (set at login, instant, reliable)
  // Falls back to useCurrentUser API for display name
  const sessionRole = typeof window !== "undefined" ? sessionStorage.getItem("demo_user_role") : null;
  const role = sessionRole || user?.roleName || "Viewer";
  const userId = typeof window !== "undefined" ? sessionStorage.getItem("demo_user_id") : null;
  const userName = typeof window !== "undefined" ? sessionStorage.getItem("demo_user") : null;
  const displayName =
    (typeof window !== "undefined" ? sessionStorage.getItem("demo_display_name") : null) ||
    user?.displayName ||
    userName;

  const [period, setPeriod] = React.useState<PeriodKey>("month");

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 overflow-x-hidden px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "Admin" || role === "Manager"
              ? "Team-wide performance metrics"
              : "Your personal performance metrics"}
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Period:</span>
        <div className="flex gap-1 rounded-lg border border-border bg-secondary/30 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p.key
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports */}
      <SalesPerformanceReport
        deals={deals}
        companies={companies}
        period={period}
        role={role}
        userId={userId}
        userName={userName}
      />

      <PipelineHealthReport
        deals={deals}
        companies={companies}
        period={period}
        role={role}
        userId={userId}
        userName={userName}
      />

      <CustomerRevenueReport
        companies={companies}
        deals={deals}
        contacts={contacts}
        period={period}
        role={role}
        userId={userId}
        userName={userName}
      />
    </div>
  );
}
