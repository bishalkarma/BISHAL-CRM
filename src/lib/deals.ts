/**
 * Deal model + demo dataset for the pipeline board.
 *
 * Shapes here are the contract the Supabase schema will implement later,
 * so the UI won't need to change when real data arrives.
 */

import type { CurrencyCode } from "./currency";
import { convert } from "./currency";
import type { DealStage } from "./pipeline";

export type AccountType =
  | "Hotel"
  | "Restaurant"
  | "Cafe"
  | "Hotel Project"
  | "Distributor"
  | "Catering";

export type DealPriority = "high" | "medium" | "low";

export type Deal = {
  id: string;
  title: string;
  company: string;
  accountType: AccountType;
  contact: string;
  /** Amount in the deal's own currency. */
  value: number;
  currency: CurrencyCode;
  stage: DealStage;
  /** Manual override; falls back to the stage default when null. */
  probability: number | null;
  owner: string;
  city: string;
  expectedCloseDate: string;
  lastActivityAt: string;
  createdAt: string;
  priority: DealPriority;
  tags: string[];
  /** Populated when stage is "lost". */
  lostReason?: string;
};

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

export const DEAL_OWNERS = [
  "Bishal Karma",
  "Priya Nair",
  "Ahmed Faris",
  "Lina Haddad",
] as const;

export const ACCOUNT_TYPES: AccountType[] = [
  "Hotel",
  "Restaurant",
  "Cafe",
  "Hotel Project",
  "Distributor",
  "Catering",
];

