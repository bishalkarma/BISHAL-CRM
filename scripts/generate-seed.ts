/**
 * Generates `supabase/02-seed.sql` from the app's own demo data.
 *
 * Written as a generator rather than hand-typed SQL so the seed can never
 * drift from the TypeScript models — regenerate and the two stay in step.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { COMPANIES, STAGE_TRANSITIONS } from "../src/lib/companies";
import { CONTACTS } from "../src/lib/contacts";
import { DEALS } from "../src/lib/deals";

/** Single-quote escaping, with NULL for absent values. */
const q = (v: string | null | undefined) =>
  v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;

const n = (v: number | null | undefined) =>
  v === null || v === undefined ? "NULL" : String(v);

const b = (v: boolean) => (v ? "true" : "false");

const ts = (v: string | null | undefined) => (v ? `'${v}'::timestamptz` : "NULL");

const json = (v: unknown) =>
  `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;

const arr = (v: string[]) =>
  v.length === 0
    ? "'{}'"
    : `ARRAY[${v.map((x) => q(x)).join(",")}]::text[]`;

const lines: string[] = [];

lines.push(`-- ============================================================
--  Bishal Sales CRM — seed data
--  Stage 2b · run AFTER 01-schema.sql
--
--  Generated from the app's demo data, so the two cannot drift apart.
--  Safe to re-run: clears these tables first, then reloads.
-- ============================================================

