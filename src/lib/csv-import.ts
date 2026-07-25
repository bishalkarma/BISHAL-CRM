/**
 * CSV import for companies.
 *
 * The user downloads a sample file containing the exact headers and five
 * filled example rows, edits it, and uploads it back. Matching the template
 * means the parser never has to guess at formats.
 */

import {
  BUSINESS_TYPES,
  CONTACT_ROLES,
  EMIRATES,
  HOTEL_TYPES,
  LEAD_SOURCES,
  VENUE_TYPES,
  type BusinessType,
  type Company,
  type CompanyType,
  type ContactRole,
  type Emirate,
  type LeadSource,
} from "./companies";

export const CSV_HEADERS = [
  "Property Name",
  "Cluster",
  "Emirate",
  "Location / Area",
  "Business",
  "Type",
  "Contact Person",
  "Role / Title",
  "Email",
  "Phone",
  "Account Owner",
  "Lead Source",
  "Remarks",
] as const;

/** Five realistic rows so the expected format is unambiguous. */
const SAMPLE_ROWS: string[][] = [
  [
    "Grand Hyatt Dubai",
    "Hyatt Group",
    "Dubai",
    "Oud Metha",
    "Hotel",
    "5★",
    "Sanjay Menon",
    "Executive Chef",
    "sanjay.menon@hyatt.com",
    "+971 50 111 2233",
    "Bishal Karma",
    "Referral",
    "Buys bakery ingredients monthly",
  ],
  [
    "Cafe Bateel Marina",
    "Bateel",
    "Dubai",
    "Dubai Marina",
    "Cafe",
    "Old",
    "Layla Hassan",
    "General Manager",
    "layla@bateel.ae",
    "+971 55 222 3344",
    "Priya Nair",
    "Walk-in",
    "Prefers deliveries before 9am",
  ],
  [
    "Sofitel Corniche Project",
    "Accor",
    "Abu Dhabi",
    "Corniche Road",
    "Project",
    "New",
    "Tarek Nasser",
    "Purchasing Manager",
    "tarek.nasser@accor.com",
    "+971 56 333 4455",
    "Ahmed Faris",
    "Exhibition",
    "Pre-opening — handover in 5 months",
  ],
  [
    "Spice Route Restaurant",
    "Independent",
    "Sharjah",
    "Al Khan",
    "Restaurant",
    "Renovation",
    "Vikram Rao",
    "Owner",
    "",
    "+971 52 444 5566",
    "Lina Haddad",
    "Instagram",
    "No email — WhatsApp only",
  ],
  [
    "Royal Banquet Hall",
    "Independent",
    "Ajman",
    "Al Nuaimiya",
    "Banquet",
    "Old",
    "Mariam Saeed",
    "F&B Manager",
    "mariam@royalbanquet.ae",
    "+971 54 555 6677",
    "Bishal Karma",
    "Cold call",
    "Wedding season peaks Nov–Feb",
  ],
];

function escapeCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildSampleCsv() {
  return [CSV_HEADERS, ...SAMPLE_ROWS]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");
}

/** Minimal RFC-4180 parser — handles quoted cells and embedded commas. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const clean = text.replace(/^\uFEFF/, ""); // strip BOM from Excel

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];

    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += char;
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }

  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

export type ImportIssue = { row: number; field: string; message: string };

export type ParsedRow = {
  rowNumber: number;
  raw: Record<string, string>;
  company: Company | null;
  issues: ImportIssue[];
};

export type ImportPreview = {
  rows: ParsedRow[];
  validCount: number;
  errorCount: number;
  headerError: string | null;
};

const matchOne = <T extends string>(
  value: string,
  options: readonly T[],
): T | null => {
  const v = value.trim().toLowerCase();
  return options.find((o) => o.toLowerCase() === v) ?? null;
};

/**
 * Validates every row and returns a preview. Bad rows are reported with the
 * exact field at fault rather than the whole file being rejected.
 */
