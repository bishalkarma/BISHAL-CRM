import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Filter } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { SegmentChart } from "@/components/dashboard/segment-chart";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Leaderboard } from "@/components/dashboard/leaderboard";
import { DealsTable } from "@/components/dashboard/deals-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ACTIVITIES, DEALS, CURRENT_USER } from "@/lib/demo-data";
import { formatCompactCurrency, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const openDeals = DEALS.filter(
    (deal) => deal.stage !== "won" && deal.stage !== "lost",
  );
  const wonDeals = DEALS.filter((deal) => deal.stage === "won");
  const pipelineValue = openDeals.reduce((sum, deal) => sum + deal.value, 0);
  const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
  const closedCount = DEALS.filter(
    (deal) => deal.stage === "won" || deal.stage === "lost",
  ).length;
  const winRate = Math.round((wonDeals.length / Math.max(closedCount, 1)) * 100);
  const openActivities = ACTIVITIES.filter((activity) => !activity.done).length;
  const avgDealSize = Math.round(
    DEALS.reduce((sum, deal) => sum + deal.value, 0) / DEALS.length,
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 px-4 py-5 sm:px-6 sm:py-6">
      <PageHeader
        title={`${greeting()}, ${CURRENT_USER.name.split(" ")[0]}`}
        description="Here's how your hospitality pipeline is performing this quarter."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter />
              This quarter
            </Button>
            <Button size="sm" asChild>
              <Link href="/pipeline">
                Open pipeline
                <ArrowRight />
              </Link>
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          index={0}
          label="Pipeline value"
          value={pipelineValue}
          format="currency"
          delta={12.4}
          deltaLabel="vs last quarter"
          icon="target"
        />
        <KpiCard
          index={1}
          label="Closed won"
          value={wonValue}
          format="currency"
          delta={8.1}
          deltaLabel="vs last quarter"
          icon="revenue"
        />
        <KpiCard
          index={2}
          label="Win rate"
          value={winRate}
          format="percent"
          delta={-3.2}
          deltaLabel="vs last quarter"
          icon="winrate"
        />
        <KpiCard
          index={3}
          label="Avg deal size"
          value={avgDealSize}
          format="currency"
          delta={5.6}
          deltaLabel="vs last quarter"
          icon="deal"
        />
      </div>

      {/* Revenue + funnel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Revenue vs target</CardTitle>
              <CardDescription>Closed-won revenue, last 8 months</CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-chart-1" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-muted-foreground" />
                Target
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline by stage</CardTitle>
            <CardDescription>
              {formatNumber(openDeals.length)} open deals ·{" "}
              {formatCompactCurrency(pipelineValue)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineFunnel />
          </CardContent>
        </Card>
      </div>

      {/* Deals + activities */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Deals needing attention</CardTitle>
              <CardDescription>Highest value open opportunities</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pipeline">
                View all
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DealsTable />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Today&apos;s activities</CardTitle>
              <CardDescription>Calls, meetings &amp; samples</CardDescription>
            </div>
            <Badge variant="accent">{openActivities} due</Badge>
          </CardHeader>
          <CardContent>
            <ActivityFeed />
          </CardContent>
        </Card>
      </div>

      {/* Segments + team */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by segment</CardTitle>
            <CardDescription>
              Where your hospitality revenue comes from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team performance</CardTitle>
            <CardDescription>Revenue closed and quota attainment</CardDescription>
          </CardHeader>
          <CardContent>
            <Leaderboard />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
