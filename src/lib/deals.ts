/**
 * Deal model + demo dataset for the pipeline board.
 *
 * Shapes here are the contract the Supabase schema will implement later,
 * so the UI won't need to change when real data arrives.
 */

import type { CurrencyCode } from "./currency";
import { convert } from "./currency";
import type { DealStage } from "./pipeline";
import type {
  ActivePeriod,
  ContactTrailEntry,
  LineItem,
  LostReason,
  SampleRecord,
} from "./deal-model";
import { dealValue } from "./deal-model";

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
  /** Every deal belongs to an existing company. */
  companyId: string;
  accountType: AccountType;
  /** Who brought us the query. Locked at creation, never changes. */
  enquiryFromId: string;
  /** Who we are dealing with now. Moves automatically with activity. */
  currentContactId: string;
  contactTrail: ContactTrailEntry[];
  /** Mandatory — powers category analysis on the dashboard. */
  category: string;
  /** Products on this enquiry. Deal value is the sum of non-rejected lines. */
  lines: LineItem[];
  /** Derived from `lines` — kept for sorting and quick reads. */
  value: number;
  currency: CurrencyCode;
  stage: DealStage;
  /**
   * The open stage a deal sat in immediately before it was closed.
   * Lets won/lost deals be shown back in the column they closed from.
   * Undefined while the deal is still open.
   */
  closedFromStage?: DealStage;
  /** Manual override; falls back to the stage default when null. */
  probability: number | null;
  owner: string;
  city: string;
  expectedCloseDate: string;
  lastActivityAt: string;
  createdAt: string;
  priority: DealPriority;
  tags: string[];
  /** Required when stage is "lost"; editable afterwards. */
  lostReason?: LostReason;
  lostNote?: string;
  /** Parked without being lost — excluded from the forecast. */
  onHold: boolean;
  /** When the customer needs delivery. Distinct from expected close. */
  reqDate: string | null;
  /** Latest update from the client. */
  nextAction: string;
  /** What we must do next. */
  task: string;
  taskDueDate: string | null;
  taskDone: boolean;
  remarks: string;
  /** Only meaningful from the Sampling stage onward. */
  sample: SampleRecord | null;
  /** Active work periods; dormant gaps between them are not counted. */
  periods: ActivePeriod[];
};

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

