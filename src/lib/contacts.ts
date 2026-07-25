/**
 * Contacts — many per company.
 *
 * A company's contacts are the people we actually deal with. One is flagged
 * primary; deals record who the enquiry came from and who we're dealing with
 * now, which may be two different people.
 */

import type { ContactRole } from "./companies";

export type Contact = {
  id: string;
  companyId: string;
  name: string;
  role: ContactRole;
  email: string | null;
  phone: string;
  whatsappSameAsPhone: boolean;
  isPrimary: boolean;
  /** True when this person signs off, not just relays requests. */
  isDecisionMaker: boolean;
  notes: string;
  createdAt: string;
};

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

export const CONTACTS: Contact[] = [
  // C-001 Atlantis The Palm
  {
    id: "P-001",
    companyId: "C-001",
    name: "Marco Rossi",
    role: "Executive Chef",
    email: "marco.rossi@atlantis.ae",
    phone: "+971 50 123 4567",
    whatsappSameAsPhone: true,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "Decides all F&B product listings.",
    createdAt: days(-420),
  },
  {
    id: "P-002",
    companyId: "C-001",
    name: "Reena Thomas",
    role: "Storekeeper",
    email: null,
    phone: "+971 55 442 8890",
    whatsappSameAsPhone: true,
    isPrimary: false,
    isDecisionMaker: false,
    notes: "Raises most day-to-day requirements.",
    createdAt: days(-300),
  },
  {
    id: "P-003",
    companyId: "C-001",
    name: "Ankit Singh Chauhan",
    role: "Purchasing Manager",
    email: "a.chauhan@atlantis.ae",
    phone: "+971 52 118 7733",
    whatsappSameAsPhone: false,
    isPrimary: false,
    isDecisionMaker: true,
    notes: "Handles final commercial negotiation and PO issuance.",
    createdAt: days(-290),
  },
  {
    id: "P-021",
    companyId: "C-001",
    name: "Grace Fernandes",
    role: "Other",
    email: null,
    phone: "+971 55 660 4412",
    whatsappSameAsPhone: true,
    isPrimary: false,
    isDecisionMaker: false,
    notes: "Housekeeping supervisor — raises amenity requirements.",
    createdAt: days(-260),
  },
  // C-002 Rixos Marina
  {
    id: "P-004",
    companyId: "C-002",
    name: "Elena Petrova",
    role: "Purchasing Manager",
    email: "e.petrova@rixosmarina.ae",
    phone: "+971 55 887 2210",
    whatsappSameAsPhone: true,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "Pre-opening procurement lead.",
    createdAt: days(-96),
  },
  {
    id: "P-005",
    companyId: "C-002",
    name: "Dmitri Volkov",
    role: "General Manager",
    email: "gm@rixosmarina.ae",
    phone: "+971 50 664 1120",
    whatsappSameAsPhone: false,
    isPrimary: false,
    isDecisionMaker: true,
    notes: "Signs off anything above AED 250K.",
    createdAt: days(-90),
  },
  // C-003 Zuma
  {
    id: "P-006",
    companyId: "C-003",
    name: "Kenji Watanabe",
    role: "F&B Manager",
    email: "kenji@zuma.ae",
    phone: "+971 52 447 9021",
    whatsappSameAsPhone: false,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "Very strict on cold-chain compliance.",
    createdAt: days(-510),
  },
  {
    id: "P-007",
    companyId: "C-003",
    name: "Farid Karim",
    role: "Executive Chef",
    email: null,
    phone: "+971 56 220 3344",
    whatsappSameAsPhone: true,
    isPrimary: false,
    isDecisionMaker: false,
    notes: "Chooses cookware and kitchen equipment.",
    createdAt: days(-400),
  },
  // C-004 Nero Coffee
  {
    id: "P-008",
    companyId: "C-004",
    name: "Sara Khalil",
    role: "Owner",
    email: "sara@nerocoffee.ae",
    phone: "+971 56 330 1188",
    whatsappSameAsPhone: true,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "Owner-operator, decides everything herself.",
    createdAt: days(-58),
  },
  // C-005 Jumeirah Beach Hotel
  {
    id: "P-009",
    companyId: "C-005",
    name: "Fatima Al Suwaidi",
    role: "Purchasing Manager",
    email: "f.alsuwaidi@jumeirah.com",
    phone: "+971 50 992 4413",
    whatsappSameAsPhone: true,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "Quarterly buying cycle.",
    createdAt: days(-380),
  },
  {
    id: "P-010",
    companyId: "C-005",
    name: "Grace Mensah",
    role: "Other",
    email: null,
    phone: "+971 55 771 2200",
    whatsappSameAsPhone: true,
    isPrimary: false,
    isDecisionMaker: false,
    notes: "Housekeeping supervisor — raises amenities requests.",
    createdAt: days(-200),
  },
  // C-006 Emirates Palace Catering
  {
    id: "P-011",
    companyId: "C-006",
    name: "Omar Haddad",
    role: "Head Chef",
    email: "omar.haddad@epcatering.ae",
    phone: "+971 54 220 7788",
    whatsappSameAsPhone: true,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "Banquet volumes peak in wedding season.",
    createdAt: days(-290),
  },
  // C-007 Farmhouse Bistro
  {
    id: "P-012",
    companyId: "C-007",
    name: "Claire Dubois",
    role: "Owner",
    email: null,
    phone: "+971 58 776 2200",
    whatsappSameAsPhone: true,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "Organic sourcing only.",
    createdAt: days(-40),
  },
  // C-008 Marriott Cluster
  {
    id: "P-013",
    companyId: "C-008",
    name: "Hassan Iqbal",
    role: "Executive Chef",
    email: "hassan.iqbal@marriott.com",
    phone: "+971 50 445 8890",
    whatsappSameAsPhone: false,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "Cluster chef across three properties.",
    createdAt: days(-450),
  },
  // C-009 Bloom Café
  {
    id: "P-014",
    companyId: "C-009",
    name: "Nadia Rahman",
    role: "General Manager",
    email: "nadia@bloomcafe.ae",
    phone: "+971 55 118 3344",
    whatsappSameAsPhone: true,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "Reliable payer.",
    createdAt: days(-210),
  },
  // C-010 Radisson Blu Deira
  {
    id: "P-015",
    companyId: "C-010",
    name: "Peter Novak",
    role: "Purchasing Manager",
    email: "p.novak@radissondeira.ae",
    phone: "+971 50 667 1200",
    whatsappSameAsPhone: false,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "Price-driven buyer.",
    createdAt: days(-160),
  },
  // C-011 Gulf Horeca
  {
    id: "P-016",
    companyId: "C-011",
    name: "Yusuf Al Otaibi",
    role: "Owner",
    email: "yusuf@gulfhoreca.com",
    phone: "+971 56 909 4400",
    whatsappSameAsPhone: true,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "Exploring KSA distribution partnership.",
    createdAt: days(-70),
  },
  // C-012 Al Habtoor Banquet
  {
    id: "P-017",
    companyId: "C-012",
    name: "Rashid Al Mansoori",
    role: "General Manager",
    email: "rashid@habtoorbanquet.ae",
    phone: "+971 52 771 6655",
    whatsappSameAsPhone: true,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "Reopening after refurbishment.",
    createdAt: days(-25),
  },
  // C-013 Sapphire Lounge
  {
    id: "P-018",
    companyId: "C-013",
    name: "Imran Sheikh",
    role: "Owner",
    email: null,
    phone: "+971 50 331 8877",
    whatsappSameAsPhone: true,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "",
    createdAt: days(-41),
  },
  // C-014 Grand Millennium
  {
    id: "P-019",
    companyId: "C-014",
    name: "Anita Verma",
    role: "F&B Manager",
    email: "anita.verma@grandmillennium.ae",
    phone: "+971 55 664 2299",
    whatsappSameAsPhone: true,
    isPrimary: true,
    isDecisionMaker: false,
    notes: "Budget locked until next quarter.",
    createdAt: days(-88),
  },
  // C-015 Burj Al Arab
  {
    id: "P-020",
    companyId: "C-015",
    name: "Luca Bianchi",
    role: "Executive Chef",
    email: "l.bianchi@jumeirah.com",
    phone: "+971 50 887 3311",
    whatsappSameAsPhone: false,
    isPrimary: true,
    isDecisionMaker: true,
    notes: "Premium range only.",
    createdAt: days(-9),
  },
];

export function contactsForCompany(companyId: string) {
  return CONTACTS.filter((c) => c.companyId === companyId);
}

export function primaryContact(companyId: string) {
  const list = contactsForCompany(companyId);
  return list.find((c) => c.isPrimary) ?? list[0] ?? null;
}

export function contactById(id: string | null | undefined) {
  return id ? (CONTACTS.find((c) => c.id === id) ?? null) : null;
}