export function buildImportPreview(
  text: string,
  existingNames: string[],
): ImportPreview {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { rows: [], validCount: 0, errorCount: 0, headerError: "File is empty." };
  }

  const header = rows[0].map((h) => h.trim());
  const missing = CSV_HEADERS.filter((h) => !header.includes(h));
  if (missing.length) {
    return {
      rows: [],
      validCount: 0,
      errorCount: 0,
      headerError: `Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Download the sample file and use its headers.`,
    };
  }

  const index = (name: string) => header.indexOf(name);
  const seen = new Set(existingNames.map((n) => n.toLowerCase()));
  const parsed: ParsedRow[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const get = (name: string) => (cells[index(name)] ?? "").trim();
    const issues: ImportIssue[] = [];
    const raw: Record<string, string> = {};
    CSV_HEADERS.forEach((h) => (raw[h] = get(h)));

    const name = get("Property Name");
    if (!name) issues.push({ row: r, field: "Property Name", message: "Required" });
    else if (seen.has(name.toLowerCase()))
      issues.push({ row: r, field: "Property Name", message: "Duplicate" });

    const emirate = matchOne<Emirate>(get("Emirate"), EMIRATES);
    if (!emirate)
      issues.push({
        row: r,
        field: "Emirate",
        message: `Must be one of: ${EMIRATES.join(", ")}`,
      });

    const area = get("Location / Area");
    if (!area) issues.push({ row: r, field: "Location / Area", message: "Required" });

    const business = matchOne<BusinessType>(get("Business"), BUSINESS_TYPES);
    if (!business)
      issues.push({
        row: r,
        field: "Business",
        message: `Must be one of: ${BUSINESS_TYPES.join(", ")}`,
      });

    // Type validity depends on Business — the same conditional rule as the form.
    const typeOptions: readonly CompanyType[] =
      business === "Hotel" ? HOTEL_TYPES : VENUE_TYPES;
    const type = business ? matchOne<CompanyType>(get("Type"), typeOptions) : null;
    if (business && !type)
      issues.push({
        row: r,
        field: "Type",
        message: `For ${business}, must be one of: ${typeOptions.join(", ")}`,
      });

    const contactName = get("Contact Person");
    if (!contactName)
      issues.push({ row: r, field: "Contact Person", message: "Required" });

    const role = matchOne<ContactRole>(get("Role / Title"), CONTACT_ROLES);
    if (!role)
      issues.push({
        row: r,
        field: "Role / Title",
        message: `Must be one of: ${CONTACT_ROLES.join(", ")}`,
      });

    const email = get("Email");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      issues.push({ row: r, field: "Email", message: "Not a valid email" });

    const phone = get("Phone");
    if (!phone) issues.push({ row: r, field: "Phone", message: "Required" });

    const leadSource = matchOne<LeadSource>(get("Lead Source"), LEAD_SOURCES);

    let company: Company | null = null;
    if (issues.length === 0 && emirate && business && type && role) {
      const now = new Date().toISOString();
      seen.add(name.toLowerCase());
      company = {
        id: `C-imp-${r}-${Date.now().toString().slice(-4)}`,
        name,
        cluster: get("Cluster") || null,
        emirate,
        area,
        business,
        type,
        contactName,
        contactRole: role,
        email: email || null,
        phone,
        whatsappSameAsPhone: true,
        owner: get("Account Owner") || "Bishal Karma",
        leadSource: leadSource ?? "Referral",
        remarks: get("Remarks"),
        spancop: "suspect",
        spancopSince: now,
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
        createdAt: now,
      };
    }

    parsed.push({ rowNumber: r, raw, company, issues });
  }

  return {
    rows: parsed,
    validCount: parsed.filter((p) => p.company).length,
    errorCount: parsed.filter((p) => p.issues.length).length,
    headerError: null,
  };
}