let lineSeq = 0;
const line = (
  product: string,
  brand: string,
  quantity: number,
  unitPrice: number,
  status: LineItem["status"] = "quoted",
  rejectReason?: LostReason,
): LineItem => ({
  id: `L-${(++lineSeq).toString().padStart(3, "0")}`,
  product,
  brand,
  quantity,
  unit: "Pcs",
  unitPrice,
  status,
  rejectReason,
});

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
    category: "BOH — Back of House",
    title: "Annual dry goods supply contract",
    company: "Atlantis The Palm",
    companyId: "C-001",
    accountType: "Hotel",
    enquiryFromId: "P-002",
    currentContactId: "P-003",
    contactTrail: [
      { contactId: "P-002", at: days(-48), note: "Raised the requirement" },
      { contactId: "P-003", at: days(-30), note: "Commercials moved to purchasing" },
    ],
    lines: [
      line("Basmati rice 20kg sack", "India Gate", 400, 780),
      line("Refined sunflower oil 16L", "Sunny", 260, 690),
    ],
    value: 0,
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
    onHold: false,
    reqDate: days(20),
    nextAction: "They like the revised rates, waiting on the final offer sheet.",
    task: "Send revised final quote",
    taskDueDate: days(2),
    taskDone: false,
    remarks: "Renewal of last year's contract. Deliveries before 10am only.",
    sample: null,
    periods: [{ openedAt: days(-48), closedAt: null }],
  },
  {
    id: "D-1038",
    category: "FF&E — Furniture, Fixtures and Equipment",
    title: "Pre-opening F&B tableware package",
    company: "Rixos Marina Residences",
    companyId: "C-002",
    accountType: "Hotel Project",
    enquiryFromId: "P-004",
    currentContactId: "P-004",
    contactTrail: [{ contactId: "P-004", at: days(-30), note: "Sent the enquiry" }],
    lines: [
      line("Dinner plate 27cm", "Steelite", 1200, 42),
      line("Water tumbler 300ml", "Ocean", 1800, 18),
      line("Cutlery set 24pc", "Sola", 400, 380),
    ],
    value: 0,
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
    onHold: false,
    reqDate: days(75),
    nextAction: "Catalogue shared, awaiting shortlist from the GM.",
    task: "Follow up on the tableware shortlist",
    taskDueDate: days(3),
    taskDone: false,
    remarks: "Hotel opens in ~4 months. Order 3 months prior.",
    sample: null,
    periods: [{ openedAt: days(-30), closedAt: null }],
  },
  {
    id: "D-1035",
    category: "BOH — Back of House",
    title: "Specialty coffee beans — 12 outlets",
    company: "Nero Coffee Group",
    companyId: "C-004",
    accountType: "Cafe",
    enquiryFromId: "P-008",
    currentContactId: "P-008",
    contactTrail: [{ contactId: "P-008", at: days(-40), note: "Walked into the office" }],
    lines: [
      line("Single-origin Ethiopia 1kg", "Bishal Roastery", 480, 210),
      line("House blend 1kg", "Bishal Roastery", 720, 145),
    ],
    value: 0,
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
    onHold: false,
    reqDate: days(30),
    nextAction: "Samples with the head barista for cupping.",
    task: "Collect cupping feedback",
    taskDueDate: days(1),
    taskDone: false,
    remarks: "Wants single-origin for the flagship store only.",
    sample: {
      sentAt: days(-9),
      feedbackAt: days(-3),
      feedback: "Liked the Ethiopia; house blend needs a darker roast.",
    },
    periods: [{ openedAt: days(-40), closedAt: null }],
  },
  {
    id: "D-1031",
    category: "BOH — Back of House",
    title: "Frozen seafood quarterly rate contract",
    company: "Zuma Restaurant Group",
    companyId: "C-003",
    accountType: "Restaurant",
    enquiryFromId: "P-006",
    currentContactId: "P-006",
    contactTrail: [{ contactId: "P-006", at: days(-26), note: "Sent the enquiry" }],
    lines: [
      line("Black tiger prawn 16/20 2kg", "Siam Canadian", 300, 145),
      line("Norwegian salmon fillet 1.5kg", "Leroy", 180, 168),
    ],
    value: 0,
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
    onHold: false,
    reqDate: days(12),
    nextAction: "Negotiating quarterly price lock against USD movement.",
    task: "Confirm cold-chain delivery window",
    taskDueDate: days(1),
    taskDone: false,
    remarks: "Rejects deliveries after 10am.",
    sample: null,
    periods: [{ openedAt: days(-26), closedAt: null }],
  },
  {
    id: "D-1029",
    category: "OS&E — Operating Supplies and Equipment",
    title: "Housekeeping amenities restock",
    company: "Jumeirah Beach Hotel",
    companyId: "C-005",
    accountType: "Hotel",
    enquiryFromId: "P-010",
    currentContactId: "P-009",
    contactTrail: [
      { contactId: "P-010", at: days(-34), note: "Housekeeping raised the need" },
      { contactId: "P-009", at: days(-20), note: "Passed to purchasing" },
    ],
    lines: [
      line("Shampoo 30ml", "Ecolab", 6000, 4.2),
      line("Body lotion 30ml", "Ecolab", 6000, 4.6),
      line("Slippers pair", "Generic", 3000, 8.5),
    ],
    value: 0,
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
    onHold: true,
    reqDate: days(45),
    nextAction: "Budget review pending until the new quarter.",
    task: "Re-engage after quarter start",
    taskDueDate: days(14),
    taskDone: false,
    remarks: "Buys quarterly. Went quiet after the last order.",
    sample: null,
    periods: [{ openedAt: days(-34), closedAt: null }],
  },
  {
    id: "D-1026",
    category: "OS&E — Operating Supplies and Equipment",
    title: "Banquet catering disposables",
    company: "Emirates Palace Catering",
    companyId: "C-006",
    accountType: "Catering",
    enquiryFromId: "P-011",
    currentContactId: "P-011",
    contactTrail: [{ contactId: "P-011", at: days(-38), note: "Sent the enquiry" }],
    lines: [
      line("Bagasse plate 10in", "Ecoware", 20000, 1.35),
      line("Wooden cutlery set", "Ecoware", 15000, 0.95),
      line("Napkin 2ply pack of 100", "Fine", 900, 12),
    ],
    value: 0,
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
    onHold: false,
    reqDate: days(25),
    nextAction: "Quote issued, chasing approval before wedding season.",
    task: "Chase quote approval",
    taskDueDate: days(-1),
    taskDone: false,
    remarks: "Volumes peak during wedding season.",
    sample: null,
    periods: [{ openedAt: days(-38), closedAt: null }],
  },
  {
    id: "D-1022",
    category: "OS&E — Operating Supplies and Equipment",
    title: "Regional distribution partnership",
    company: "Gulf Horeca Distributors",
    companyId: "C-011",
    accountType: "Distributor",
    enquiryFromId: "P-016",
    currentContactId: "P-016",
    contactTrail: [{ contactId: "P-016", at: days(-8), note: "Introduced via referral" }],
    lines: [line("KSA distribution rights — year 1", "—", 1, 640000)],
    value: 0,
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
    onHold: false,
    reqDate: null,
    nextAction: "Initial discussion on territory and margins.",
    task: "Prepare partnership proposal",
    taskDueDate: days(5),
    taskDone: false,
    remarks: "Potential regional partner for KSA expansion.",
    sample: null,
    periods: [{ openedAt: days(-8), closedAt: null }],
  },
  {
    id: "D-1019",
    category: "BOH — Back of House",
    title: "Organic produce weekly supply",
    company: "The Farmhouse Bistro",
    companyId: "C-007",
    accountType: "Restaurant",
    enquiryFromId: "P-012",
    currentContactId: "P-012",
    contactTrail: [{ contactId: "P-012", at: days(-5), note: "Cold call follow-up" }],
    lines: [
      line("Organic mixed leaves 1kg", "Greenheart", 520, 68),
      line("Organic cherry tomato 500g", "Greenheart", 640, 22),
    ],
    value: 0,
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
    onHold: false,
    reqDate: days(40),
    nextAction: "Asked for organic certification documents.",
    task: "Send certification pack",
    taskDueDate: days(2),
    taskDone: false,
    remarks: "Organic-only sourcing policy.",
    sample: null,
    periods: [{ openedAt: days(-5), closedAt: null }],
  },
  {
    id: "D-1018",
    category: "BOH — Back of House",
    title: "Bakery ingredients annual tender",
    company: "Marriott Cluster Kitchens",
    companyId: "C-008",
    accountType: "Hotel",
    enquiryFromId: "P-013",
    currentContactId: "P-013",
    contactTrail: [{ contactId: "P-013", at: days(-62), note: "Tender invitation" }],
    lines: [
      line("Bread flour 25kg", "Prima", 900, 118, "approved"),
      line("Unsalted butter 25kg", "Anchor", 300, 520, "approved"),
      line("Dark chocolate callets 10kg", "Callebaut", 120, 410, "rejected", "Item not in scope"),
    ],
    value: 0,
    currency: "AED",
    stage: "won",
    closedFromStage: "negotiation",
    probability: 100,
    owner: "Priya Nair",
    city: "Dubai",
    expectedCloseDate: days(-3),
    lastActivityAt: days(-3),
    createdAt: days(-62),
    priority: "high",
    tags: ["Tender", "Annual contract"],
    onHold: false,
    reqDate: days(10),
    nextAction: "Tender awarded. PO expected this week.",
    task: "Collect the purchase order",
    taskDueDate: days(2),
    taskDone: false,
    remarks: "Chocolate line dropped — handled by their pastry supplier.",
    sample: null,
    periods: [{ openedAt: days(-62), closedAt: days(-3) }],
  },
  {
    id: "D-1015",
    category: "FOH — Front of House",
    title: "Cold-pressed juice supply",
    company: "Bloom Café Chain",
    companyId: "C-009",
    accountType: "Cafe",
    enquiryFromId: "P-014",
    currentContactId: "P-014",
    contactTrail: [{ contactId: "P-014", at: days(-44), note: "Repeat customer enquiry" }],
    lines: [
      line("Cold-pressed orange 1L", "Freshly", 1200, 26, "approved"),
      line("Cold-pressed green blend 1L", "Freshly", 800, 29, "approved"),
    ],
    value: 0,
    currency: "AED",
    stage: "won",
    closedFromStage: "sampling",
    probability: 100,
    owner: "Ahmed Faris",
    city: "Dubai",
    expectedCloseDate: days(-8),
    lastActivityAt: days(-8),
    createdAt: days(-44),
    priority: "medium",
    tags: ["Beverage"],
    onHold: false,
    reqDate: days(-2),
    nextAction: "Won after the tasting. Deliveries started.",
    task: "",
    taskDueDate: null,
    taskDone: true,
    remarks: "Good payer.",
    sample: {
      sentAt: days(-20),
      feedbackAt: days(-14),
      feedback: "Approved both blends after tasting.",
    },
    periods: [{ openedAt: days(-44), closedAt: days(-8) }],
  },
  {
    id: "D-1012",
    category: "FF&E — Furniture, Fixtures and Equipment",
    title: "Kitchen equipment refresh",
    company: "Radisson Blu Deira",
    companyId: "C-010",
    accountType: "Hotel",
    enquiryFromId: "P-015",
    currentContactId: "P-015",
    contactTrail: [{ contactId: "P-015", at: days(-70), note: "Met at exhibition" }],
    lines: [
      line("Combi oven 10 grid", "Rational", 2, 48000, "rejected", "Lead time"),
      line("SS work table 1800mm", "Generic", 12, 3000, "rejected", "Lead time"),
    ],
    value: 0,
    currency: "AED",
    stage: "lost",
    closedFromStage: "quotation",
    probability: 0,
    owner: "Bishal Karma",
    city: "Dubai",
    expectedCloseDate: days(-12),
    lastActivityAt: days(-12),
    createdAt: days(-70),
    priority: "low",
    tags: ["Equipment"],
    lostReason: "Lead time",
    lostNote: "Supplier could not meet their installation date.",
    onHold: false,
    reqDate: days(-5),
    nextAction: "Lost on lead time. Revisit next refurbishment cycle.",
    task: "",
    taskDueDate: null,
    taskDone: true,
    remarks: "Price-driven buyer.",
    sample: null,
    periods: [{ openedAt: days(-70), closedAt: days(-12) }],
  },
  {
    id: "D-1009",
    category: "FOH — Front of House",
    title: "Premium olive oil range listing",
    company: "Zuma Restaurant Group",
    companyId: "C-003",
    accountType: "Restaurant",
    enquiryFromId: "P-007",
    currentContactId: "P-007",
    contactTrail: [{ contactId: "P-007", at: days(-33), note: "Chef requested samples" }],
    lines: [line("EVOO Tuscan 5L tin", "Frantoio", 150, 297)],
    value: 0,
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
    onHold: false,
    reqDate: days(18),
    nextAction: "Chef tasting the Tuscan EVOO this week.",
    task: "Follow up on tasting outcome",
    taskDueDate: days(1),
    taskDone: false,
    remarks: "Reopened after the first enquiry stalled last quarter.",
    sample: { sentAt: days(-7), feedbackAt: null, feedback: null },
    // Reopened: dormant gap between the two periods is NOT counted.
    periods: [
      { openedAt: days(-120), closedAt: days(-60) },
      { openedAt: days(-33), closedAt: null },
    ],
  },
  {
    id: "D-1007",
    category: "BOH — Back of House",
    title: "Staff canteen bulk grocery",
    company: "Gulf Horeca Distributors",
    companyId: "C-011",
    accountType: "Distributor",
    enquiryFromId: "P-016",
    currentContactId: "P-016",
    contactTrail: [{ contactId: "P-016", at: days(-14), note: "Follow-on enquiry" }],
    lines: [
      line("Wheat flour 50kg", "Generic", 300, 165),
      line("Cooking oil 20L", "Generic", 160, 245),
    ],
    value: 0,
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
    onHold: false,
    reqDate: days(35),
    nextAction: "Confirmed monthly volumes, preparing the quote.",
    task: "Prepare bulk grocery quote",
    taskDueDate: days(3),
    taskDone: false,
    remarks: "",
    sample: null,
    periods: [{ openedAt: days(-14), closedAt: null }],
  },
];

// Deal value is always derived from the line items.
DEALS.forEach((deal) => {
  deal.value = dealValue(deal.lines);
});

/** Deal value converted to the display currency. */
export function dealValueIn(deal: Deal, target: CurrencyCode) {
  return convert(deal.value, deal.currency, target);
}
