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
| Sample tracking | Unlocks **only** at Sampling stage |
| Lost reason | Hidden until Lost, then **prompted and required** |

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

### How the current contact moves — a question for you

When an activity is logged against a different contact at the same company:

- **(a)** Update the current contact **automatically**, and record it in the trail
- **(b)** **Suggest** it — *"You logged a call with Mr. Ankit. Make him the
  current contact?"* — same pattern as SPANCOP, nothing changes silently ⭐
- **(c)** Manual only — the user changes it themselves

*Recommendation: **(b)**, for consistency with the SPANCOP suggestion engine
you already approved.*

---

## 2. Progressive disclosure — fields appear when they are relevant

The deal form stays short. The **detail view** grows as the deal advances.

| Stage | What becomes visible |
| --- | --- |
| Lead → Quotation | Line items, brand, unit price, ageing, next action, task |
| Negotiation | *(unchanged)* |
| **Sampling** | 🔓 **Sample tracking** — sent date, feedback, days to respond |
| **Won** | Won date, PO reference |
| **Lost** | 🔓 **Lost reason** — prompted and required |
| Any stage | **On hold** toggle |

Nothing irrelevant is ever on screen. A deal at Lead shows no sample block and
no lost reason.

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

**Question:** should **Won** also ask something — e.g. a PO reference or the
confirmed value? Or should Won be a single click with no friction?

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

1. **Current contact** — auto (a), suggest (b) ⭐, or manual (c)?
2. **Won** — ask for a PO reference, or one click?
3. Is my read of the contact journey right?
