/**
 * Translation between database rows (snake_case) and app models (camelCase).
 *
 * Isolated here so components never see database shapes, and so a column
 * rename only ever touches this one file.
 */

import type {
  Company,
  ContactRole,
  Emirate,
  BusinessType,
  CompanyType,
  LeadStatus,
  LeadSource,
} from "./companies";
import type { Contact } from "./contacts";
import type { Activity, ActivityType } from "./activities";
import type { Deal, DealPriority, AccountType } from "./deals";
import type {
  ActivePeriod,
  ContactTrailEntry,
  LineItem,
  LineStatus,
  LostReason,
  Unit,
} from "./deal-model";
import type { DealStage } from "./pipeline";
import type { SpancopStage, StageTransition } from "./spancop";
import type { CurrencyCode } from "./currency";

/* ------------------------------------------------------------------ */
/* Row shapes                                                          */
/* ------------------------------------------------------------------ */

export type CompanyRow = {
  id: string;
  name: string;
  cluster: string | null;
  emirate: string;
  area: string;
  lat: number | null;
  lng: number | null;
  business: string;
  type: string;
  contact_name: string;
  contact_role: string;
  email: string | null;
  phone: string;
  whatsapp_same_as_phone: boolean;
  owner: string;
  lead_source: string;
  remarks: string;
  spancop: string;
  spancop_since: string;
  lead_status: string;
  next_follow_up: string | null;
  activity_count: number;
  last_activity_at: string | null;
  has_purchase_order: boolean;
  awaiting_payment: boolean;
  has_ever_ordered: boolean;
  last_order_at: string | null;
  lifetime_value: number | string;
  created_at: string;
};

export type ContactRow = {
  id: string;
  company_id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string;
  whatsapp_same_as_phone: boolean;
  is_primary: boolean;
  is_decision_maker: boolean;
  notes: string;
  created_at: string;
};

export type DealLineRow = {
  id: string;
  deal_id: string;
  product: string;
  brand: string;
  quantity: number | string;
  unit: string;
  unit_price: number | string;
  status: string;
  reject_reason: string | null;
  position: number;
};

export type DealRow = {
  id: string;
  title: string;
  category: string;
  company_id: string;
  company_name: string;
  account_type: string;
  enquiry_from_id: string | null;
  current_contact_id: string | null;
  contact_trail: ContactTrailEntry[] | null;
  value: number | string;
  currency: string;
  stage: string;
  closed_from_stage: string | null;
  probability: number | null;
  on_hold: boolean;
  owner: string;
  city: string;
  priority: string;
  tags: string[] | null;
  req_date: string | null;
  expected_close_date: string | null;
  last_activity_at: string;
  lost_reason: string | null;
  lost_note: string | null;
  next_action: string;
  task: string;
  task_due_date: string | null;
  task_done: boolean;
  remarks: string;
  sample_sent_at: string | null;
  sample_feedback_at: string | null;
  sample_feedback: string | null;
  periods: ActivePeriod[] | null;
  po_number: string | null;
  po_date: string | null;
  delivered_at: string | null;
  partial_delivery: boolean | null;
  delivery_note: string | null;
  paid_at: string | null;
  amount_received: number | string | null;
  created_at: string;
  deal_lines?: DealLineRow[];
};

export type TransitionRow = {
  id: string;
  company_id: string;
  from_stage: string | null;
  to_stage: string;
  trigger: string;
  reason: string;
  at: string;
  by_user: string;
};

/** Postgres numerics arrive as strings; coerce defensively. */
const num = (v: number | string | null | undefined) =>
  v === null || v === undefined ? 0 : typeof v === "number" ? v : Number(v);

/* ------------------------------------------------------------------ */
/* Row -> model                                                        */
/* ------------------------------------------------------------------ */

export function toCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    cluster: row.cluster,
    emirate: row.emirate as Emirate,
    area: row.area,
    coordinates:
      row.lat !== null && row.lng !== null
        ? { lat: row.lat, lng: row.lng }
        : undefined,
    business: row.business as BusinessType,
    type: row.type as CompanyType,
    contactName: row.contact_name,
    contactRole: row.contact_role as ContactRole,
    email: row.email,
    phone: row.phone,
    whatsappSameAsPhone: row.whatsapp_same_as_phone,
    owner: row.owner,
    leadSource: row.lead_source as LeadSource,
    remarks: row.remarks,
    spancop: row.spancop as SpancopStage,
    spancopSince: row.spancop_since,
    leadStatus: row.lead_status as LeadStatus,
    nextFollowUp: row.next_follow_up,
    activityCount: row.activity_count,
    lastActivityAt: row.last_activity_at,
    openDealIds: [], // filled in by the provider once deals load
    hasPurchaseOrder: row.has_purchase_order,
    awaitingPayment: row.awaiting_payment,
    hasEverOrdered: row.has_ever_ordered,
    lastOrderAt: row.last_order_at,
    lifetimeValue: num(row.lifetime_value),
    createdAt: row.created_at,
  };
}

