"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Download, TrendingUp, TrendingDown, Trophy, Target, DollarSign, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  filterByRole,
  computeDealMetrics,
  dealsByMonth,
  metricsByOwner,
  downloadCSV,
  formatAED,
  formatNumber,
  formatPercent,
  type PeriodKey,
} from "@/lib/reports";
import type { Company } from "@/lib/companies";
import type { Deal } from "@/lib/deals";

type Props = {
  deals: Deal[];
  companies: Company[];
  period: PeriodKey;
  role: string;
  userId: string | null;
  userName: string | null;
};

export function SalesPerformanceReport({
  deals,
  companies,
  period,
  role,
  userId,
  userName,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  // Theme-aware colors
  const axisColor = isDark ? "#64748b" : "#94a3b8";
  const axisLineColor = isDark ? "#334155" : "#e2e8f0";
  const textColor = isDark ? "#e2e8f0" : "#0f172a";

  const isTeam = (() => {
    const r = (role || "").toLowerCase();
    return r === "admin" || r === "manager";
  })();

  // Fetch team member IDs for Manager role
  const [teamMemberIds, setTeamMemberIds] = React.useState<string[]>([]);
  const [hasTeam, setHasTeam] = React.useState(false);
  React.useEffect(() => {
    if (role !== "Manager" || !userId) return;
    
    const fetchTeam = async () => {
      try {
        const headers: HeadersInit = { "Content-Type": "application/json" };
        if (userId) headers["x-demo-user-id"] = userId;
        
        const res = await fetch("/api/team/users", { headers });
        if (!res.ok) {
          console.error("Failed to fetch team users:", res.status);
          return;
        }
        const data = await res.json();
        console.log("Team users response:", data);
        const teamMembers = (data.users || [])
          .filter((u: { managerId?: string; displayName?: string }) => {
            console.log("Checking user:", u.displayName, "managerId:", u.managerId, "vs userId:", userId);
            return u.managerId === userId;
          })
          .map((u: { id: string }) => u.id);
        console.log("Team members:", teamMembers);
        setTeamMemberIds(teamMembers);
        setHasTeam(teamMembers.length > 0);
      } catch (err) {
        console.error("Failed to fetch team:", err);
      }
    };
    fetchTeam();
  }, [role, userId]);

  // Filter deals by role (UUID-only)
  const filteredDeals = React.useMemo(
    () => filterByRole(deals, role, userId, teamMemberIds),
    [deals, role, userId, teamMemberIds],
  );

  // Compute metrics
  const metrics = React.useMemo(() => computeDealMetrics(filteredDeals), [filteredDeals]);
  const monthlyData = React.useMemo(() => {
    const raw = dealsByMonth(filteredDeals, period);
    return raw.map((m) => ({
      ...m,
      displayLabel: `${formatAED(m.revenue)} · ${m.deals} deals`,
    }));
  }, [filteredDeals, period]);
  const repMetrics = React.useMemo(() => metricsByOwner(filteredDeals, role), [filteredDeals, role]);

  // Role-based data visibility
  const visibleDeals = isTeam ? filteredDeals : filteredDeals.filter((d) => d.owner_id === userId);

  // Previous period comparison (simplified - just show current period)
  const prevMetrics = metrics; // In production, compute for previous period

  const exportData = () => {
    const rows = isTeam
      ? repMetrics.map((r) => ({
          Rep: r.owner,
          Revenue: r.revenue,
          "Deals Won": r.dealsWon,
          "Win Rate": r.winRate.toFixed(1) + "%",
          "Total Deals": r.deals,
        }))
      : filteredDeals.map((d) => ({
          Deal: d.title,
          Company: d.company,
          Value: d.value,
          Stage: d.stage,
          Owner: d.owner,
          "Created At": d.createdAt,
        }));
    downloadCSV(`sales-performance-${period}.csv`, rows);
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {isTeam ? "Sales Performance" : "My Performance"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isTeam ? "Team-wide sales metrics" : "Your personal sales metrics"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportData}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label={isTeam ? "Team Revenue" : "My Revenue"}
          value={formatAED(metrics.revenue)}
          change="+12%"
          positive={true}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPICard
          label={isTeam ? "Team Deals Won" : "My Deals Won"}
          value={formatNumber(metrics.dealsWon)}
          change="+5"
          positive={true}
          icon={<Trophy className="h-4 w-4" />}
        />
        <KPICard
          label="Lost Value"
          value={formatAED(metrics.lostValue)}
          change="-3%"
          positive={false}
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <KPICard
          label={isTeam ? "Team Win Rate" : "My Win Rate"}
          value={formatPercent(metrics.winRate, 1)}
          change="+3%"
          positive={true}
          icon={<Target className="h-4 w-4" />}
        />
      </div>

      {/* Manager with no team message */}
      {role === "Manager" && !hasTeam && metrics.dealsWon === 0 && (
        <div className="mt-6 rounded-lg border border-border bg-secondary/50 p-6 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Team Members Assigned</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You don&apos;t have any Sales Reps assigned to your team yet.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask your Admin to assign team members in <strong>Settings &rarr; Manager Team Assignment</strong>
          </p>
        </div>
      )}

      {/* Manager: Show own deals separate from team */}
      {role === "Manager" && (
        <div className="mt-6 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">My Personal Performance</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-secondary/50 p-3">
              <div className="text-xs text-muted-foreground">My Revenue</div>
              <div className="mt-1 text-lg font-bold">{formatAED(metrics.revenue)}</div>
            </div>
            <div className="rounded-md bg-secondary/50 p-3">
              <div className="text-xs text-muted-foreground">My Deals Won</div>
              <div className="mt-1 text-lg font-bold">{formatNumber(metrics.dealsWon)}</div>
            </div>
            <div className="rounded-md bg-secondary/50 p-3">
              <div className="text-xs text-muted-foreground">My Win Rate</div>
              <div className="mt-1 text-lg font-bold">{formatPercent(metrics.winRate, 1)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {isTeam ? "Monthly Revenue" : "My Monthly Revenue"}
          </h3>
          <div className="h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  stroke={axisColor}
                  tick={{ fill: axisColor, fontSize: 12, fontWeight: 500 }}
                  axisLine={{ stroke: axisLineColor }}
                  tickLine={false}
                />
                <YAxis
                  stroke={axisColor}
                  tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)
                  }
                  width={45}
                />
                <Tooltip
                  cursor={{ fill: isDark ? "rgba(6, 182, 212, 0.1)" : "rgba(6, 182, 212, 0.15)" }}
                  contentStyle={{
                    backgroundColor: isDark ? "#020617" : "#ffffff",
                    border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
                    borderRadius: "10px",
                    color: textColor,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                    fontSize: "13px",
                  }}
                  labelStyle={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}
                  itemStyle={{ color: textColor, fontWeight: 600 }}
                  wrapperStyle={{ zIndex: 50 }}
                  formatter={(value: unknown) => {
                    const v = typeof value === "number" ? value : 0;
                    return [formatAED(v), "Revenue"];
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="#06b6d4"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  <LabelList
                    dataKey="displayLabel"
                    position="top"
                    fill={textColor}
                    fontSize={10}
                    fontWeight={600}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Leaderboard or Personal Stats */}
        {isTeam ? (
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Team Leaderboard
            </h3>
            <div className="space-y-3">
              {repMetrics.slice(0, 5).map((rep, index) => (
                <div
                  key={rep.owner}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent/20 text-accent text-xs font-semibold">
                        {rep.owner
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {rep.owner}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rep.dealsWon} deals won
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-foreground">
                      {formatAED(rep.revenue)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatPercent(rep.winRate, 0)} win rate
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              My Top Customers
            </h3>
            <div className="space-y-3">
              {(() => {
                // Get top customers by revenue for this user
                const customerDeals = filteredDeals.reduce(
                  (acc, deal) => {
                    if (!acc[deal.company]) acc[deal.company] = 0;
                    if (deal.stage === "won") acc[deal.company] += deal.value;
                    return acc;
                  },
                  {} as Record<string, number>,
                );
                const topCustomers = Object.entries(customerDeals)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5);

                return topCustomers.map(([name, revenue]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Customer
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">
                        {formatAED(revenue)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Revenue
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Full Leaderboard Table (Team View Only) */}
      {isTeam && (
        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            All Reps Performance
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Rep</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Deals Won</TableHead>
                <TableHead>Win Rate</TableHead>
                <TableHead>Total Deals</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repMetrics.map((rep, index) => (
                <TableRow key={rep.owner}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-accent/20 text-accent text-xs">
                          {rep.owner
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {rep.owner}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatAED(rep.revenue)}
                  </TableCell>
                  <TableCell>{rep.dealsWon}</TableCell>
                  <TableCell>{formatPercent(rep.winRate, 1)}</TableCell>
                  <TableCell>{rep.deals}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

function KPICard({
  label,
  value,
  change,
  positive,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
      <div
        className={`mt-1 text-xs font-medium ${
          positive ? "text-green-500" : "text-red-500"
        }`}
      >
        {change} vs last period
      </div>
    </div>
  );
}
