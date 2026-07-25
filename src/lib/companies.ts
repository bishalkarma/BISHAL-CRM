/**
 * Company model — the agreed 13-field spec.
 *
 * Business drives which "Type" options are valid:
 *   Hotel          → 4★ / 5★ / 6★ / 7★
 *   everything else → New / Old / Renovation
 */

import type { SpancopStage, StageTransition } from "./spancop";

export type BusinessType =
  | "Hotel"
  | "Project"
  | "Restaurant"
  | "Cafe"
  | "Catering"
  | "Banquet";

export type HotelType = "4★" | "5★" | "6★" | "7★";
export type VenueType = "New" | "Old" | "Renovation";
export type CompanyType = HotelType | VenueType;

export type Emirate =
  | "Dubai"
  | "Abu Dhabi"
  | "Sharjah"
  | "Ajman"
  | "Ras Al Khaimah"
  | "Fujairah"
  | "Umm Al Quwain";

export type ContactRole =
  | "Owner"
  | "General Manager"
  | "F&B Manager"
  | "Executive Chef"
  | "Head Chef"
  | "Purchasing Manager"
  | "Storekeeper"
  | "Finance"
  | "Other";

export type LeadStatus = "hot" | "warm" | "cold" | "dormant";

export type LeadSource =
  | "Referral"
  | "Walk-in"
  | "Exhibition"
  | "Instagram"
  | "Cold call"
  | "Website"
  | "Existing customer";

export const BUSINESS_TYPES: BusinessType[] = [
  "Hotel",
  "Project",
  "Restaurant",
  "Cafe",
  "Catering",
  "Banquet",
];

export const HOTEL_TYPES: HotelType[] = ["4★", "5★", "6★", "7★"];
export const VENUE_TYPES: VenueType[] = ["New", "Old", "Renovation"];

export const EMIRATES: Emirate[] = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
];

export const CONTACT_ROLES: ContactRole[] = [
  "Owner",
  "General Manager",
  "F&B Manager",
  "Executive Chef",
  "Head Chef",
  "Purchasing Manager",
  "Storekeeper",
  "Finance",
  "Other",
];

export const LEAD_SOURCES: LeadSource[] = [
  "Referral",
  "Walk-in",
  "Exhibition",
  "Instagram",
  "Cold call",
  "Website",
  "Existing customer",
];

export const LEAD_STATUS_META: Record<
  LeadStatus,
  { label: string; tint: string; dot: string }
