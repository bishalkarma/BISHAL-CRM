/**
 * Shared demo dataset for dashboard widgets.
 *
 * Deals and pipeline stages live in `deals.ts` / `pipeline.ts` — this module
 * re-exports them so there is a single source of truth, and adds the
 * activity / analytics sample data the dashboard needs.
 */

export type { Deal, AccountType } from "./deals";
export { DEALS, DEAL_OWNERS } from "./deals";
export type { DealStage } from "./pipeline";
export { STAGE_MAP, PIPELINE_STAGES, ALL_STAGES } from "./pipeline";

export type Activity = {
  id: string;
  type: "call" | "meeting" | "email" | "sample" | "delivery" | "note";
  title: string;
  company: string;
  due: string;
  owner: string;
  done: boolean;
  priority: "high" | "medium" | "low";
};

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString();

export const ACTIVITIES: Activity[] = [
  {
    id: "A-01",
    type: "call",
    title: "Follow up on revised pricing sheet",
    company: "Atlantis The Palm",
    due: daysFromNow(0.15),
    owner: "Bishal Karma",
    done: false,
    priority: "high",
  },
  {
    id: "A-02",
    type: "meeting",
    title: "Executive chef tasting session",
    company: "Zuma Restaurant Group",
    due: daysFromNow(0.4),
    owner: "Bishal Karma",
    done: false,
    priority: "high",
  },
  {
    id: "A-03",
    type: "sample",
    title: "Dispatch 4 coffee blend samples",
    company: "Nero Coffee Group",
    due: daysFromNow(1),
    owner: "Ahmed Faris",
    done: false,
    priority: "medium",
  },
  {
    id: "A-04",
    type: "email",
    title: "Send pre-opening product catalogue",
    company: "Rixos Marina Residences",
    due: daysFromNow(1.5),
    owner: "Priya Nair",
    done: false,
    priority: "medium",
  },
  {
    id: "A-05",
    type: "delivery",
    title: "Confirm cold-chain delivery slot",
    company: "Emirates Palace Catering",
    due: daysFromNow(2),
    owner: "Ahmed Faris",
    done: false,
    priority: "low",
  },
  {
    id: "A-06",
    type: "note",
    title: "Log procurement contact change",
    company: "Jumeirah Beach Hotel",
    due: daysFromNow(-0.5),
    owner: "Priya Nair",
    done: true,
    priority: "low",
  },
];

/** Revenue trend — closed-won vs target, last 8 months (AED). */
export const REVENUE_TREND = [
  { month: "Nov", revenue: 385_000, target: 400_000 },
  { month: "Dec", revenue: 512_000, target: 420_000 },
  { month: "Jan", revenue: 448_000, target: 450_000 },
  { month: "Feb", revenue: 596_000, target: 480_000 },
  { month: "Mar", revenue: 634_000, target: 520_000 },
  { month: "Apr", revenue: 588_000, target: 550_000 },
  { month: "May", revenue: 712_000, target: 580_000 },
  { month: "Jun", revenue: 846_000, target: 620_000 },
];

export const SEGMENT_SPLIT = [
  { name: "Hotels", value: 42, amount: 1_284_000 },
  { name: "Restaurants", value: 26, amount: 795_000 },
  { name: "Hotel Projects", value: 18, amount: 550_000 },
  { name: "Cafés", value: 9, amount: 275_000 },
  { name: "Catering", value: 5, amount: 153_000 },
];

export const TEAM_LEADERBOARD = [
  { name: "Bishal Karma", deals: 14, revenue: 1_240_000, quota: 88 },
  { name: "Priya Nair", deals: 11, revenue: 962_000, quota: 74 },
  { name: "Ahmed Faris", deals: 9, revenue: 705_000, quota: 61 },
  { name: "Lina Haddad", deals: 7, revenue: 488_000, quota: 45 },
];

export const CURRENT_USER = {
  name: "Bishal Karma",
  email: "bishal@bishaltrading.com",
  role: "Sales Director",
  company: "Bishal Trading LLC",
};
