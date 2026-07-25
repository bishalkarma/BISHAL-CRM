# Part 5 — Bug fixes + agreed changes

**Discussion document. Nothing built until you confirm.**

---

## A. The two bugs are the same bug 🐛

### What you saw

1. **"Enquiry from" dropdown was empty** on a newly created customer → blocked deal creation
2. **New customer's contact never appeared** on the Contacts page

### Root cause

`New Company` saves the contact's name, role, email and phone **onto the company
record** — but never creates a **Contact** record.

```
Company { name: "API Business Pvt. Ltd.", contactName: "Mr Sharma", … }   ✅ saved
Contact { companyId: "…", name: "Mr Sharma", … }                          ❌ never created
```

The deal form and the Contacts page both read from the `CONTACTS` list, which
is why the same omission shows up as two different symptoms.

Reproduced:

```
contactsForCompany("C-new") → []
  → "Enquiry from" options: 0    ← blocks deal creation
  → shows on /contacts:      no
```

### The fix

Creating a company also creates its first Contact, flagged `isPrimary`.
Import does the same for every row.

### A second, related defect ⚠️

There are currently **two sources of truth**:

- `use-companies.ts` holds a React copy — `useState(COMPANIES)`
- `pipeline-board.tsx` mutates the raw array — `COMPANIES.unshift(company)`

So a company created from the **deal** flow does not appear on the **Companies**
page, and vice versa. Records seem to vanish depending on where they were made.

**Fix:** one shared store for companies, contacts and deals, so every page reads
the same data. This is the right shape for the Supabase swap later.

---

## B. Import / Export → Settings

Agreed. Moves to **Settings → Data**, alongside a new **Export**.

### Stricter validation, as you asked

Nothing is imported unless the file is clean:

| Check | Behaviour |
| --- | --- |
| Missing required field | ❌ Blocks the whole import |
| Invalid picklist value | ❌ Blocks |
| Malformed email | ❌ Blocks |
| Duplicate name | ⚠️ Warns, row skipped |

The preview shows every problem with its row and column. The **Import** button
stays disabled while any error remains.

**Question:** if 48 of 50 rows are valid, should the button:
- **(a)** stay disabled until all 50 are fixed — strictest, your literal ask
- **(b)** offer *"Import 48 valid rows, skip 2"* with the errors listed ⭐

*Recommendation: **(b)**. Nothing invalid ever enters the system either way, but
you aren't forced to redo 48 good rows because of 2 typos.*

---

## C. Contacts — collapse when more than 3

A company with 4+ contacts shows the first 3, then:

```
  ▸ Show 1 more contact
```

Expands **in place** — no dialog, exactly as you asked. Companies with 3 or
fewer are unaffected.

---

## D. Navigation — rename only. SPANCOP lives on the Dashboard 🔄

**Revised.** No SPANCOP nav item.

```
SELL
  Dashboard          ← SPANCOP funnel widget lives here
  Deals Pipeline     ← renamed from "Pipeline"
  Companies
  Contacts
  Activities
```

### SPANCOP as a dashboard funnel

A funnel widget on the Dashboard, with a period filter:

`This week · This month · This quarter · This year`

Clicking through opens a **separate detail page** for the chosen period —
the funnel stays a summary, the depth lives one click away.

### ⚠️ What does "SPANCOP this month" actually mean?

This is the snapshot-vs-flow distinction from the SPANCOP spec, and the period
filter forces the question. Two different readings:

| Reading | Question answered | Example |
| --- | --- | --- |
| **Snapshot** | Where is everyone *right now*? | 5 sit in Approach today |
| **Period flow** | What *happened* in this period? | 9 entered Approach this month; 4 moved on |

A snapshot has no timeframe, so "this month" cannot change it — the filter would
do nothing. **The filter only makes sense against the flow.**

**Recommendation — show both in one widget:**

- **The funnel bars** = the live snapshot, always current
- **The movement figures** = flow for the chosen period, e.g. `+9 in · 4 out`
- **Stage-to-stage conversion %** for that period

That way the filter is meaningful, and you still see today's position at a
glance. This is exactly what the transition log was built for.

---

## E. Category on the deal form

New field below **Enquiry title**:

| Code | Meaning |
| --- | --- |
| OS&E | Operating Supplies and Equipment |
| FF&E | Furniture, Fixtures and Equipment |
| FOH | Front of House |
| BOH | Back of House |

Same combobox behaviour as Cluster: search existing, or type to create a new
category.

**Two questions:**

1. Is Category **required** or optional?
2. Should it sit on the **deal** or on each **line item**? A single enquiry can
   mix FF&E and OS&E items.
   *Recommendation: on the **deal**, since your sheet tracks one requirement
   type per enquiry — line-level can be added later if it becomes a problem.*

---

## Proposed build order

1. 🐛 Contact created with company + import *(unblocks deal creation)*
2. 🐛 Single shared store *(records stop vanishing)*
3. Contacts collapse past 3
4. Category on the deal form
5. Rename to Deals Pipeline + new SPANCOP page
6. Import/Export moved into Settings

---

## Decisions — all confirmed ✅

| # | Decision |
| --- | --- |
| Import | Import the valid rows; list invalid ones with the exact field to fix |
| SPANCOP page | Full board on its own page; small snapshot strip stays on Companies |
| Category | **Mandatory** — a deal cannot be saved without one |
| Category level | On the **deal**, not the line item |

**Why category is mandatory:** it feeds dashboard analysis — which category
generates the most enquiries. Optional data makes that report unreliable.

**Consequence of deal-level category:** an enquiry mixing FF&E and OS&E becomes
two deals. That is intentional — it keeps category analysis clean and each deal
tracked against a single requirement type.

---

## Build order

1. 🐛 Contact created with company + import
2. 🐛 Single shared store
3. Deals Pipeline rename + SPANCOP page, each wired to its own data
4. Category (mandatory) on the deal form
5. Contacts collapse past 3
6. Import/Export into Settings → Data
