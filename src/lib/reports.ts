/**
 * Role-based report helpers.
 *
 * All reports use these so the same data pipeline can serve both the
 * Team view (Admin/Manager) and Personal view (Sales Rep/Viewer).
 */

import type { Company } from "@/lib/companies";
import type { Deal } from "@/lib/deals";
import type { Activity } from "@/lib/activities";
import type { Contact } from "@/lib/contacts";

export type PeriodKey = "week" | "month" | "quarter" | "year" | "all";

/** CRM's SPANCOP stages — the canonical list. */
export const SPANCOP_STAGES = [
  "Suspect",
  "Prospect",
  "Approach",
  "Negotiate",
  "Close",
  "Order",
  "Payment",
];

/** Resolve a UUID to a display name using sessionStorage + cached users. */
let _userCache: { id: string; displayName: string }[] | null = null;

export async function resolveUserName(uuid: string | null | undefined): Promise<string> {
  if (!uuid) return "Unassigned";
  // Check if it's already a name (not a UUID format)
  if (!/^[0-9a-f]{8}-/i.test(uuid)) return uuid;
  // Load cache
  if (!_userCache) {
    try {
      const userId = sessionStorage.getItem("demo_user_id");
      const userName = sessionStorage.getItem("demo_user");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (userId) headers["x-demo-user-id"] = userId;
      if (userName) headers["x-demo-user"] = userName;
      const res = await fetch("/api/team/users", { headers });
      if (res.ok) {
        const data = await res.json();
        _userCache = (data.users ?? []).map((u: { id: string; display_name?: string; displayName?: string; username?: string }) => ({
          id: u.id,
          displayName: u.display_name || u.displayName || u.username || u.id,
        }));
      }
    } catch {
      _userCache = [];
    }
  }
  const user = _userCache?.find((u) => u.id === uuid);
  return user?.displayName ?? uuid;
}

/** Preload the user cache (call once on page mount). */
export async function preloadUserCache(): Promise<void> {
  await resolveUserName("preload");
}

/** Date range for a given period key, relative to today. */
export function periodRange(period: PeriodKey): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case "week":
      start.setDate(end.getDate() - 7);
      break;
    case "month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(end.getMonth() - 3);
      break;
    case "year":
      start.setFullYear(end.getFullYear() - 1);
      break;
    case "all":
      start.setFullYear(2000);
      break;
  }
  return { start, end };
}

/** Returns true if a date string is within the given period range. */
export function inPeriod(dateStr: string | null | undefined, period: PeriodKey): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const { start, end } = periodRange(period);
  return d >= start && d <= end;
}

/** Returns true if the current user should see the team (unfiltered) view. */
export function isTeamView(role: string): boolean {
  const r = (role || "").toLowerCase();
  return r === "admin" || r === "manager";
}

/**
 * Filter data based on role.
 * - Admin/Manager: sees everything
 * - Sales Rep/Viewer: sees only their own records (by UUID only)
 */
export function filterByRole<T extends { owner_id?: string | null }>(
  items: T[],
  role: string,
  userId: string | null,
  teamMemberIds: string[] = [],
): T[] {
  // Admin: See ALL data
  const r = (role || "").toLowerCase();
  if (r === "admin") return items;

  // Manager: See own data + team's data
  if (r === "manager" && userId) {
    return items.filter((item) => 
      item.owner_id === userId || teamMemberIds.includes(item.owner_id || "")
    );
  }

  // Sales Rep / Viewer: UUID-only filter — no name-based fallback
  if (!userId) return [];
  return items.filter((item) => item.owner_id === userId);
}