-- Order matters: children before parents.
delete from deal_lines;
delete from stage_transitions;
delete from activities;
delete from deals;
delete from contacts;
delete from companies;
`);

// ---- companies ------------------------------------------------------
lines.push(`\n-- ${COMPANIES.length} companies`);
lines.push(`insert into companies (
  id, name, cluster, emirate, area, lat, lng, business, type,
  contact_name, contact_role, email, phone, whatsapp_same_as_phone,
  owner, lead_source, remarks,
  spancop, spancop_since, lead_status, next_follow_up,
  activity_count, last_activity_at, has_purchase_order, awaiting_payment,
  has_ever_ordered, last_order_at, lifetime_value, created_at
) values`);

lines.push(
  COMPANIES.map((c) =>
    `  (${[
      q(c.id),
      q(c.name),
      q(c.cluster),
      q(c.emirate),
      q(c.area),
      n(c.coordinates?.lat),
      n(c.coordinates?.lng),
      q(c.business),
      q(c.type),
      q(c.contactName),
      q(c.contactRole),
      q(c.email),
      q(c.phone),
      b(c.whatsappSameAsPhone),
      q(c.owner),
      q(c.leadSource),
      q(c.remarks),
      q(c.spancop),
      ts(c.spancopSince),
      q(c.leadStatus),
      ts(c.nextFollowUp),
      n(c.activityCount),
      ts(c.lastActivityAt),
      b(c.hasPurchaseOrder),
      b(c.awaitingPayment),
      b(c.hasEverOrdered),
      ts(c.lastOrderAt),
      n(c.lifetimeValue),
      ts(c.createdAt),
    ].join(", ")})`,
  ).join(",\n") + ";",
);

// ---- contacts -------------------------------------------------------
lines.push(`\n-- ${CONTACTS.length} contacts`);
lines.push(`insert into contacts (
  id, company_id, name, role, email, phone, whatsapp_same_as_phone,
  is_primary, is_decision_maker, notes, created_at
) values`);

lines.push(
  CONTACTS.map((p) =>
    `  (${[
      q(p.id),
      q(p.companyId),
      q(p.name),
      q(p.role),
      q(p.email),
      q(p.phone),
      b(p.whatsappSameAsPhone),
      b(p.isPrimary),
      b(p.isDecisionMaker),
      q(p.notes),
      ts(p.createdAt),
    ].join(", ")})`,
  ).join(",\n") + ";",
);

// ---- deals ----------------------------------------------------------
lines.push(`\n-- ${DEALS.length} deals`);
lines.push(`insert into deals (
  id, title, category, company_id, company_name, account_type,
  enquiry_from_id, current_contact_id, contact_trail,
  value, currency, stage, closed_from_stage, probability, on_hold,
  owner, city, priority, tags,
  req_date, expected_close_date, last_activity_at,
  lost_reason, lost_note,
  next_action, task, task_due_date, task_done, remarks,
  sample_sent_at, sample_feedback_at, sample_feedback,
  periods, created_at
) values`);

lines.push(
  DEALS.map((d) =>
    `  (${[
      q(d.id),
      q(d.title),
      q(d.category),
      q(d.companyId),
      q(d.company),
      q(d.accountType),
      q(d.enquiryFromId),
      q(d.currentContactId),
      json(d.contactTrail),
      n(d.value),
      q(d.currency),
      q(d.stage),
      q(d.closedFromStage),
      n(d.probability),
      b(d.onHold),
      q(d.owner),
      q(d.city),
      q(d.priority),
      arr(d.tags),
      ts(d.reqDate),
      ts(d.expectedCloseDate),
      ts(d.lastActivityAt),
      q(d.lostReason),
      q(d.lostNote),
      q(d.nextAction),
      q(d.task),
      ts(d.taskDueDate),
      b(d.taskDone),
      q(d.remarks),
      ts(d.sample?.sentAt),
      ts(d.sample?.feedbackAt),
      q(d.sample?.feedback),
      json(d.periods),
      ts(d.createdAt),
    ].join(", ")})`,
  ).join(",\n") + ";",
);

// ---- deal lines -----------------------------------------------------
const allLines = DEALS.flatMap((d) =>
  d.lines.map((l, i) => ({ deal: d.id, line: l, pos: i })),
);

lines.push(`\n-- ${allLines.length} line items`);
lines.push(`insert into deal_lines (
  id, deal_id, product, brand, quantity, unit, unit_price,
  status, reject_reason, position
) values`);

lines.push(
  allLines.map(({ deal, line, pos }) =>
    `  (${[
      q(line.id),
      q(deal),
      q(line.product),
      q(line.brand),
      n(line.quantity),
      q(line.unit),
      n(line.unitPrice),
      q(line.status),
      q(line.rejectReason),
      n(pos),
    ].join(", ")})`,
  ).join(",\n") + ";",
);

// ---- stage transitions ----------------------------------------------
lines.push(`\n-- ${STAGE_TRANSITIONS.length} stage transitions (SPANCOP history)`);
lines.push(`insert into stage_transitions (
  id, company_id, from_stage, to_stage, trigger, reason, at, by_user
) values`);

lines.push(
  STAGE_TRANSITIONS.map((t) =>
    `  (${[
      q(t.id),
      q(t.companyId),
      q(t.from),
      q(t.to),
      q(t.trigger),
      q(t.reason),
      ts(t.at),
      q(t.by),
    ].join(", ")})`,
  ).join(",\n") + ";",
);

lines.push(`
-- ============================================================
--  Verify — this should return the row counts below.
-- ============================================================
select 'companies' as table_name, count(*) from companies
union all select 'contacts',          count(*) from contacts
union all select 'deals',             count(*) from deals
union all select 'deal_lines',        count(*) from deal_lines
union all select 'stage_transitions', count(*) from stage_transitions
order by table_name;

-- Expected:
--   companies          ${COMPANIES.length}
--   contacts           ${CONTACTS.length}
--   deal_lines         ${allLines.length}
--   deals              ${DEALS.length}
--   stage_transitions  ${STAGE_TRANSITIONS.length}
`);

mkdirSync("supabase", { recursive: true });
writeFileSync("supabase/02-seed.sql", lines.join("\n"));

console.log("Generated supabase/02-seed.sql");
console.log(`  companies         ${COMPANIES.length}`);
console.log(`  contacts          ${CONTACTS.length}`);
console.log(`  deals             ${DEALS.length}`);
console.log(`  deal_lines        ${allLines.length}`);
console.log(`  stage_transitions ${STAGE_TRANSITIONS.length}`);