export function toContact(row: ContactRow): Contact {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    role: row.role as ContactRole,
    email: row.email,
    phone: row.phone,
    whatsappSameAsPhone: row.whatsapp_same_as_phone,
    isPrimary: row.is_primary,
    isDecisionMaker: row.is_decision_maker,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function toLineItem(row: DealLineRow): LineItem {
  return {
    id: row.id,
    product: row.product,
    brand: row.brand,
    quantity: num(row.quantity),
    unit: row.unit as Unit,
    unitPrice: num(row.unit_price),
    status: row.status as LineStatus,
    rejectReason: (row.reject_reason as LostReason) ?? undefined,
  };
}

export function toDeal(row: DealRow): Deal {
  const lines = (row.deal_lines ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(toLineItem);

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    company: row.company_name,
    companyId: row.company_id,
    accountType: row.account_type as AccountType,
    enquiryFromId: row.enquiry_from_id ?? "",
    currentContactId: row.current_contact_id ?? "",
    contactTrail: row.contact_trail ?? [],
    lines,
    value: num(row.value),
    currency: row.currency as CurrencyCode,
    stage: row.stage as DealStage,
    closedFromStage: (row.closed_from_stage as DealStage) ?? undefined,
    probability: row.probability,
    owner: row.owner,
    city: row.city,
    expectedCloseDate: row.expected_close_date ?? row.created_at,
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
    priority: row.priority as DealPriority,
    tags: row.tags ?? [],
    lostReason: (row.lost_reason as LostReason) ?? undefined,
    lostNote: row.lost_note ?? undefined,
    onHold: row.on_hold,
    reqDate: row.req_date,
    nextAction: row.next_action,
    task: row.task,
    taskDueDate: row.task_due_date,
    taskDone: row.task_done,
    remarks: row.remarks,
    sample: row.sample_sent_at
      ? {
          sentAt: row.sample_sent_at,
          feedbackAt: row.sample_feedback_at,
          feedback: row.sample_feedback,
        }
      : null,
    periods: row.periods ?? [{ openedAt: row.created_at, closedAt: null }],
    /* Columns added by supabase/04-order-fulfilment.sql. Read defensively so
       the app still loads against a database where the migration has not been
       run yet — the fields simply come back empty. */
    fulfilment: {
      poNumber: row.po_number ?? null,
      poDate: row.po_date ?? null,
      deliveredAt: row.delivered_at ?? null,
      partialDelivery: row.partial_delivery ?? false,
      deliveryNote: row.delivery_note ?? null,
      paidAt: row.paid_at ?? null,
      amountReceived: num(row.amount_received ?? 0),
    },
  };
}

export function toTransition(row: TransitionRow): StageTransition {
  return {
    id: row.id,
    companyId: row.company_id,
    from: (row.from_stage as SpancopStage) ?? null,
    to: row.to_stage as SpancopStage,
    trigger: row.trigger as StageTransition["trigger"],
    reason: row.reason,
    at: row.at,
    by: row.by_user,
  };
}

/* ------------------------------------------------------------------ */
/* Model -> row (writes, used from stage 3)                            */
/* ------------------------------------------------------------------ */

export function fromCompany(c: Company) {
  return {
    id: c.id,
    name: c.name,
    cluster: c.cluster,
    emirate: c.emirate,
    area: c.area,
    lat: c.coordinates?.lat ?? null,
    lng: c.coordinates?.lng ?? null,
    business: c.business,
    type: c.type,
    contact_name: c.contactName,
    contact_role: c.contactRole,
    email: c.email,
    phone: c.phone,
    whatsapp_same_as_phone: c.whatsappSameAsPhone,
    owner: c.owner,
    lead_source: c.leadSource,
    remarks: c.remarks,
    spancop: c.spancop,
    spancop_since: c.spancopSince,
    lead_status: c.leadStatus,
    next_follow_up: c.nextFollowUp,
    activity_count: c.activityCount,
    last_activity_at: c.lastActivityAt,
    has_purchase_order: c.hasPurchaseOrder,
    awaiting_payment: c.awaitingPayment,
    has_ever_ordered: c.hasEverOrdered,
    last_order_at: c.lastOrderAt,
    lifetime_value: c.lifetimeValue,
    created_at: c.createdAt,
  };
}

export function fromContact(p: Contact) {
  return {
    id: p.id,
    company_id: p.companyId,
    name: p.name,
    role: p.role,
    email: p.email,
    phone: p.phone,
    whatsapp_same_as_phone: p.whatsappSameAsPhone,
    is_primary: p.isPrimary,
    is_decision_maker: p.isDecisionMaker,
    notes: p.notes,
    created_at: p.createdAt,
  };
}

export function fromDeal(d: Deal) {
  return {
    id: d.id,
    title: d.title,
    category: d.category,
    company_id: d.companyId,
    company_name: d.company,
    account_type: d.accountType,
    enquiry_from_id: d.enquiryFromId || null,
    current_contact_id: d.currentContactId || null,
    contact_trail: d.contactTrail,
    value: d.value,
    currency: d.currency,
    stage: d.stage,
    closed_from_stage: d.closedFromStage ?? null,
    probability: d.probability,
    on_hold: d.onHold,
    owner: d.owner,
    city: d.city,
    priority: d.priority,
    tags: d.tags,
    req_date: d.reqDate,
    expected_close_date: d.expectedCloseDate,
    last_activity_at: d.lastActivityAt,
    lost_reason: d.lostReason ?? null,
    lost_note: d.lostNote ?? null,
    next_action: d.nextAction,
    task: d.task,
    task_due_date: d.taskDueDate,
    task_done: d.taskDone,
    remarks: d.remarks,
    sample_sent_at: d.sample?.sentAt ?? null,
    sample_feedback_at: d.sample?.feedbackAt ?? null,
    sample_feedback: d.sample?.feedback ?? null,
    periods: d.periods,
    po_number: d.fulfilment.poNumber,
    po_date: d.fulfilment.poDate,
    delivered_at: d.fulfilment.deliveredAt,
    partial_delivery: d.fulfilment.partialDelivery,
    delivery_note: d.fulfilment.deliveryNote,
    paid_at: d.fulfilment.paidAt,
    amount_received: d.fulfilment.amountReceived,
    created_at: d.createdAt,
  };
}

export function fromLineItem(line: LineItem, dealId: string, position: number) {
  return {
    id: line.id,
    deal_id: dealId,
    product: line.product,
    brand: line.brand,
    quantity: line.quantity,
    unit: line.unit,
    unit_price: line.unitPrice,
    status: line.status,
    reject_reason: line.rejectReason ?? null,
    position,
  };
}

export function fromTransition(t: StageTransition) {
  return {
    id: t.id,
    company_id: t.companyId,
    from_stage: t.from,
    to_stage: t.to,
    trigger: t.trigger,
    reason: t.reason,
    at: t.at,
    by_user: t.by,
  };
}

/* ------------------------------------------------------------------ */
/* Activities                                                          */
/* ------------------------------------------------------------------ */

export type ActivityRow = {
  id: string;
  company_id: string;
  contact_id: string | null;
  deal_id: string | null;
  type: string;
  report: string;
  occurred_at: string;
  task: string | null;
  task_due_at: string | null;
  task_done: boolean;
  remind: boolean;
  owner: string;
  created_at: string;
};

export function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    companyId: row.company_id,
    contactId: row.contact_id,
    dealId: row.deal_id,
    type: row.type as ActivityType,
    report: row.report,
    occurredAt: row.occurred_at,
    task: row.task,
    taskDueAt: row.task_due_at,
    taskDone: row.task_done,
    remind: row.remind,
    owner: row.owner,
    createdAt: row.created_at,
  };
}

export function fromActivity(a: Activity) {
  return {
    id: a.id,
    company_id: a.companyId,
    contact_id: a.contactId,
    deal_id: a.dealId,
    type: a.type,
    report: a.report,
    occurred_at: a.occurredAt,
    // The DB constraint rejects a due date or reminder without a task.
    task: a.task,
    task_due_at: a.task ? a.taskDueAt : null,
    task_done: a.taskDone,
    remind: a.task ? a.remind : false,
    owner: a.owner,
    created_at: a.createdAt,
  };
}