/** CSV export helper — takes an array of objects and downloads as CSV. */
export function downloadCSV(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    // Wrap in quotes if it contains comma, quote, or newline
    if (/[,"\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Format a number as AED currency. */
export function formatAED(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  return `AED ${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Format a number with commas. */
export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

/** Format a percentage. */
export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/** Relative time label (e.g., "2 weeks ago"). */
export function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "in the future";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/** Days between two date strings. */
export function daysBetween(a: string | null | undefined, b: string | null | undefined): number {
  if (!a || !b) return 0;
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.floor(Math.abs(da - db) / (1000 * 60 * 60 * 24));
}

/** Group deals by month for chart data. */
export function dealsByMonth(
  deals: Deal[],
  period: PeriodKey,
): { month: string; revenue: number; deals: number }[] {
  const { start } = periodRange(period);
  const map = new Map<string, { revenue: number; deals: number; month: string }>();

  // Initialize all months in the period
  const months: string[] = [];
  const current = new Date(start);
  const end = new Date();
  while (current <= end) {
    const key = current.toISOString().slice(0, 7); // YYYY-MM
    const label = current.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    months.push(key);
    map.set(key, { revenue: 0, deals: 0, month: label });
    current.setMonth(current.getMonth() + 1);
  }

  // Sum won deals by month — uses approved line values
  deals
    .filter((d) => d.stage === "won" && inPeriod(d.createdAt, period))
    .forEach((d) => {
      const key = d.createdAt.slice(0, 7);
      const entry = map.get(key);
      if (entry) {
        const approvedLines = (d.lines || []).filter((line) => line.status === "approved");
        const lineTotal = approvedLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
        entry.revenue += approvedLines.length > 0 ? lineTotal : d.value;
        entry.deals += 1;
      }
    });

  return months.map((key) => ({ month: map.get(key)!.month, revenue: map.get(key)!.revenue, deals: map.get(key)!.deals }));
}

/** Compute KPI metrics for a set of deals — uses line items for accuracy */
export function computeDealMetrics(deals: Deal[]) {
  const won = deals.filter((d) => d.stage === "won");
  const lost = deals.filter((d) => d.stage === "lost");
  const total = deals.filter((d) => d.stage !== "lost");

  // Revenue = sum of APPROVED line values from won deals only
  const revenue = won.reduce((sum, deal) => {
    const approvedLines = (deal.lines || []).filter((line) => line.status === "approved");
    const lineTotal = approvedLines.reduce((lineSum, line) => lineSum + line.unitPrice * line.quantity, 0);
    // If no lines marked, use full deal value (backward compatibility)
    return sum + (approvedLines.length > 0 ? lineTotal : deal.value);
  }, 0);

  // Lost value = rejected lines from won deals + full value of lost deals
  const lostValue = won.reduce((sum, deal) => {
    const rejectedLines = (deal.lines || []).filter((line) => line.status === "rejected");
    const rejectedTotal = rejectedLines.reduce((lineSum, line) => lineSum + line.unitPrice * line.quantity, 0);
    return sum + rejectedTotal;
  }, 0) + lost.reduce((sum, deal) => sum + deal.value, 0);

  const winRate = total.length > 0 ? (won.length / total.length) * 100 : 0;
  const avgDealSize = won.length > 0 ? revenue / won.length : 0;

  return {
    revenue,
    lostValue,
    dealsWon: won.length,
    dealsLost: lost.length,
    winRate,
    avgDealSize,
    totalDeals: total.length,
  };
}

/** Group deals by pipeline stage for funnel data. */
export function dealsByStage(deals: Deal[]): { stage: string; count: number; value: number }[] {
  const stages = ["lead", "qualified", "quotation", "negotiation", "sampling", "won", "lost"];
  const labels: Record<string, string> = {
    lead: "Lead",
    qualified: "Qualified",
    quotation: "Quotation",
    negotiation: "Negotiation",
    sampling: "Sampling",
    won: "Won",
    lost: "Lost",
  };
  return stages.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage: labels[stage],
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + d.value, 0),
    };
  });
}

/** Compute per-rep metrics for leaderboard. */
export function metricsByOwner(
  deals: Deal[],
  role: string,
): { owner: string; ownerId: string; revenue: number; dealsWon: number; winRate: number; deals: number }[] {
  // Group by owner_id (which is updated when a user is deleted), falling back to owner name
  const ownerMap = new Map<string, { ownerId: string; displayName: string; deals: Deal[] }>();

  deals.forEach((d) => {
    // Use owner_id as primary key when available (Supabase data),
    // fall back to owner name string for demo data
    const key = d.owner_id || d.owner || "Unassigned";
    if (!ownerMap.has(key)) {
      ownerMap.set(key, { ownerId: d.owner_id || "", displayName: d.owner || "Unassigned", deals: [] });
    }
    ownerMap.get(key)!.deals.push(d);
  });

  return Array.from(ownerMap.entries())
    .map(([, { ownerId, displayName, deals }]) => {
      const won = deals.filter((d) => d.stage === "won");
      const total = deals.filter((d) => d.stage !== "lost");
      const revenue = won.reduce((sum, d) => sum + d.value, 0);
      return {
        owner: displayName,
        ownerId,
        revenue,
        dealsWon: won.length,
        winRate: total.length > 0 ? (won.length / total.length) * 100 : 0,
        deals: total.length,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

/** Group activities by type. */
export function activitiesByType(activities: Activity[]): { type: string; count: number }[] {
  const typeMap = new Map<string, number>();
  activities.forEach((a) => {
    typeMap.set(a.type, (typeMap.get(a.type) ?? 0) + 1);
  });
  return Array.from(typeMap.entries())
    .map(([type, count]) => ({ type: type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), count }))
    .sort((a, b) => b.count - a.count);
}

/** Compute customer lifetime metrics. */
export function customerMetrics(
  companies: Company[],
  deals: Deal[],
): {
  companyId: string;
  name: string;
  owner: string;
  ownerId: string | null;
  revenue: number;
  orderCount: number;
  lastOrderAt: string | null;
  createdAt: string;
}[] {
  const companyDeals = new Map<string, Deal[]>();
  deals.forEach((d) => {
    const list = companyDeals.get(d.companyId) ?? [];
    list.push(d);
    companyDeals.set(d.companyId, list);
  });

  return companies.map((c) => {
    const cDeals = companyDeals.get(c.id) ?? [];
    const wonDeals = cDeals.filter((d) => d.stage === "won");
    const revenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const lastOrderAt = wonDeals.length > 0
      ? wonDeals.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))[0].createdAt
      : null;
    return {
      companyId: c.id,
      name: c.name,
      owner: c.owner,
      ownerId: c.owner_id,
      revenue,
      orderCount: wonDeals.length,
      lastOrderAt,
      createdAt: c.createdAt,
    };
  });
}