export const DEALS: Deal[] = [
  {
    id: "D-1041",
    title: "Annual dry goods supply contract",
    company: "Atlantis The Palm",
    accountType: "Hotel",
    contact: "Marco Rossi",
    value: 486_000,
    currency: "AED",
    stage: "negotiation",
    probability: 75,
    owner: "Bishal Karma",
    city: "Dubai",
    expectedCloseDate: days(9),
    lastActivityAt: days(-1),
    createdAt: days(-48),
    priority: "high",
    tags: ["Annual contract", "Key account"],
  },
  {
    id: "D-1038",
    title: "Pre-opening F&B tableware package",
    company: "Rixos Marina Residences",
    accountType: "Hotel Project",
    contact: "Elena Petrova",
    value: 312_500,
    currency: "AED",
    stage: "quotation",
    probability: null,
    owner: "Priya Nair",
    city: "Abu Dhabi",
    expectedCloseDate: days(21),
    lastActivityAt: days(-2),
    createdAt: days(-30),
    priority: "high",
    tags: ["Pre-opening", "Project"],
  },
  {
    id: "D-1035",
    title: "Specialty coffee beans — 12 outlets",
    company: "Nero Coffee Group",
    accountType: "Cafe",
    contact: "Sara Khalil",
    value: 148_000,
    currency: "AED",
    stage: "sampling",
    probability: null,
    owner: "Ahmed Faris",
    city: "Sharjah",
    expectedCloseDate: days(14),
    lastActivityAt: days(-3),
    createdAt: days(-40),
    priority: "medium",
    tags: ["Multi-outlet"],
  },
  {
    id: "D-1031",
    title: "Frozen seafood quarterly rate contract",
    company: "Zuma Restaurant Group",
    accountType: "Restaurant",
    contact: "Kenji Watanabe",
    value: 61_200,
    currency: "USD",
    stage: "negotiation",
    probability: 68,
    owner: "Bishal Karma",
    city: "Dubai",
    expectedCloseDate: days(5),
    lastActivityAt: days(-1),
    createdAt: days(-26),
    priority: "high",
    tags: ["Cold chain", "Rate contract"],
  },
  {
    id: "D-1029",
    title: "Housekeeping amenities restock",
    company: "Jumeirah Beach Hotel",
    accountType: "Hotel",
    contact: "Fatima Al Suwaidi",
    value: 96_400,
    currency: "AED",
    stage: "qualified",
    probability: null,
    owner: "Priya Nair",
    city: "Dubai",
    expectedCloseDate: days(28),
    lastActivityAt: days(-16),
    createdAt: days(-34),
    priority: "low",
    tags: ["Repeat order"],
  },
  {
    id: "D-1026",
    title: "Banquet catering disposables",
    company: "Emirates Palace Catering",
    accountType: "Catering",
    contact: "Omar Haddad",
    value: 178_200,
    currency: "AED",
    stage: "quotation",
    probability: null,
    owner: "Ahmed Faris",
    city: "Abu Dhabi",
    expectedCloseDate: days(17),
    lastActivityAt: days(-12),
    createdAt: days(-38),
    priority: "medium",
    tags: ["Banquet"],
  },
  {
    id: "D-1022",
    title: "Regional distribution partnership",
    company: "Gulf Horeca Distributors",
    accountType: "Distributor",
    contact: "Yusuf Al Otaibi",
    value: 640_000,
    currency: "SAR",
    stage: "lead",
    probability: null,
    owner: "Bishal Karma",
    city: "Riyadh",
    expectedCloseDate: days(45),
    lastActivityAt: days(-6),
    createdAt: days(-8),
    priority: "high",
    tags: ["Expansion", "KSA"],
  },
  {
    id: "D-1019",
    title: "Organic produce weekly supply",
    company: "The Farmhouse Bistro",
    accountType: "Restaurant",
    contact: "Claire Dubois",
    value: 72_800,
    currency: "AED",
    stage: "lead",
    probability: null,
    owner: "Lina Haddad",
    city: "Dubai",
    expectedCloseDate: days(38),
    lastActivityAt: days(-4),
    createdAt: days(-5),
    priority: "medium",
    tags: ["Organic"],
  },
  {
    id: "D-1018",
    title: "Bakery ingredients annual tender",
    company: "Marriott Cluster Kitchens",
    accountType: "Hotel",
    contact: "Hassan Iqbal",
    value: 268_000,
    currency: "AED",
    stage: "won",
    probability: 100,
    owner: "Priya Nair",
    city: "Dubai",
    expectedCloseDate: days(-3),
    lastActivityAt: days(-3),
    createdAt: days(-62),
    priority: "high",
    tags: ["Tender", "Annual contract"],
  },
  {
    id: "D-1015",
    title: "Cold-pressed juice supply",
    company: "Bloom Café Chain",
    accountType: "Cafe",
    contact: "Nadia Rahman",
    value: 54_600,
    currency: "AED",
    stage: "won",
    probability: 100,
    owner: "Ahmed Faris",
    city: "Dubai",
    expectedCloseDate: days(-8),
    lastActivityAt: days(-8),
    createdAt: days(-44),
    priority: "medium",
    tags: ["Beverage"],
  },
  {
    id: "D-1012",
    title: "Kitchen equipment refresh",
    company: "Radisson Blu Deira",
    accountType: "Hotel",
    contact: "Peter Novak",
    value: 132_000,
    currency: "AED",
    stage: "lost",
    probability: 0,
    owner: "Bishal Karma",
    city: "Dubai",
    expectedCloseDate: days(-12),
    lastActivityAt: days(-12),
    createdAt: days(-70),
    priority: "low",
    tags: ["Equipment"],
    lostReason: "Price — competitor undercut by 12%",
  },
  {
    id: "D-1009",
    title: "Premium olive oil range listing",
    company: "Zuma Restaurant Group",
    accountType: "Restaurant",
    contact: "Kenji Watanabe",
    value: 44_500,
    currency: "AED",
    stage: "sampling",
    probability: null,
    owner: "Lina Haddad",
    city: "Dubai",
    expectedCloseDate: days(11),
    lastActivityAt: days(-9),
    createdAt: days(-33),
    priority: "medium",
    tags: ["Premium range"],
  },
  {
    id: "D-1007",
    title: "Staff canteen bulk grocery",
    company: "Gulf Horeca Distributors",
    accountType: "Distributor",
    contact: "Yusuf Al Otaibi",
    value: 89_000,
    currency: "AED",
    stage: "qualified",
    probability: null,
    owner: "Ahmed Faris",
    city: "Dubai",
    expectedCloseDate: days(33),
    lastActivityAt: days(-2),
    createdAt: days(-14),
    priority: "low",
    tags: ["Bulk"],
  },
];

/** Deal value converted to the display currency. */
export function dealValueIn(deal: Deal, target: CurrencyCode) {
  return convert(deal.value, deal.currency, target);
}