> = {
  hot: { label: "Hot", tint: "bg-destructive/12 text-destructive", dot: "bg-destructive" },
  warm: { label: "Warm", tint: "bg-warning/15 text-warning", dot: "bg-warning" },
  cold: { label: "Cold", tint: "bg-info/12 text-info", dot: "bg-info" },
  dormant: {
    label: "Dormant",
    tint: "bg-secondary text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
};

/** Valid Type options for a given Business. */
export function typeOptionsFor(business: BusinessType | null): CompanyType[] {
  if (!business) return [];
  return business === "Hotel" ? [...HOTEL_TYPES] : [...VENUE_TYPES];
}

export function typeLabelFor(business: BusinessType | null) {
  return business === "Hotel" ? "Star rating" : "Property condition";
}

export type Company = {
  id: string;
  name: string;
  cluster: string | null;
  emirate: Emirate;
  area: string;
  /** Optional manual map pin — never captured automatically. */
  coordinates?: { lat: number; lng: number };
  business: BusinessType;
  type: CompanyType;

  contactName: string;
  contactRole: ContactRole;
  /** Optional by design — validated only when present. */
  email: string | null;
  phone: string;
  whatsappSameAsPhone: boolean;

  owner: string;
  leadSource: LeadSource;
  remarks: string;

  // --- Relationship state -------------------------------------------
  spancop: SpancopStage;
  spancopSince: string;
  /** Both signals are kept so the two models can be compared side by side. */
  leadStatus: LeadStatus;
  nextFollowUp: string | null;

  // --- Derived signals (from deals / activities / orders) ------------
  activityCount: number;
  lastActivityAt: string | null;
  openDealIds: string[];
  lastClosedDealOutcome?: "won" | "lost";
  hasPurchaseOrder: boolean;
  awaitingPayment: boolean;
  hasEverOrdered: boolean;
  lastOrderAt: string | null;
  lifetimeValue: number;

  createdAt: string;
};

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

export const CLUSTERS = [
  "Kerzner Group",
  "Jumeirah Group",
  "Marriott Cluster",
  "Rixos Hotels",
  "Independent",
];

export const COMPANIES: Company[] = [
  {
    id: "C-001",
    name: "Atlantis The Palm",
    cluster: "Kerzner Group",
    emirate: "Dubai",
    area: "Palm Jumeirah",
    business: "Hotel",
    type: "5★",
    contactName: "Marco Rossi",
    contactRole: "Executive Chef",
    email: "marco.rossi@atlantis.ae",
    phone: "+971 50 123 4567",
    whatsappSameAsPhone: true,
    owner: "Bishal Karma",
    leadSource: "Referral",
    remarks: "Annual contract renewal due in Q3. Prefers morning deliveries.",
    spancop: "negotiate",
    spancopSince: days(-12),
    leadStatus: "hot",
    nextFollowUp: days(2),
    activityCount: 14,
    lastActivityAt: days(-1),
    openDealIds: ["D-1041"],
    lastClosedDealOutcome: "won",
    hasPurchaseOrder: false,
    awaitingPayment: false,
    hasEverOrdered: true,
    lastOrderAt: days(-38),
    lifetimeValue: 1_284_000,
    createdAt: days(-420),
  },
  {
    id: "C-002",
    name: "Rixos Marina Residences",
    cluster: "Rixos Hotels",
    emirate: "Abu Dhabi",
    area: "Al Maryah Island",
    business: "Project",
    type: "New",
    contactName: "Elena Petrova",
    contactRole: "Purchasing Manager",
    email: "e.petrova@rixosmarina.ae",
    phone: "+971 55 887 2210",
    whatsappSameAsPhone: true,
    owner: "Priya Nair",
    leadSource: "Exhibition",
    remarks: "Pre-opening. Target handover in 4 months — order 3 months prior.",
    spancop: "negotiate",
    spancopSince: days(-20),
    leadStatus: "hot",
    nextFollowUp: days(1),
    activityCount: 9,
    lastActivityAt: days(-2),
    openDealIds: ["D-1038"],
    hasPurchaseOrder: false,
    awaitingPayment: false,
    hasEverOrdered: false,
    lastOrderAt: null,
    lifetimeValue: 0,
    createdAt: days(-96),
  },
  {
    id: "C-003",
    name: "Zuma Restaurant Group",
    cluster: "Independent",
    emirate: "Dubai",
    area: "DIFC",
    business: "Restaurant",
    type: "Old",
    contactName: "Kenji Watanabe",
    contactRole: "F&B Manager",
    email: "kenji@zuma.ae",
    phone: "+971 52 447 9021",
    whatsappSameAsPhone: false,
    owner: "Bishal Karma",
    leadSource: "Existing customer",
    remarks: "Cold-chain critical. Rejects deliveries after 10am.",
    spancop: "payment",
    spancopSince: days(-6),
    leadStatus: "warm",
    nextFollowUp: days(3),
    activityCount: 22,
    lastActivityAt: days(-1),
    openDealIds: [],
    lastClosedDealOutcome: "won",
    hasPurchaseOrder: true,
    awaitingPayment: true,
    hasEverOrdered: true,
    lastOrderAt: days(-6),
    lifetimeValue: 795_000,
    createdAt: days(-510),
  },
  {
    id: "C-004",
    name: "Nero Coffee Group",
    cluster: "Independent",
    emirate: "Sharjah",
    area: "Al Majaz",
    business: "Cafe",
    type: "New",
    contactName: "Sara Khalil",
    contactRole: "Owner",
    email: "sara@nerocoffee.ae",
    phone: "+971 56 330 1188",
    whatsappSameAsPhone: true,
    owner: "Ahmed Faris",
    leadSource: "Instagram",
    remarks: "12 outlets. Wants single-origin options for the flagship store.",
    spancop: "negotiate",
    spancopSince: days(-9),
    leadStatus: "warm",
    nextFollowUp: days(4),
    activityCount: 7,
    lastActivityAt: days(-3),
    openDealIds: ["D-1035"],
    hasPurchaseOrder: false,
    awaitingPayment: false,
    hasEverOrdered: false,
    lastOrderAt: null,
    lifetimeValue: 0,
    createdAt: days(-58),
  },
  {
    id: "C-005",
    name: "Jumeirah Beach Hotel",
    cluster: "Jumeirah Group",
    emirate: "Dubai",
    area: "Umm Suqeim",
    business: "Hotel",
    type: "5★",
    contactName: "Fatima Al Suwaidi",
    contactRole: "Purchasing Manager",
    email: "f.alsuwaidi@jumeirah.com",
    phone: "+971 50 992 4413",
    whatsappSameAsPhone: true,
    owner: "Priya Nair",
    leadSource: "Referral",
    remarks: "Buys quarterly. Went quiet after the last amenities order.",
    spancop: "approach",
    spancopSince: days(-74),
    leadStatus: "cold",
    nextFollowUp: days(-2),
    activityCount: 11,
    lastActivityAt: days(-16),
    openDealIds: [],
    hasPurchaseOrder: false,
    awaitingPayment: false,
    hasEverOrdered: true,
    lastOrderAt: days(-74),
    lifetimeValue: 432_000,
    createdAt: days(-380),
  },
  {
    id: "C-006",
    name: "Emirates Palace Catering",
    cluster: "Independent",
    emirate: "Abu Dhabi",
    area: "West Corniche",
    business: "Catering",
    type: "Old",
    contactName: "Omar Haddad",
    contactRole: "Head Chef",
    email: "omar.haddad@epcatering.ae",
    phone: "+971 54 220 7788",
    whatsappSameAsPhone: true,
    owner: "Ahmed Faris",
    leadSource: "Walk-in",
    remarks: "Large banquet volumes during wedding season.",
    spancop: "order",
    spancopSince: days(-4),
    leadStatus: "hot",
    nextFollowUp: days(1),
    activityCount: 16,
    lastActivityAt: days(-2),
    openDealIds: [],
    lastClosedDealOutcome: "won",
    hasPurchaseOrder: true,
    awaitingPayment: false,
    hasEverOrdered: true,
    lastOrderAt: days(-4),
    lifetimeValue: 618_000,
    createdAt: days(-290),
  },
  {
    id: "C-007",
    name: "The Farmhouse Bistro",
    cluster: "Independent",
    emirate: "Dubai",
    area: "Jumeirah 1",
    business: "Restaurant",
    type: "New",
    contactName: "Claire Dubois",
    contactRole: "Owner",
    email: null,
    phone: "+971 58 776 2200",
    whatsappSameAsPhone: true,
    owner: "Lina Haddad",
    leadSource: "Cold call",
    remarks: "Organic-only sourcing policy.",
    spancop: "approach",
    spancopSince: days(-34),
    leadStatus: "warm",
    nextFollowUp: days(0),
    activityCount: 3,
    lastActivityAt: days(-4),
    openDealIds: [],
    hasPurchaseOrder: false,
    awaitingPayment: false,
    hasEverOrdered: false,
    lastOrderAt: null,
    lifetimeValue: 0,
    createdAt: days(-40),
  },
  {
    id: "C-008",
    name: "Marriott Cluster Kitchens",
    cluster: "Marriott Cluster",
    emirate: "Dubai",
    area: "Al Jaddaf",
    business: "Hotel",
    type: "4★",
    contactName: "Hassan Iqbal",
    contactRole: "Executive Chef",
    email: "hassan.iqbal@marriott.com",
    phone: "+971 50 445 8890",
    whatsappSameAsPhone: false,
    owner: "Priya Nair",
    leadSource: "Referral",
    remarks: "Won the bakery tender. PO expected this week.",
    spancop: "close",
    spancopSince: days(-3),
    leadStatus: "hot",
    nextFollowUp: days(1),
    activityCount: 19,
    lastActivityAt: days(-3),
    openDealIds: [],
    lastClosedDealOutcome: "won",
    hasPurchaseOrder: false,
    awaitingPayment: false,
    hasEverOrdered: true,
    lastOrderAt: days(-120),
    lifetimeValue: 962_000,
    createdAt: days(-450),
  },
  {
    id: "C-009",
    name: "Bloom Café Chain",
    cluster: "Independent",
    emirate: "Dubai",
    area: "Business Bay",
    business: "Cafe",
    type: "Old",
    contactName: "Nadia Rahman",
    contactRole: "General Manager",
    email: "nadia@bloomcafe.ae",
    phone: "+971 55 118 3344",
    whatsappSameAsPhone: true,
    owner: "Ahmed Faris",
    leadSource: "Instagram",
    remarks: "Juice supply running smoothly. Good payer.",
    spancop: "approach",
    spancopSince: days(-8),
    leadStatus: "warm",
    nextFollowUp: days(6),
    activityCount: 13,
    lastActivityAt: days(-8),
    openDealIds: [],
    lastClosedDealOutcome: "won",
    hasPurchaseOrder: false,
    awaitingPayment: false,
    hasEverOrdered: true,
    lastOrderAt: days(-8),
    lifetimeValue: 274_000,
    createdAt: days(-210),
  },
  {
    id: "C-010",
    name: "Radisson Blu Deira",
    cluster: "Independent",
    emirate: "Dubai",
    area: "Deira",
    business: "Hotel",
    type: "4★",
    contactName: "Peter Novak",
    contactRole: "Purchasing Manager",
    email: "p.novak@radissondeira.ae",
    phone: "+971 50 667 1200",
    whatsappSameAsPhone: false,
    owner: "Bishal Karma",
    leadSource: "Exhibition",
    remarks: "Lost the equipment tender on price. Revisit next cycle.",
    spancop: "approach",
    spancopSince: days(-12),
    leadStatus: "cold",
    nextFollowUp: days(14),
    activityCount: 6,
    lastActivityAt: days(-12),
    openDealIds: [],
    lastClosedDealOutcome: "lost",
    hasPurchaseOrder: false,
    awaitingPayment: false,
    hasEverOrdered: false,
    lastOrderAt: null,
    lifetimeValue: 0,
    createdAt: days(-160),
  },
  {
    id: "C-011",
    name: "Gulf Horeca Distributors",
    cluster: "Independent",
    emirate: "Dubai",
    area: "Al Quoz",
    business: "Catering",
    type: "Old",
    contactName: "Yusuf Al Otaibi",
    contactRole: "Owner",
    email: "yusuf@gulfhoreca.com",
    phone: "+971 56 909 4400",
    whatsappSameAsPhone: true,
    owner: "Bishal Karma",
    leadSource: "Referral",
    remarks: "Potential regional distribution partner for KSA expansion.",
    spancop: "negotiate",
    spancopSince: days(-6),
    leadStatus: "hot",
    nextFollowUp: days(2),
    activityCount: 5,
    lastActivityAt: days(-2),
    openDealIds: ["D-1022", "D-1007"],
    hasPurchaseOrder: false,
    awaitingPayment: false,
    hasEverOrdered: false,
    lastOrderAt: null,
    lifetimeValue: 0,
    createdAt: days(-70),
  },
  {
    id: "C-012",
    name: "Al Habtoor Banquet Hall",
    cluster: "Independent",
    emirate: "Dubai",
    area: "Al Habtoor City",
    business: "Banquet",
    type: "Renovation",
    contactName: "Rashid Al Mansoori",
    contactRole: "General Manager",
    email: "rashid@habtoorbanquet.ae",
    phone: "+971 52 771 6655",
    whatsappSameAsPhone: true,
    owner: "Lina Haddad",
    leadSource: "Website",
    remarks: "Reopening after refurbishment. No contact made yet.",
    spancop: "prospect",
    spancopSince: days(-25),
    leadStatus: "warm",
    nextFollowUp: null,
    activityCount: 0,
    lastActivityAt: null,
    openDealIds: [],
    hasPurchaseOrder: false,
    awaitingPayment: false,
    hasEverOrdered: false,
    lastOrderAt: null,
    lifetimeValue: 0,
    createdAt: days(-25),
  },
  {
    id: "C-013",
    name: "Sapphire Lounge & Grill",
    cluster: "Independent",
    emirate: "Ajman",
    area: "Corniche",
    business: "Restaurant",
    type: "New",
    contactName: "Imran Sheikh",
    contactRole: "Owner",
    email: null,
    phone: "+971 50 331 8877",
    whatsappSameAsPhone: true,
    owner: "Lina Haddad",
    leadSource: "Walk-in",
    remarks: "",
    spancop: "suspect",
    spancopSince: days(-41),
    leadStatus: "cold",
    nextFollowUp: null,
    activityCount: 0,
    lastActivityAt: null,
    openDealIds: [],
    hasPurchaseOrder: false,
    awaitingPayment: false,
    hasEverOrdered: false,
    lastOrderAt: null,
    lifetimeValue: 0,
    createdAt: days(-41),
  },
  {
    id: "C-014",
    name: "Grand Millennium Barsha",
    cluster: "Independent",
    emirate: "Dubai",
    area: "Al Barsha",
    business: "Hotel",
    type: "4★",
    contactName: "Anita Verma",
    contactRole: "F&B Manager",
    email: "anita.verma@grandmillennium.ae",
    phone: "+971 55 664 2299",
    whatsappSameAsPhone: true,
    owner: "Ahmed Faris",
    leadSource: "Cold call",
    remarks: "Interested but budget locked until next quarter.",
    spancop: "approach",
    spancopSince: days(-45),
    leadStatus: "cold",
    nextFollowUp: days(21),
    activityCount: 4,
    lastActivityAt: days(-31),
    openDealIds: [],
    hasPurchaseOrder: false,
    awaitingPayment: false,
    hasEverOrdered: false,
    lastOrderAt: null,
    lifetimeValue: 0,
    createdAt: days(-88),
  },
  {
    id: "C-015",
    name: "Burj Al Arab Terrace",
    cluster: "Jumeirah Group",
    emirate: "Dubai",
    area: "Umm Suqeim 3",
    business: "Hotel",
    type: "7★",
    contactName: "Luca Bianchi",
    contactRole: "Executive Chef",
    email: "l.bianchi@jumeirah.com",
    phone: "+971 50 887 3311",
    whatsappSameAsPhone: false,
    owner: "Bishal Karma",
    leadSource: "Referral",
    remarks: "Premium range only. Very high service expectations.",
    spancop: "suspect",
    spancopSince: days(-9),
    leadStatus: "warm",
    nextFollowUp: null,
    activityCount: 0,
    lastActivityAt: null,
    openDealIds: [],
    hasPurchaseOrder: false,
    awaitingPayment: false,
    hasEverOrdered: false,
    lastOrderAt: null,
    lifetimeValue: 0,
    createdAt: days(-9),
  },
];

/** Seeded stage history — the basis of period-flow reporting. */
export const STAGE_TRANSITIONS: StageTransition[] = [
  {
    id: "T-001",
    companyId: "C-001",
    from: "approach",
    to: "negotiate",
    trigger: "accepted-suggestion",
    reason: "Deal D-1041 opened",
    at: days(-12),
    by: "Bishal Karma",
  },
  {
    id: "T-002",
    companyId: "C-003",
    from: "order",
    to: "payment",
    trigger: "accepted-suggestion",
    reason: "Delivered — payment outstanding",
    at: days(-6),
    by: "Bishal Karma",
  },
  {
    id: "T-003",
    companyId: "C-008",
    from: "negotiate",
    to: "close",
    trigger: "accepted-suggestion",
    reason: "Bakery tender won",
    at: days(-3),
    by: "Priya Nair",
  },
  {
    id: "T-004",
    companyId: "C-010",
    from: "negotiate",
    to: "approach",
    trigger: "accepted-suggestion",
    reason: "Deal lost — relationship open",
    at: days(-12),
    by: "Bishal Karma",
  },
  {
    id: "T-005",
    companyId: "C-009",
    from: "payment",
    to: "approach",
    trigger: "accepted-suggestion",
    reason: "Payment collected — cycle complete",
    at: days(-8),
    by: "Ahmed Faris",
  },
];

export function daysInStage(company: Company) {
  return Math.floor(
    (Date.now() - new Date(company.spancopSince).getTime()) / 86_400_000,
  );
}

export function daysSinceLastOrder(company: Company) {
  if (!company.lastOrderAt) return null;
  return Math.floor(
    (Date.now() - new Date(company.lastOrderAt).getTime()) / 86_400_000,
  );
}
