/**
 * BUILD 18.14 — Unified Physical Sample Custody & Standalone Customer Samples.
 *
 * Combines:
 *  1) Per-line Deal samples (`deal_lines.sample_*`) across ALL deal stages
 *     (including Won and Lost deals where a physical sample may still be out!)
 *  2) Standalone Customer samples (`customer_samples`) given directly to a
 *     hotel/client before or without creating a Deal.
 *
 * Thresholds agreed with Bishal:
 *  • 0–6 days out   → Fresh (normal testing window)
 *  • 7–13 days out  → Amber ("Follow up")
 *  • 14+ days out   → Red ("Overdue pickup")
 */

import type { Activity } from "./activities";
import type { Company } from "./companies";
import type { Contact } from "./contacts";
import type { Deal } from "./deals";
import type { LineItem, SampleReturnStatus, Unit } from "./deal-model";
import type { DealStage } from "./pipeline";

export const SAMPLE_FOLLOWUP_DAYS = 7;
export const SAMPLE_OVERDUE_DAYS = 14;

export type CustomerSampleVerdict = "pending" | "approved" | "rejected";
export type CustomerSampleStatus =
  | "out"
  | "returned"
  | "consumable"
  | "cancelled";

export type CustomerSample = {
  id: string;
  companyId: string;
  contactId: string | null;
  product: string;
  brand: string;
  sampleQty: number;
  unit: Unit;
  sentAt: string;
  returnedAt: string | null;
  returnStatus: CustomerSampleStatus;
  verdict: CustomerSampleVerdict | null;
  recipientName: string;
  handoverNote: string;
  returnNote: string;
  followUpActivityId: string | null;
  owner: string;
  owner_id: string | null;
  created_by: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SampleCustodyTone =
  | "out-fresh"
  | "out-followup"
  | "out-overdue"
  | "returned"
  | "consumable";

export type SampleVerdictTone = "pending" | "approved" | "rejected";

export type SampleLedgerEntry = {
  key: string;
  source: "deal" | "standalone";
  dealId: string | null;
  dealTitle: string | null;
  dealStage: DealStage | null;
  lineId: string | null;
  standaloneId: string | null;
  companyId: string;
  companyName: string;
  contactId: string | null;
  recipientLabel: string;
  product: string;
  brand: string;
  sampleQty: number;
  unit: Unit;
  sentAt: string;
  returnedAt: string | null;
  returnStatus: SampleReturnStatus;
  daysWithCustomer: number;
  tone: SampleCustodyTone;
  verdictLabel: string;
  verdictTone: SampleVerdictTone;
  dealAlertNote: string | null;
  handoverNote: string;
  returnNote: string;
  followUpActivityId: string | null;
  followUpTask: Activity | null;
  owner: string;
  owner_id: string | null;
};

const DAY_MS = 86_400_000;

/** Normalize nullable DB custody fields into a clean SampleReturnStatus. */
export function effectiveSampleReturnStatus(
  status?: SampleReturnStatus | CustomerSampleStatus | null,
  returnedAt?: string | null,
): SampleReturnStatus {
  if (status === "consumable") return "consumable";
  if (status === "returned" || Boolean(returnedAt)) return "returned";
  return "out";
}

/**
 * Sensible sample quantity fallback for legacy deal_lines rows sampled before
 * `sample_qty` existed: small quantities (<= 5) were usually sample counts,
 * whereas large numbers (e.g. 200 dessert spoons) are quotation quantities.
 */
export function defaultSampleQtyForLine(line: LineItem): number {
  const explicit = line.sample?.sampleQty;
  if (typeof explicit === "number" && Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }
  if (line.quantity > 0 && line.quantity <= 5) {
    return line.quantity;
  }
  return 1;
}

/**
 * Whole days the sample has been with the customer.
 * While out, ticks against `now`. Once returned, freezes at `returnedAt - sentAt`.
 */
export function sampleDaysWithCustomer(
  sentAt: string,
  returnedAt?: string | null,
  now = Date.now(),
): number {
  const start = new Date(sentAt).getTime();
  if (!Number.isFinite(start)) return 0;
  const end = returnedAt ? new Date(returnedAt).getTime() : now;
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, Math.floor((end - start) / DAY_MS));
}

