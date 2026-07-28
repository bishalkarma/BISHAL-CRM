"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiBlock } from "@/components/dashboard/kpi-block";
import { TodayPanel } from "@/components/dashboard/today-panel";
import { DistributionChart } from "@/components/dashboard/distribution-chart";
import { RevenueTargetChart } from "@/components/dashboard/revenue-target-chart";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { SpancopFunnelWidget } from "@/components/dashboard/spancop-funnel-widget";
import { CompanyDrawer } from "@/components/companies/company-drawer";
import { useCompanies } from "@/components/companies/use-companies";
import { useData } from "@/components/providers/data-provider";
import { useCurrency } from "@/components/providers/currency-provider";
import {
  activityMix,
  companiesInPeriod,
  customersByType,
  dealTotals,
  dealsInPeriod,
  revenueBySegment,
  revenueTrend,
  todaySummary,
  periodStart,
  DASHBOARD_PERIODS,
  type DashboardPeriod,
} from "@/lib/dashboard-metrics";
import {
  readMonthlyTarget,
  writeMonthlyTarget,
  DEFAULT_MONTHLY_TARGET,
} from "@/lib/revenue-target";
import { ACTIVITY_MAP } from "@/lib/activities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CURRENT_USER } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardView() {
  const { companies, deals, activities } = useData();
  const { toDisplay, format } = useCurrency();
  const {
    companies: managedCompanies,
    transitions,
    moveStage,
    dismissSuggestion,
  } = useCompanies();

  /**
   * One period drives every figure on the page. Without it "total deal worth"
   * silently means all time, which is not a number anyone can act on.
   * SPANCOP keeps its own filter, since it answers a different question.
   */
  const [period, setPeriod] = React.useState<DashboardPeriod>("month");

  /* The target is read on the client only — localStorage does not exist during
     the server render, and reading it inline would mismatch the markup. */
  const [target, setTarget] = React.useState(DEFAULT_MONTHLY_TARGET);
  React.useEffect(() => setTarget(readMonthlyTarget()), []);
  const saveTarget = React.useCallback((value: number) => {
    setTarget(value);
    writeMonthlyTarget(value);
  }, []);

  const [openCompanyId, setOpenCompanyId] = React.useState<string | null>(null);
  const openCompany =
    managedCompanies.find((c) => c.id === openCompanyId) ?? null;

  const convert = React.useCallback(
    (amount: number, from: Parameters<typeof toDisplay>[1]) =>
      toDisplay(amount, from),
    [toDisplay],
  );
  const money = React.useCallback(
    (value: number) => format(value, { compact: true }),
    [format],
  );

  const scopedDeals = React.useMemo(
    () => dealsInPeriod(deals, period),
    [deals, period],
  );
  const scopedCompanies = React.useMemo(
    () => companiesInPeriod(companies, period),
    [companies, period],
  );

  const totals = React.useMemo(
    () => dealTotals(scopedDeals, convert),
    [scopedDeals, convert],
  );
  const today = React.useMemo(() => todaySummary(activities), [activities]);

  const scopedActivities = React.useMemo(() => {
    const from = periodStart(period);
    if (from === null) return activities;
    return activities.filter(
      (a) => new Date(a.occurredAt).getTime() >= from,
    );
  }, [activities, period]);

  const mix = React.useMemo(
    () =>
      activityMix(scopedActivities).map((s) => ({
        ...s,
        label: ACTIVITY_MAP[s.key as keyof typeof ACTIVITY_MAP]?.label ?? s.key,
      })),
    [scopedActivities],
  );
  const segments = React.useMemo(
    () => revenueBySegment(scopedDeals, companies, convert),
    [scopedDeals, companies, convert],
  );
  const byType = React.useMemo(
    () => customersByType(scopedCompanies),
    [scopedCompanies],
  );
  const trend = React.useMemo(
    () => revenueTrend(deals, convert, target),
    [deals, convert, target],
  );

  const companyName = React.useCallback(
    (id: string) => companies.find((c) => c.id === id)?.name ?? "—",
    [companies],
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <PageHeader
        title={`${greeting()}, ${CURRENT_USER.name.split(" ")[0]}`}
        description="Your customers, deals and work in one place."
        actions={
          <Button size="sm" asChild>
            <Link href="/pipeline">
              Open pipeline
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      {/* Period — drives every tile and chart below except SPANCOP */}
      <div className="flex flex-wrap items-center gap-1.5">
        {DASHBOARD_PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              period === p.id
                ? "bg-accent text-accent-foreground"
                : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
        <span className="ml-1 text-[11px] text-muted-foreground">
          {scopedDeals.length} of {deals.length} deals
        </span>
      </div>

      <KpiBlock
        totalCustomers={scopedCompanies.length}
        totals={totals}
        formatMoney={money}
      />

      {/* Revenue + pipeline */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue vs target</CardTitle>
            <CardDescription>Won revenue, last 8 months</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueTargetChart
              data={trend}
              target={target}
              onTargetChange={saveTarget}
              format={format}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline by stage</CardTitle>
            <CardDescription>Open deals across the board</CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineFunnel deals={scopedDeals} />
          </CardContent>
        </Card>
      </div>

      {/* Today + activity mix */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Today</CardTitle>
              <CardDescription>What needs you right now</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/activities?view=open-tasks">
                All tasks
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <TodayPanel
              summary={today}
              companyName={companyName}
              onOpenCompany={setOpenCompanyId}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity mix</CardTitle>
            <CardDescription>How contact time is spent</CardDescription>
          </CardHeader>
          <CardContent>
            <DistributionChart
              slices={mix}
              emptyLabel="No activity logged yet."
            />
          </CardContent>
        </Card>
      </div>

      {/*
        SPANCOP takes half the width so the two distribution charts sit beside
        it rather than below. Full width left a long empty bar row and pushed
        everything else off the first screen.
      */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SpancopFunnelWidget />

        <div className="grid gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Revenue by segment</CardTitle>
              <CardDescription>Which venues bring the money</CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionChart
                slices={segments}
                format={money}
                donut
                emptyLabel="No won deals in this period yet."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Customers by type</CardTitle>
              <CardDescription>
                Star rating, new, old, renovation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionChart
                slices={byType}
                emptyLabel="No customers in this period yet."
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Opened from a Today row, over the dashboard rather than navigating */}
      <CompanyDrawer
        company={openCompany}
        transitions={transitions}
        open={Boolean(openCompany)}
        onOpenChange={(next) => !next && setOpenCompanyId(null)}
        onMoveStage={moveStage}
        onDismissSuggestion={dismissSuggestion}
      />
    </div>
  );
}
