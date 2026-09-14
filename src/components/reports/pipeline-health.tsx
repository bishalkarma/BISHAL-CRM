"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Download, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  filterByRole,
  dealsByStage,
  downloadCSV,
  formatAED,
  formatNumber,
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

// Deal pipeline stage colors (matching the pipeline board)
const STAGE_COLORS: Record<string, string> = {
  Lead: "#60a5fa", // blue
  Qualified: "#a78bfa", // purple
  Quotation: "#fbbf24", // amber
  Negotiation: "#34d399", // emerald
  Sampling: "#2dd4bf", // teal
  Won: "#22c55e", // green
  Lost: "#ef4444", // red
};

export function PipelineHealthReport({
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
  React.useEffect(() => {
    if (role !== "Manager" || !userId) return;
    
    const fetchTeam = async () => {
      try {
        const res = await fetch("/api/team/users");
        if (!res.ok) return;
        const data = await res.json();
        const teamMembers = (data.users || [])
          .filter((u: { managerId?: string }) => u.managerId === userId)
          .map((u: { id: string }) => u.id);
        setTeamMemberIds(teamMembers);
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

  // Only include active deals (not won/lost) for the funnel and pipeline value
  const activeDeals = filteredDeals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const stageData = React.useMemo(() => {
    const raw = dealsByStage(filteredDeals);
    return raw.map((s) => ({
      ...s,
      displayLabel: `${s.count} · ${formatAED(s.value)}`,
      // Fixed position: 120px from left (after Y-axis labels)
      labelX: 120,
    }));
  }, [filteredDeals]);

  // Compute KPIs — pipeline value = sum of ALL line values from open deals
  const totalPipeline = activeDeals.reduce((sum, deal) => {
    const lineTotal = (deal.lines || []).reduce((lineSum, line) => lineSum + line.unitPrice * line.quantity, 0);
    return sum + (lineTotal > 0 ? lineTotal : deal.value);
  }, 0);
  const openDeals = activeDeals.length;

  // Avg days in stage (simplified)
  const avgDaysInStage = React.useMemo(() => {
    const now = new Date();
    const daysPerDeal = activeDeals.map((d) => {
      const created = new Date(d.createdAt);
      const diff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    });
    return daysPerDeal.length > 0
      ? Math.round(daysPerDeal.reduce((a, b) => a + b, 0) / daysPerDeal.length)
      : 0;
  }, [activeDeals]);

  // Stage velocity (avg days per stage) — only for pipeline stages (not won/lost)
  const stageVelocity = React.useMemo(() => {
    const now = new Date();
    const pipelineStages = ["Lead", "Qualified", "Quotation", "Negotiation", "Sampling"];
    return stageData
      .filter((s) => pipelineStages.includes(s.stage))
      .map((stage) => {
        const stageKey = stage.stage.toLowerCase();
        const stageDeals = filteredDeals.filter((d) => d.stage === stageKey);
        const avgDays =
          stageDeals.length > 0
            ? Math.round(
                stageDeals.reduce((sum, d) => {
                  const created = new Date(d.createdAt);
                  return sum + (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                }, 0) / stageDeals.length,
              )
            : 0;
        return {
          stage: stage.stage,
          avgDays,
          count: stageDeals.length,
          value: stage.value,
          label: `${stageDeals.length} · ${formatAED(stage.value)}`,
        };
      });
  }, [filteredDeals, stageData]);

  // Bottleneck detection (stages with deals stuck > 14 days)
  const bottlenecks = React.useMemo(() => {
    const now = new Date();
    const stuck = stageVelocity.filter((s) => s.avgDays > 14 && s.count > 0);
    return stuck;
  }, [stageVelocity]);

  // Export
  const exportData = () => {
    const rows = stageData.map((s) => ({
      Stage: s.stage,
      Deals: s.count,
      Value: s.value,
    }));
    downloadCSV(`pipeline-health-${period}.csv`, rows);
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {isTeam ? "Pipeline Health" : "My Pipeline"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isTeam
              ? "Deal pipeline stages: Lead → Qualified → Quotation → Negotiation → Sampling → Won/Lost"
              : "Your deals across all stages"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportData}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {isTeam ? "Total Pipeline" : "My Pipeline"}
            </span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {formatAED(totalPipeline)}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {isTeam ? "Open Deals" : "My Open Deals"}
            </span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {formatNumber(openDeals)}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Avg Days in Stage
            </span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {avgDaysInStage}
          </div>
        </div>
      </div>

      {/* Funnel Chart + Stage Velocity */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-foreground">Deal Stages</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stageData}
                layout="vertical"
                margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
              >
                <XAxis
                  type="number"
                  stroke={axisColor}
                  tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: axisLineColor }}
                  tickLine={false}
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  stroke={axisColor}
                  tick={{ fill: textColor, fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  cursor={false}
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
                  formatter={(value: unknown, name: unknown) => {
                    const v = typeof value === "number" ? value : 0;
                    const n = typeof name === "string" ? name : "";
                    if (n === "count") return [`${v} deals`, "Count"];
                    return [formatAED(v), "Value"];
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={36}
                >
                  {stageData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STAGE_COLORS[entry.stage] || "#64748b"}
                    />
                  ))}
                  <LabelList
                    dataKey="displayLabel"
                    position="right"
                    fill={textColor}
                    fontSize={11}
                    fontWeight={600}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Velocity Table */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-foreground">Stage Velocity</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Avg Days</TableHead>
                <TableHead className="text-right">Deals</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stageVelocity.map((s) => (
                <TableRow key={s.stage}>
                  <TableCell className="font-medium">{s.stage}</TableCell>
                  <TableCell className="text-right">{s.avgDays}</TableCell>
                  <TableCell className="text-right">{s.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Bottleneck Alerts */}
          {bottlenecks.length > 0 && (
            <div className="mt-4 space-y-2">
              {bottlenecks.map((b) => (
                <div
                  key={b.stage}
                  className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div>
                    <div className="text-sm font-medium text-amber-500">
                      Bottleneck Alert
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {b.stage} stage: {b.count} deals stuck over 14 days (avg {b.avgDays} days)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Deals by Stage (Personal View) */}
      {!isTeam && (
        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold text-foreground">My Deals by Stage</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stageData
              .filter((s) => s.count > 0)
              .map((stage) => (
                <div
                  key={stage.stage}
                  className="rounded-lg border border-border bg-secondary/30 p-4"
                  style={{ borderLeftColor: STAGE_COLORS[stage.stage] || "#64748b", borderLeftWidth: "3px" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {stage.stage}
                    </span>
                    <Badge variant="default" className="text-xs">
                      {stage.count}
                    </Badge>
                  </div>
                  <div className="mt-2 text-lg font-bold text-foreground">
                    {formatAED(stage.value)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
}
