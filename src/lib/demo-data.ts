/**
 * Demo dataset for Part 1 (UI shell + dashboard).
 *
 * Modelled on a real B2B hospitality-supply business: the CRM sells to
 * hotels, restaurants, cafés and hotel pre-opening projects (HORECA).
 * In a later part this is replaced by Supabase queries with the same shapes.
 */

export type DealStage =
  | "lead"
  | "qualified"
  | "samples"
  | "quotation"
  | "negotiation"
  | "won"
  | "lost";

export type AccountType =
  | "Hotel"
  | "Restaurant"
  | "Cafe"
  | "Hotel Project"
  | "Distributor"
  | "Catering";

export type Deal = {
  id: string;
  title: string;
  company: string;
  accountType: AccountType;
  value: number;
  stage: DealStage;
  probability: number;
  owner: string;
  closeDate: string;
  updatedAt: string;
  city: string;
};

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

export const STAGE_META: Record<
  DealStage,
  { label: string; color: string; chart: string }
> = {
  lead: { label: "New Lead", color: "bg-chart-4", chart: "var(--color-chart-4)" },
  qualified: {
    label: "Qualified",
    color: "bg-chart-3",
    chart: "var(--color-chart-3)",
  },
  samples: {
    label: "Sampling",
    color: "bg-chart-5",
    chart: "var(--color-chart-5)",
  },
  quotation: {
    label: "Quotation",
    color: "bg-chart-2",
    chart: "var(--color-chart-2)",
  },
  negotiation: {
    label: "Negotiation",
    color: "bg-chart-1",
    chart: "var(--color-chart-1)",
  },
  won: { label: "Won", color: "bg-success", chart: "var(--color-success)" },
  lost: {
    label: "Lost",
    color: "bg-destructive",
    chart: "var(--color-destructive)",
  },
};

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString();

export const DEALS: Deal[] = [
  {
    id: "D-1041",
    title: "Annual dry goods supply contract",
    company: "Atlantis The Palm",
    accountType: "Hotel",
    value: 486_000,
    stage: "negotiation",
    probability: 75,
    owner: "Bishal Karma",
    closeDate: daysFromNow(9),
    updatedAt: daysFromNow(-1),
    city: "Dubai",
  },
  {
    id: "D-1038",
    title: "Pre-opening F&B tableware package",
    company: "Rixos Marina Residences",
    accountType: "Hotel Project",
    value: 312_500,
    stage: "quotation",
    probability: 55,
    owner: "Priya Nair",
    closeDate: daysFromNow(21),
    updatedAt: daysFromNow(-2),
    city: "Abu Dhabi",
  },
  {
    id: "D-1035",
    title: "Specialty coffee beans — 12 outlets",
    company: "Nero Coffee Group",
    accountType: "Cafe",
    value: 148_000,
    stage: "samples",
    probability: 40,
    owner: "Ahmed Faris",
    closeDate: daysFromNow(14),
    updatedAt: daysFromNow(-3),
    city: "Sharjah",
  },
  {
    id: "D-1031",
    title: "Frozen seafood quarterly rate contract",
    company: "Zuma Restaurant Group",
    accountType: "Restaurant",
    value: 224_800,
    stage: "negotiation",
    probability: 68,
    owner: "Bishal Karma",
    closeDate: daysFromNow(5),
    updatedAt: daysFromNow(-1),
    city: "Dubai",
  },
  {
    id: "D-1029",
    title: "Housekeeping amenities restock",
    company: "Jumeirah Beach Hotel",
    accountType: "Hotel",
    value: 96_400,
    stage: "qualified",
    probability: 30,
    owner: "Priya Nair",
    closeDate: daysFromNow(28),
    updatedAt: daysFromNow(-4),
    city: "Dubai",
  },
  {
    id: "D-1026",
    title: "Banquet catering disposables",
    company: "Emirates Palace Catering",
    accountType: "Catering",
    value: 178_200,
    stage: "quotation",
    probability: 50,
    owner: "Ahmed Faris",
    closeDate: daysFromNow(17),
    updatedAt: daysFromNow(-2),
    city: "Abu Dhabi",
  },
  {
    id: "D-1022",
    title: "Regional distribution partnership",
    company: "Gulf Horeca Distributors",
    accountType: "Distributor",
    value: 640_000,
    stage: "lead",
    probability: 15,
    owner: "Bishal Karma",
    closeDate: daysFromNow(45),
    updatedAt: daysFromNow(-6),
    city: "Riyadh",
  },
  {
    id: "D-1018",
    title: "Bakery ingredients annual tender",
    company: "Marriott Cluster Kitchens",
    accountType: "Hotel",
    value: 268_000,
    stage: "won",
    probability: 100,
    owner: "Priya Nair",
    closeDate: daysFromNow(-3),
    updatedAt: daysFromNow(-3),
    city: "Dubai",
  },
  {
    id: "D-1015",
    title: "Cold-pressed juice supply",
    company: "Bloom Café Chain",
    accountType: "Cafe",
    value: 54_600,
    stage: "won",
    probability: 100,
    owner: "Ahmed Faris",
    closeDate: daysFromNow(-8),
    updatedAt: daysFromNow(-8),
    city: "Dubai",
  },
  {
    id: "D-1012",
    title: "Kitchen equipment refresh",
    company: "Radisson Blu Deira",
    accountType: "Hotel",
    value: 132_000,
    stage: "lost",
    probability: 0,
    owner: "Bishal Karma",
    closeDate: daysFromNow(-12),
    updatedAt: daysFromNow(-12),
    city: "Dubai",
  },
];

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

/** Revenue trend — closed-won vs target, last 8 months. */
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

/** Revenue split by customer segment. */
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