export function sampleCustodyTone(
  daysWithCustomer: number,
  returnStatus: SampleReturnStatus,
): SampleCustodyTone {
  if (returnStatus === "returned") return "returned";
  if (returnStatus === "consumable") return "consumable";
  if (daysWithCustomer >= SAMPLE_OVERDUE_DAYS) return "out-overdue";
  if (daysWithCustomer >= SAMPLE_FOLLOWUP_DAYS) return "out-followup";
  return "out-fresh";
}

/** Default follow-up due date (+7 days from handover date) in YYYY-MM-DD local format. */
export function defaultSampleFollowUpDateInput(sentDateInput: string): string {
  const base = sentDateInput
    ? new Date(`${sentDateInput}T09:00:00`)
    : new Date();
  const due = new Date(
    (Number.isFinite(base.getTime()) ? base.getTime() : Date.now()) +
      SAMPLE_FOLLOWUP_DAYS * DAY_MS,
  );
  return toDateInputValue(due.toISOString());
}

/** Format an ISO timestamp into `<input type="date">` YYYY-MM-DD value. */
export function toDateInputValue(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  if (!Number.isFinite(d.getTime())) {
    const fallback = new Date();
    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, "0")}-${String(fallback.getDate()).padStart(2, "0")}`;
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Convert `<input type="date">` YYYY-MM-DD into a stable midday ISO string so timezone shifts never flip the calendar day. */
export function dateInputToIso(dateInput: string, fallbackIso?: string): string {
  const trimmed = dateInput.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return fallbackIso ?? new Date().toISOString();
  }
  return new Date(`${trimmed}T12:00:00`).toISOString();
}

export function formatSampleDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Build the unified Sample Register ledger across all Deals and Standalone
 * Customer Samples, sorted with active longest-held samples first, then most
 * recently returned samples.
 */
export function buildSampleLedger({
  deals,
  customerSamples,
  companies,
  contacts,
  activities,
  now = Date.now(),
}: {
  deals: Deal[];
  customerSamples: CustomerSample[];
  companies: Company[];
  contacts: Contact[];
  activities: Activity[];
  now?: number;
}): SampleLedgerEntry[] {
  const companyMap = new Map(companies.map((c) => [c.id, c]));
  const contactMap = new Map(contacts.map((c) => [c.id, c]));
  const activityMap = new Map(activities.map((a) => [a.id, a]));

  const entries: SampleLedgerEntry[] = [];

  // 1) Deal line-item samples across ALL deal stages (never hidden on Won/Lost!)
  for (const deal of deals) {
    const company = companyMap.get(deal.companyId);
    const dealContact =
      (deal.currentContactId ? contactMap.get(deal.currentContactId) : undefined) ??
      (deal.enquiryFromId ? contactMap.get(deal.enquiryFromId) : undefined);

    for (const line of deal.lines) {
      if (!line.sample?.sentAt) continue;
      const s = line.sample;
      const returnStatus = effectiveSampleReturnStatus(
        s.returnStatus,
        s.returnedAt,
      );
      const daysWithCustomer = sampleDaysWithCustomer(
        s.sentAt,
        s.returnedAt,
        now,
      );
      const tone = sampleCustodyTone(daysWithCustomer, returnStatus);

      const fallbackRecipient = dealContact
        ? `${dealContact.name}${dealContact.role ? ` · ${dealContact.role}` : ""}`
        : company?.contactName
          ? `${company.contactName}${company.contactRole ? ` · ${company.contactRole}` : ""}`
          : "Customer contact";

      let verdictLabel = "Awaiting feedback";
      let verdictTone: SampleVerdictTone = "pending";
      if (line.status === "approved" || deal.stage === "won") {
        if (line.status === "rejected") {
          verdictLabel = line.rejectReason
            ? `Rejected · ${line.rejectReason}`
            : "Rejected";
          verdictTone = "rejected";
        } else {
          verdictLabel = "Approved";
          verdictTone = "approved";
        }
      } else if (line.status === "rejected" || deal.stage === "lost") {
        verdictLabel = line.rejectReason
          ? `Rejected · ${line.rejectReason}`
          : deal.lostReason
            ? `Lost · ${deal.lostReason}`
            : "Rejected";
        verdictTone = "rejected";
      } else if (s.feedbackAt) {
        verdictLabel = s.feedback ? `Feedback: ${s.feedback}` : "Feedback received";
        verdictTone = "approved";
      }

      let dealAlertNote: string | null = null;
      if (returnStatus === "out" && deal.stage === "won") {
        dealAlertNote = "Deal Won — sample still at customer!";
      } else if (returnStatus === "out" && deal.stage === "lost") {
        dealAlertNote = "Deal Lost — collect sample back!";
      }

      const linkedTask = s.followUpActivityId
        ? activityMap.get(s.followUpActivityId) ?? null
        : null;

      entries.push({
        key: `deal:${deal.id}:${line.id}`,
        source: "deal",
        dealId: deal.id,
        dealTitle: deal.title,
        dealStage: deal.stage,
        lineId: line.id,
        standaloneId: null,
        companyId: deal.companyId,
        companyName: company?.name ?? deal.company,
        contactId: dealContact?.id ?? null,
        recipientLabel: s.recipient?.trim() || fallbackRecipient,
        product: line.product,
        brand: line.brand,
        sampleQty: defaultSampleQtyForLine(line),
        unit: line.unit,
        sentAt: s.sentAt,
        returnedAt: s.returnedAt ?? null,
        returnStatus,
        daysWithCustomer,
        tone,
        verdictLabel,
        verdictTone,
        dealAlertNote,
        handoverNote: s.handoverNote ?? s.feedback ?? "",
        returnNote: s.returnNote ?? "",
        followUpActivityId: s.followUpActivityId ?? null,
        followUpTask: linkedTask,
        owner: deal.owner,
        owner_id: deal.owner_id ?? null,
      });
    }
  }

  // 2) Standalone Customer samples (given without a Deal)
  for (const cs of customerSamples) {
    if (cs.returnStatus === "cancelled") continue;
    const company = companyMap.get(cs.companyId);
    const contact = cs.contactId ? contactMap.get(cs.contactId) : undefined;
    const returnStatus = effectiveSampleReturnStatus(
      cs.returnStatus,
      cs.returnedAt,
    );
    const daysWithCustomer = sampleDaysWithCustomer(
      cs.sentAt,
      cs.returnedAt,
      now,
    );
    const tone = sampleCustodyTone(daysWithCustomer, returnStatus);

    const fallbackRecipient = contact
      ? `${contact.name}${contact.role ? ` · ${contact.role}` : ""}`
      : company?.contactName
        ? `${company.contactName}${company.contactRole ? ` · ${company.contactRole}` : ""}`
        : "Customer contact";

    const verdictTone: SampleVerdictTone =
      cs.verdict === "approved"
        ? "approved"
        : cs.verdict === "rejected"
          ? "rejected"
          : "pending";
    const verdictLabel =
      cs.verdict === "approved"
        ? "Approved"
        : cs.verdict === "rejected"
          ? "Not selected"
          : "Standalone trial";

    const linkedTask = cs.followUpActivityId
      ? activityMap.get(cs.followUpActivityId) ?? null
      : null;

    entries.push({
      key: `standalone:${cs.id}`,
      source: "standalone",
      dealId: null,
      dealTitle: null,
      dealStage: null,
      lineId: null,
      standaloneId: cs.id,
      companyId: cs.companyId,
      companyName: company?.name ?? cs.companyId,
      contactId: cs.contactId,
      recipientLabel: cs.recipientName.trim() || fallbackRecipient,
      product: cs.product,
      brand: cs.brand,
      sampleQty: cs.sampleQty > 0 ? cs.sampleQty : 1,
      unit: cs.unit,
      sentAt: cs.sentAt,
      returnedAt: cs.returnedAt,
      returnStatus,
      daysWithCustomer,
      tone,
      verdictLabel,
      verdictTone,
      dealAlertNote: null,
      handoverNote: cs.handoverNote,
      returnNote: cs.returnNote,
      followUpActivityId: cs.followUpActivityId,
      followUpTask: linkedTask,
      owner: cs.owner || company?.owner || "",
      owner_id: cs.owner_id ?? company?.owner_id ?? null,
    });
  }

  return entries.sort((a, b) => {
    // Active 'out' samples come first, oldest (most days held) at the top.
    const aOut = a.returnStatus === "out" ? 0 : a.returnStatus === "consumable" ? 1 : 2;
    const bOut = b.returnStatus === "out" ? 0 : b.returnStatus === "consumable" ? 1 : 2;
    if (aOut !== bOut) return aOut - bOut;
    if (a.returnStatus === "out" && b.returnStatus === "out") {
      return b.daysWithCustomer - a.daysWithCustomer;
    }
    const aRef = new Date(a.returnedAt ?? a.sentAt).getTime();
    const bRef = new Date(b.returnedAt ?? b.sentAt).getTime();
    return bRef - aRef;
  });
}

export type SampleRegisterStats = {
  outCount: number;
  overdueCount: number;
  followUpWindowCount: number;
  awaitingFeedbackCount: number;
  returnedCount: number;
  consumableCount: number;
  avgDaysHeld: number;
};

export function computeSampleRegisterStats(
  entries: SampleLedgerEntry[],
): SampleRegisterStats {
  let outCount = 0;
  let overdueCount = 0;
  let followUpWindowCount = 0;
  let awaitingFeedbackCount = 0;
  let returnedCount = 0;
  let consumableCount = 0;
  let returnedDaysSum = 0;

  for (const e of entries) {
    if (e.returnStatus === "out") {
      outCount++;
      if (e.daysWithCustomer >= SAMPLE_OVERDUE_DAYS) overdueCount++;
      else if (e.daysWithCustomer >= SAMPLE_FOLLOWUP_DAYS) followUpWindowCount++;
    } else if (e.returnStatus === "returned") {
      returnedCount++;
      returnedDaysSum += e.daysWithCustomer;
    } else if (e.returnStatus === "consumable") {
      consumableCount++;
    }

    if (e.verdictTone === "pending" && e.returnStatus !== "returned") {
      awaitingFeedbackCount++;
    }
  }

  return {
    outCount,
    overdueCount,
    followUpWindowCount,
    awaitingFeedbackCount,
    returnedCount,
    consumableCount,
    avgDaysHeld:
      returnedCount > 0 ? Math.round(returnedDaysSum / returnedCount) : 0,
  };
}

/** Bundled demo standalone samples (used only when Supabase is not configured). */
export const DEMO_CUSTOMER_SAMPLES: CustomerSample[] = [
  {
    id: "SM-DEMO-1",
    companyId: "C-101",
    contactId: null,
    product: "Porcelain Show Plate 30cm",
    brand: "Rak Porcelain",
    sampleQty: 2,
    unit: "Pcs",
    sentAt: new Date(Date.now() - 16 * DAY_MS).toISOString(),
    returnedAt: null,
    returnStatus: "out",
    verdict: "pending",
    recipientName: "Executive Chef · Cold visit trial",
    handoverNote: "Left 2 sample plates during cold introduction visit",
    returnNote: "",
    followUpActivityId: null,
    owner: "Bishal Karma",
    owner_id: null,
    created_by: null,
    createdAt: new Date(Date.now() - 16 * DAY_MS).toISOString(),
    updatedAt: new Date(Date.now() - 16 * DAY_MS).toISOString(),
  },
];
