# Deals — Field Proposal

**Discussion document. Nothing built yet.**

## ✅ Decided so far

| Decision | Outcome |
| --- | --- |
| Deal structure | **Option B** — one deal per enquiry, products as line items |
| `78 days` | **Deal ageing** = today − created date (auto, corrected below) |
| Next action / Task | Separate, **and logged to the customer activity log** |
| Units | **Pcs** primary |
| Lost reasons | Budget Constraint · Item not in scope · Lead time · Query Cancelled |
| Deal → customer | Must attach to an existing customer, with create-first guard |


---

## 1. What your sheet tells me

Your two sample rows:

| S.N | CLIENT | CONTACT | REQUIREMENT | QTY | DEAL VALUE |
| --- | --- | --- | --- | --- | --- |
| 10 | Golden Sands 5 Hotel Apartments | Mr. Ankit Singh Chauhan | Cloth Dryer Stand | 455 Pcs | 38,930.00 |
| 11 | Golden Sands 5 Hotel Apartments | Mr. Ankit Singh Chauhan | SS Cookware Frying Pan 26cm | 200 Pcs | 15,000.00 |

Same client · same contact · same date · same required-by date · **different product**.

**So in your system today, one deal = one product line.** That is the single
biggest decision to make before I build anything — see §4.

Two other things I noticed:

- **`CLIENT NAME (↓ Select)`** — already a dropdown. Confirms your rule that a
  deal must attach to an existing customer.
- **`DUE DATE = 78 days`** — corrected: this is **deal ageing**, i.e.
  `today − deal created date`. Auto-computed, counts **up**, never typed.

---

## 2. Your columns, mapped

| Your column | Becomes | Have it? |
| --- | --- | --- |
| S.N | Deal serial `D-1042` | ✅ |
| DATE | Created date | ✅ |
| CLIENT NAME (↓ Select) | Company — locked picker | ✅ |
| CONTACT | **Deal contact** | ⚠️ only at company level today |
| REQUIREMENT | Product / requirement | ✅ (as title) |
| QUANTITY | Quantity + unit | ❌ **missing** |
| REQ DATE | Customer required-by date | ❌ **missing** |
| DEAL VALUE | Value + currency | ✅ |
| DEAL STATUS | Open / Won / Lost / **On hold** | ⚠️ no "On hold" |
| NEXT ACTION | Latest update from client | ❌ **missing** |
| DUE DATE | Countdown — **auto-computed** | ❌ **missing** |
| TASK STATUS | Our next task | ❌ **missing** |
| REMARKS | Remarks | ❌ **missing** |

### Three different dates — all auto where possible

| Field | Meaning | Source |
| --- | --- | --- |
| **Created date** | When the deal was opened | Auto |
| **Deal ageing** | `today − created` → *"78 days"* | **Auto, counts up** |
| **REQ DATE** | When the customer needs delivery | Typed |

Ageing drives the rotting-deal warning already in the pipeline: an 78-day-old
deal still at Quotation is a red flag.

### ⚠️ NEXT ACTION and TASK STATUS are two different things

Reading your entries:

> **NEXT ACTION:** *"Got the update on the sample and they like it, they just
> want the revised quote and final offer."* → what the **client** said
>
> **TASK STATUS:** *"Send the revised and final quote and wait for approval."*
> → what **you** must do

So: NEXT ACTION is the **latest update**, TASK STATUS is an **open task** with a
due date. I'd model them as exactly that — the task then feeds the Activities
module and can be marked done.

---

## 3. What I'd add

| Field | Why |
| --- | --- |
| **Unit price** | You have qty and total; `38,930 ÷ 455 = AED 85.56/pc`. Auto-computed, and the number customers actually argue about |
| **Brand / competitor** | Straight from your own note: *"won't go for Prestige, looking for lightweight stainless steel."* That's competitive intel worth a field |
| **Lost reason** (picklist) | **Budget Constraint · Item not in scope · Lead time · Query Cancelled** — your list. Gives you *"37% lost on lead time"* |
| **On hold** status | *"Budget locked until next quarter"* is not lost — but it shouldn't sit in your live forecast either |
| **Sample tracking** | Your notes mention samples constantly. Sent date + feedback, tied to the Sampling stage |
| **Cost & margin** | Optional. Lets you see margin per deal, and flag discounting below a floor |

---

## 4. 🔴 The one big decision

### Option A — One deal per product *(your sheet today)*

Golden Sands = **2 deals**: Cloth Dryer Stand, Frying Pan.

- ✅ Matches your current way of working exactly
- ✅ Per-product win/loss — you learn *"we keep losing cookware"*
- ❌ A 15-item enquiry becomes 15 pipeline cards
- ❌ Hard to see *"this hotel is worth AED 54K to us"*

### Option B — One deal per enquiry, products as line items ⭐

Golden Sands = **1 deal** worth AED 53,930, containing 2 lines. Each line can be
individually approved or rejected.

- ✅ One card per real negotiation — clean pipeline
- ✅ Total opportunity value per customer is obvious
- ✅ Still get per-product win/loss, because each **line** carries a status
- ✅ Matches how a quotation actually works (Part 4 becomes trivial)
- ❌ A bigger change from your sheet

**My recommendation: Option B.** It reflects reality — the hotel sent *one*
enquiry, you send *one* quote, they approve some lines and reject others.
Option A can't express "10 of 15 items approved" without splitting a deal.

**Option C** — start with A, add line items later. Honest warning: this is the
most expensive path, because the data model has to be rebuilt afterwards.

---

## 5. Deal must attach to an existing customer

Confirmed, and this is how the guard will work:

1. **+ New Deal** opens a company picker (search by name, area, contact)
2. Not found → *"No customer matches. A deal must belong to a customer."* with a
   **Create customer** button
3. That opens the company form. The name typed in the search is carried over
4. On save → ✅ **"Great — now create the deal"** and the new company is
   pre-selected on the deal form
5. Company can then be changed only by starting again, so a deal is never
   orphaned

The same guard applies to the FAB and the ⌘K "Create deal" action.

---

## 6. Proposed field list — Option B

**Header**
`Serial (auto)` · `Company *` (locked picker) · `Contact *` · `Title / enquiry` ·
`Owner` · `Created date (auto)`

**Line items** — repeatable
`Requirement / product *` · `Quantity + unit *` · `Unit price` ·
`Line total (auto)` · `Brand` · `Line status` (Quoted / Approved / Rejected)

**Commercials**
`Deal value (auto-summed)` · `Currency` · `Cost` *(optional)* · `Margin (auto)`

**Dates**
`REQ DATE *` (customer needs it) · `Expected close` · `Countdown (auto)`

**Status**
`Pipeline stage` (Lead → … → Sampling) · `Deal status` (Open / Won / Lost / On
hold) · `Lost reason` (shown only when Lost) · `Priority`

**Working notes**
`Next action` — latest client update ·
`Task` + `task due date` + done tick ·
`Remarks`

---

## 7. Open — see the mockups

1. **Cost & margin** — explained in mockup 21. Decide: skip / optional / required.
2. **Deal contact** — explained in mockup 22. It is *always the same company*;
   the only question is *which person at that company*.
3. **Sample tracking, brand/competitor, On hold** — shown in mockup 20.

---

## Also queued (agreed, not yet built)

- **Excel/CSV import** with a **downloadable 5-row sample file** so headers and
  formats match exactly before upload. Import will preview and flag bad rows
  rather than failing silently.
- **Contacts module** — multiple contacts per company, grouped into the
  customer activity log.
