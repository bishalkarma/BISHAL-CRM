"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Search, ShoppingBag, Users, TrendingUp, AlertTriangle, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  customerMetrics,
  downloadCSV,
  formatAED,
  formatNumber,
  formatPercent,
  relativeTime,
  resolveUserName,
  type PeriodKey,
} from "@/lib/reports";
import type { Company } from "@/lib/companies";
import type { Deal } from "@/lib/deals";
import type { Contact } from "@/lib/contacts";

type Props = {
  companies: Company[];
  deals: Deal[];
  contacts: Contact[];
  period: PeriodKey;
  role: string;
  userId: string | null;
  userName: string | null;
};

const COLORS = ["#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#3b82f6", "#84cc16"];

export function CustomerRevenueReport({
  companies,
  deals,
  contacts: _contacts,
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

  // Resolve owner UUIDs → display names
  const [ownerNames, setOwnerNames] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    const allUuids = new Set<string>();
    companies.forEach((c) => {
      if (c.owner_id) allUuids.add(c.owner_id);
      if (c.created_by) allUuids.add(c.created_by);
    });
    Promise.all(
      Array.from(allUuids).map(async (uuid) => {
        const name = await resolveUserName(uuid);
        return [uuid, name] as const;
      }),
    ).then((entries) => {
      setOwnerNames(Object.fromEntries(entries));
    });
  }, [companies]);

  const ownerName = (uuid: string | null | undefined) => {
    if (!uuid) return "Unassigned";
    if (ownerNames[uuid]) return ownerNames[uuid];
    // If not a UUID format, return as-is
    if (!/^[0-9a-f]{8}-/i.test(uuid)) return uuid;
    return uuid; // Fallback: show UUID until resolved
  };

  // Filter data by role (UUID-only)
  const filteredCompanies = React.useMemo(
    () => filterByRole(companies, role, userId, teamMemberIds),
    [companies, role, userId, teamMemberIds],
  );

  const filteredDeals = React.useMemo(
    () => filterByRole(deals, role, userId, teamMemberIds),
    [deals, role, userId, teamMemberIds],
  );

  // Customer metrics — KPI tiles show TOTALS (not filtered by search)
  const customerData = React.useMemo(
    () => customerMetrics(filteredCompanies, filteredDeals),
    [filteredCompanies, filteredDeals],
  );

  // Search state — only filters the table, not KPI tiles
  const [search, setSearch] = React.useState("");
  const filteredCustomerData = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customerData;
    return customerData.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.owner || "").toLowerCase().includes(q) ||
        (c.ownerId || "").toLowerCase().includes(q),
    );
  }, [customerData, search]);
  const topCustomers = [...filteredCustomerData].sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // KPIs — show TOTALS from all customers (not filtered by search)
  const totalCustomers = customerData.length;
  const activeCustomers = customerData.filter(
    (c) => c.lastOrderAt && new Date(c.lastOrderAt).getFullYear() === new Date().getFullYear(),
  ).length;
  const repeatRate =
    totalCustomers > 0
      ? (customerData.filter((c) => c.orderCount > 1).length / totalCustomers) * 100
      : 0;

  // Going cold (no order in 90+ days) — filtered by search too
  const goingCold = React.useMemo(() => {
    const now = new Date();
    return filteredCustomerData.filter((c) => {
      if (!c.lastOrderAt) return false;
      const lastOrder = new Date(c.lastOrderAt);
      const diff = Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 90;
    });
  }, [filteredCustomerData]);

  // Revenue by rep (team view) — uses resolved names, reflects search filter
  const revenueByRep = React.useMemo(() => {
    const repMap = new Map<string, number>();
    filteredCustomerData.forEach((c) => {
      const owner = ownerName(c.ownerId) || c.owner || "Unassigned";
      repMap.set(owner, (repMap.get(owner) ?? 0) + c.revenue);
    });
    return Array.from(repMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredCustomerData, ownerNames]);

  // Export
  const exportData = () => {
    const rows = customerData.map((c) => ({
      Customer: c.name,
      Owner: c.owner,
      Revenue: c.revenue,
      "Last Order": c.lastOrderAt || "Never",
      Orders: c.orderCount,
    }));
    downloadCSV(`customer-revenue-${period}.csv`, rows);
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {isTeam ? "Customer Revenue" : "My Customers"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isTeam ? "Customer revenue and ownership" : "Your customer portfolio"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="h-9 w-56 pl-9 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {isTeam ? "Total Customers" : "My Customers"}
            </span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {formatNumber(totalCustomers)}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Active (ordered this year)
            </span>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {formatNumber(activeCustomers)}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-secondary/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Repeat Rate
            </span>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {formatPercent(repeatRate, 0)}
          </div>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {isTeam ? "Top Customers by Revenue" : "My Top Customers"}
          </h3>
          {search && (
            <span className="text-xs text-muted-foreground">
              {filteredCustomerData.length} of {customerData.length} customers
            </span>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Customer Name</TableHead>
              {isTeam && <TableHead>Owner</TableHead>}
              <TableHead className="text-right">Total Revenue</TableHead>
              <TableHead>Last Order</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead>Lifetime Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topCustomers.map((c, index) => (
              <TableRow key={c.companyId}>
                <TableCell className="font-medium">#{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {c.name}
                    {c.orderCount >= 5 && (
                      <Badge variant="default" className="bg-amber-500 text-xs">
                        VIP
                      </Badge>
                    )}
                  </div>
                </TableCell>
                {isTeam && (
                  <TableCell>{ownerName(c.ownerId) || c.owner || "Unassigned"}</TableCell>
                )}
                <TableCell className="text-right font-semibold">
                  {formatAED(c.revenue)}
                </TableCell>
                <TableCell>{relativeTime(c.lastOrderAt)}</TableCell>
                <TableCell className="text-right">{c.orderCount}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {c.orderCount >= 3 ? "High" : c.orderCount >= 1 ? "Medium" : "Low"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Bottom Section: Pie Chart + Going Cold */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Revenue by Rep (Team View) or Revenue Trend (Personal View) */}
        {isTeam ? (
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Revenue by Rep
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByRep}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    dataKey="value"
                    stroke={isDark ? "#0f172a" : "#ffffff"}
                    strokeWidth={2}
                  >
                    {revenueByRep.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
                      />
                    ))}
                  </Pie>
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
                    formatter={(value: unknown) => {
                      const v = typeof value === "number" ? value : 0;
                      return formatAED(v);
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              My Customer Revenue Trend
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={(() => {
                    // Group revenue by month for last 6 months
                    const months: { month: string; revenue: number }[] = [];
                    const now = new Date();
                    for (let i = 5; i >= 0; i--) {
                      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                      const key = d.toISOString().slice(0, 7);
                      const label = d.toLocaleDateString("en-US", { month: "short" });
                      const revenue = filteredCustomerData
                        .filter((c) => c.lastOrderAt && c.lastOrderAt.startsWith(key))
                        .reduce((sum, c) => sum + c.revenue, 0);
                      months.push({ month: label, revenue });
                    }
                    return months;
                  })()}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke={axisColor}
                    tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
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
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ fill: "#06b6d4", strokeWidth: 0, r: 4 }}
                    activeDot={{ fill: "#06b6d4", strokeWidth: 2, stroke: isDark ? "#0f172a" : "#ffffff", r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Going Cold Alerts */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {isTeam ? "Going Cold" : "My Going Cold"}
          </h3>
          {goingCold.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-border bg-secondary/30">
              <p className="text-sm text-muted-foreground">
                {isTeam ? "No customers at risk" : "All your customers are active"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {goingCold.slice(0, 5).map((c) => (
                <div
                  key={c.companyId}
                  className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">
                      {c.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last order: {relativeTime(c.lastOrderAt)}
                      {isTeam && ` · Owner: ${ownerName(c.ownerId) || c.owner || "Unassigned"}`}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 border-amber-500 text-amber-500">
                    {Math.floor((new Date().getTime() - new Date(c.lastOrderAt!).getTime()) / (1000 * 60 * 60 * 24))} days
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
