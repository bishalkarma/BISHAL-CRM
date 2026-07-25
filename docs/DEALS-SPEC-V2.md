# Deals — Agreed Spec (v2)

**Discussion only. Nothing built until you say go.**

---

## Locked

| Decision | Outcome |
| --- | --- |
| Structure | **Option B** — one deal per enquiry, products as line items |
| `78 days` | **Deal ageing** = today − created date. Auto, counts up |
| Units | **Pcs** |
| **Cost & margin** | ❌ **Dropped** |
| Next action / Task | Separate fields, both logged to the customer activity log |
| Lost reasons | Budget Constraint · Item not in scope · Lead time · Query Cancelled |
| Brand | Entered **per line at creation** — records what we quoted |
| Extra fields | Live in the **deal detail view**, not the list |
| Sample tracking | **Hidden** until Sampling stage, then appears |
| Lost reason | **Hidden** until Lost; then required, and **editable** after |
| Current contact | Updates **automatically** — no prompt |
| Reopening a lost deal | Supported — drag back to any open stage |

---

## 1. The contact journey — my read of your example

Your example, restated:

1. **Housekeeper** gives us the query → deal created against the housekeeper
2. We then approach the **Purchasing Manager**
3. Activity logged with the Purchasing Manager
4. The deal is now effectively *with* the Purchasing Manager

So the contact on a deal is **not one fixed person** — it moves. But the
housekeeper must not be erased, because they are the reason the deal exists.

### Therefore: two contact fields, not one

| Field | Meaning | Changes? |
| --- | --- | --- |
| **Enquiry from** | Who brought us this query | 🔒 Locked at creation — never changes |
| **Current contact** | Who we are dealing with now | ✅ Moves as the deal progresses |

Plus a **contact trail** — everyone the deal has touched, in order:

```
Enquiry from      Ms. Reena · Housekeeper        12 Feb  (origin)
Current contact   Mr. Ankit · Purchasing Manager 19 Feb  (active)
```

### Why keeping "Enquiry from" matters

Over a year you can ask: *"who actually feeds us business?"*

> Ms. Reena (Housekeeper) — **5 enquiries**, 3 won, AED 180K
> She never signs anything, but she is one of your most valuable relationships.

Without this field that insight is invisible, because the Purchasing Manager
gets the credit for every deal.

### How the current contact moves — DECIDED ✅

**Automatic.** Logging an activity against a different contact at the same
company moves the current contact to that person and appends to the trail.
No prompt.

`Enquiry from` is never touched — it stays as the original requester so the
"who feeds us business" report stays accurate.

---

## 2. Progressive disclosure — fields appear when they are relevant

The deal form stays short. The **detail view** grows as the deal advances.

Stage-specific blocks are **hidden entirely** until the stage is reached — no
greyed-out placeholders, no padlocks. The panel simply grows.

| Stage | What appears |
| --- | --- |
| Lead → Quotation | Line items, brand, unit price, ageing, next action, task |
| Negotiation | *(unchanged)* |
| **Sampling** | **Sample tracking** appears — sent date, feedback, days to respond |
| **Won** | Won details |
| **Lost** | **Lost reason** appears — required before the move is allowed |
| Any stage | **On hold** toggle |

---

## 3. Moving a deal to Lost

Dragging a deal to **Lost** opens a required prompt — the deal cannot land in
Lost without a reason:

```
Why was this deal lost?

  ( ) Budget Constraint
  ( ) Item not in scope
  ( ) Lead time
  ( ) Query Cancelled

  Notes (optional) ______________________

  [ Cancel ]              [ Mark as lost ]
```

*Mark as lost* stays disabled until a reason is chosen. The reason is written to
the deal, the activity log, and becomes reportable: *"37% of losses were lead
time."*

### Editable, and reversible

- The lost reason can be **edited** afterwards — a wrong selection is fixable.
- A lost deal can be **reopened** by dragging it back to any open stage
  (Quotation, Sampling, …). This already works in the pipeline board.

**Reopening happens.** A competitor fails to deliver and the enquiry comes back.

### What reopening does

| Effect | Behaviour |
| --- | --- |
| Deal stage | Returns to whichever open stage you drop it on |
| Lost reason | **Kept in history**, cleared from the active record |
| SPANCOP | Company returns to **Negotiate** automatically — the "any open deal wins" rule already covers this |
| Loss reporting | The original loss stays counted for the period it happened in |

### ⚠️ One consequence — deal ageing

Ageing is `today − created`. A deal created 120 days ago, lost at day 60 and
reopened today would read **"120 days"** and be flagged as badly rotten, even
though it is a fresh opportunity.

Options:

- **(a)** Keep total ageing from original creation — honest, but flags every
  reopened deal as stale
- **(b)** Show both — *"Reopened 2 days ago · 120 days total"* ⭐
- **(c)** Reset ageing on reopen — clean, but hides real history

*Recommendation: **(b)**. Rotting alerts use the reopened date so a revived deal
isn't instantly red, while the full history stays visible.*

**Still open:** should **Won** ask for anything (PO reference / confirmed
value), or be a single click?

---

## 4. Where each field lives

### Create form — short
`Company *` (locked picker) · `Enquiry from *` (contact picker) ·
`Title / enquiry *` · `REQ DATE` · `Owner` · `Priority`
**Line items:** `Product *` · `Brand` · `Qty (Pcs) *` · `Unit price` · line total (auto)

### Detail view — everything
Header: serial · title · company · **enquiry from** + **current contact** ·
ageing · On hold toggle · deal value
Line items with per-line status (Quoted / Approved / Rejected)
`Next action` (latest client update) · `Task` + due date + done tick · `Remarks`
Stage-gated: sample tracking, lost reason, won details
Activity timeline for this deal

---

## 5. Still open

1. **Reopened deal ageing** — total (a), both (b) ⭐, or reset (c)?
2. **Won** — ask for a PO reference, or one click?
