"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  LayoutGrid,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiBlock } from "@/components/dashboard/kpi-block";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
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
  revenueTrend,
  todaySummary,
  periodStart,
  lossReasons,
  topProducts,
  productsByCustomer,
  expectedToClose,
  samplesAwaiting,
  cashToCollect,
  DASHBOARD_PERIODS,
  type DashboardPeriod,
  distinctCustomerCount,
  openOpportunities,
  averageDealSize,
  dealsByOwner,
} from "@/lib/dashboard-metrics";
import { TeamPerformanceCard } from "@/components/dashboard/team-performance-card";
import {
  LossReasonsTile,
  LossReasonsSummary,
} from "@/components/dashboard/loss-reasons-tile";
import {
  TopProductsTile,
  ProductViewToggle,
  type ProductView,
} from "@/components/dashboard/top-products-tile";
import {
  ExpectedCloseTile,
  ExpectedCloseSummary,
  SamplesAwaitingTile,
  CashToCollectTile,
  CashSummary,
} from "@/components/dashboard/work-tiles";
import {
  readLayout,
  writeLayout,
  clearLayout,
  DEFAULT_LAYOUT,
  type WidgetBox,
} from "@/lib/dashboard-layout";
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
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-current-user";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardView() {
  const { user: currentUser } = useCurrentUser();
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
  const [period, setPeriod] = React.useState<DashboardPeriod>("all");

  /* One phrase reused by every tile, so nothing claims "in this period"
     while the filter says All. */
  const periodLabel =
    period === "all"
      ? "All time"
      : (DASHBOARD_PERIODS.find((p) => p.id === period)?.label ?? "");

  /* The target is read on the client only — localStorage does not exist during
     the server render, and reading it inline would mismatch the markup. */
  const [target, setTarget] = React.useState(DEFAULT_MONTHLY_TARGET);
  React.useEffect(() => setTarget(readMonthlyTarget()), []);
  const saveTarget = React.useCallback((value: number) => {
    setTarget(value);
    writeMonthlyTarget(value);
  }, []);

  /*
    Layout is read on the client only — localStorage does not exist during the
    server render, and reading it inline would mismatch the markup.
  */
  const [layout, setLayout] = React.useState<WidgetBox[]>(DEFAULT_LAYOUT);
  React.useEffect(() => setLayout(readLayout()), []);
  const [editing, setEditing] = React.useState(false);

  const saveLayout = React.useCallback((next: WidgetBox[]) => {
    setLayout(next);
    writeLayout(next);
  }, []);

  const resetLayout = React.useCallback(() => {
    clearLayout();
    setLayout(DEFAULT_LAYOUT);
  }, []);

  /** Which of Value / Qty / Customer the Top products tile is showing. */
  const [productView, setProductView] = React.useState<ProductView>("value");

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
  // BUILD 01 — compact KPI extra figures
  const distinctDealCustomers = React.useMemo(
    () => distinctCustomerCount(scopedDeals),
    [scopedDeals],
  );
  const openDeals = React.useMemo(() => openOpportunities(scopedDeals), [scopedDeals]);
  const openCustomers = React.useMemo(
    () => distinctCustomerCount(openDeals),
    [openDeals],
  );
  const openValue = React.useMemo(
    () => openDeals.reduce((s, d) => s + convert(d.value, d.currency), 0),
    [openDeals, convert],
  );
  const avgDealSize = React.useMemo(
    () => averageDealSize(scopedDeals, convert),
    [scopedDeals, convert],
  );
  const teamRows = React.useMemo(
    () => dealsByOwner(scopedDeals, convert),
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
  const byType = React.useMemo(
    () => customersByType(scopedCompanies),
    [scopedCompanies],
  );
  const trend = React.useMemo(
    () => revenueTrend(deals, convert, target),
    [deals, convert, target],
  );

  /* Each of these filters on the date its own question implies — lost date
     for losses, expected close for the forecast, created for the rest. */
  const losses = React.useMemo(
    () => lossReasons(deals, period, convert),
    [deals, period, convert],
  );
  const products = React.useMemo(
    () => topProducts(deals, period, convert),
    [deals, period, convert],
  );
  const productsByCust = React.useMemo(
    () => productsByCustomer(deals, period, convert),
    [deals, period, convert],
  );
  const expected = React.useMemo(
    () => expectedToClose(deals, period, convert),
    [deals, period, convert],
  );
  const samples = React.useMemo(
    () => samplesAwaiting(deals, period, convert),
    [deals, period, convert],
  );
  const cash = React.useMemo(
    () => cashToCollect(companies, deals, period, convert),
    [companies, deals, period, convert],
  );

  const companyName = React.useCallback(
    (id: string) => companies.find((c) => c.id === id)?.name ?? "—",
    [companies],
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <PageHeader
        title={`${greeting()}, ${currentUser?.displayName?.split(" ")[0] || "User"}`}
        description="Your customers, deals and work in one place."
        actions={
          <>
            {/* Dragging stays off until asked for, so a stray click on a
                chart never rearranges the page. */}
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={resetLayout}>
                  <RotateCcw />
                  Reset
                </Button>
                <Button size="sm" onClick={() => setEditing(false)}>
                  <Check />
                  Done
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden lg:inline-flex"
                  onClick={() => setEditing(true)}
                >
                  <LayoutGrid />
                  Edit layout
                </Button>
                <Button size="sm" asChild>
                  <Link href="/pipeline">
                    Open pipeline
                    <ArrowRight />
                  </Link>
                </Button>
              </>
            )}
          </>
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
        {period !== "all" && (
          <span className="ml-1 text-[11px] text-muted-foreground">
            {scopedDeals.length} of {deals.length} deals
          </span>
        )}
      </div>

      {editing && (
        <div className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/[0.06] px-3 py-2 text-xs">
          <LayoutGrid className="size-3.5 shrink-0 text-accent" />
          <span>
            Drag the <strong className="font-semibold">Move</strong> tab to
            reposition, or pull a corner to resize.
          </span>
          <span className="ml-auto hidden text-muted-foreground sm:inline">
            Saved on this device
          </span>
        </div>
      )}

      {/* BUILD 01 — Team strip: Admin/Manager see whole team, Sales Rep sees personal */}
      {(currentUser?.roleName === "Admin" || currentUser?.roleName === "Manager") && (
        <TeamPerformanceCard
          rows={teamRows}
          formatMoney={money}
          periodLabel={periodLabel}
          viewerRole={currentUser?.roleName}
          viewerName={currentUser?.displayName}
        />
      )}
      {currentUser?.roleName === "Sales Rep" && scopedDeals.length > 0 && (
        <TeamPerformanceCard
          rows={teamRows}
          formatMoney={money}
          periodLabel={periodLabel}
          viewerRole={currentUser?.roleName}
          viewerName={currentUser?.displayName}
        />
      )}

      <DashboardGrid
        layout={layout}
        editing={editing}
        onLayoutChange={saveLayout}
      >
        {{
          kpi: (
            <KpiBlock
              totalCustomers={scopedCompanies.length}
              totals={totals}
              openCount={openDeals.length}
              openCustomers={openCustomers}
              openValue={openValue}
              distinctDealCustomers={distinctDealCustomers}
              avgDealSize={avgDealSize}
              activityMixSlices={mix}
              formatMoney={money}
              periodLabel={period === "all" ? "all time" : "in this period"}
            />
          ),

          revenue: (
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Revenue vs target</CardTitle>
                <CardDescription>Won revenue, last 8 months</CardDescription>
              </CardHeader>
              <CardContent className="min-h-0 flex-1">
                <RevenueTargetChart
                  data={trend}
                  target={target}
                  onTargetChange={saveTarget}
                  format={format}
                />
              </CardContent>
            </Card>
          ),

          pipeline: (
            <Card className="flex flex-col">
              {/* The way to the full board lives here in the header, once —
                  not repeated inside every stage pop-up. */}
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <div className="min-w-0">
                  <CardTitle>Pipeline by stage</CardTitle>
                  <CardDescription>Open deals across the board</CardDescription>
                </div>
                <Link
                  href="/pipeline"
                  className="flex shrink-0 items-center gap-1 text-xs font-medium text-accent transition-opacity hover:opacity-80"
                >
                  Full board
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
                <PipelineFunnel deals={scopedDeals} periodLabel={periodLabel} />
              </CardContent>
            </Card>
          ),

          today: (
            <Card className="flex flex-col">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
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
              <CardContent className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
                <TodayPanel
                  summary={today}
                  companyName={companyName}
                  onOpenCompany={setOpenCompanyId}
                />
              </CardContent>
            </Card>
          ),

          mix: (
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Activity mix</CardTitle>
                <CardDescription>
                  How contact time is spent · {periodLabel}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
                <DistributionChart
                  slices={mix}
                  emptyLabel="No activity logged yet."
                />
              </CardContent>
            </Card>
          ),

          spancop: <SpancopFunnelWidget />,

          loss: (
            <Card className="flex flex-col">
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <div className="min-w-0">
                  <CardTitle>Why we lose</CardTitle>
                  <CardDescription>
                    Lost deals by reason · {periodLabel}
                  </CardDescription>
                </div>
                <LossReasonsSummary rows={losses} formatMoney={money} />
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
                <LossReasonsTile
                  rows={losses}
                  formatMoney={money}
                  periodLabel={periodLabel}
                />
              </CardContent>
            </Card>
          ),

          products: (
            <Card className="flex flex-col">
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <div className="min-w-0">
                  <CardTitle>Top products</CardTitle>
                  <CardDescription>
                    Open deals · {periodLabel}
                  </CardDescription>
                </div>
                <ProductViewToggle
                  view={productView}
                  onChange={setProductView}
                />
              </CardHeader>
              {/* Fixed tile, scrolling list — switching view must never
                  resize the card or shove its neighbours. */}
              <CardContent className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
                <TopProductsTile
                  view={productView}
                  products={products}
                  byCustomer={productsByCust}
                  formatMoney={money}
                  periodLabel={periodLabel}
                />
              </CardContent>
            </Card>
          ),

          expected: (
            <Card className="flex flex-col">
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <div className="min-w-0">
                  <CardTitle>Expected to close</CardTitle>
                  <CardDescription>By expected close date</CardDescription>
                </div>
                <ExpectedCloseSummary rows={expected} formatMoney={money} />
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
                <ExpectedCloseTile rows={expected} formatMoney={money} />
              </CardContent>
            </Card>
          ),

          samples: (
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Samples awaiting feedback</CardTitle>
                <CardDescription>Sent, no response yet</CardDescription>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
                <SamplesAwaitingTile rows={samples} formatMoney={money} />
              </CardContent>
            </Card>
          ),

          cash: (
            <Card className="flex flex-col">
              <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
                <div className="min-w-0">
                  <CardTitle>Cash to collect</CardTitle>
                  <CardDescription>Delivered · not fully paid</CardDescription>
                </div>
                <CashSummary rows={cash} formatMoney={money} />
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
                <CashToCollectTile rows={cash} formatMoney={money} />
              </CardContent>
            </Card>
          ),

          types: (
            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>Customers by type</CardTitle>
                <CardDescription>
                  Star rating, new, old, renovation · {periodLabel}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
                <DistributionChart
                  slices={byType}
                  emptyLabel="No customers in this period yet."
                />
              </CardContent>
            </Card>
          ),

        }}
      </DashboardGrid>

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
