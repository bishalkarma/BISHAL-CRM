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

## D. Navigation — "Pipeline" → "Deals Pipeline", plus a SPANCOP page

```
SELL
  Dashboard
  Deals Pipeline      ← renamed
  SPANCOP             ← new
  Companies
  Contacts
  Activities
```

**Yes, this is a good idea.** SPANCOP is company-level and deserves its own
page rather than living as a strip on the Companies list.

The new page would hold:

- **The 7-stage board** — companies as cards in S/P/A/N/C/O/P columns
- **Snapshot counts** per stage
- **Pending suggestions** with reasons, approve or keep
- **Stalled alerts** — split into *Not converting* vs *Reorder gap*
- **Stage history** — the period-flow data we have been logging

**Question:** should the Companies page keep its SPANCOP snapshot strip, or is
that now duplicated?
*Recommendation: keep the small strip on Companies for context, move the full
board and suggestions to the SPANCOP page.*

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

## Confirm before I build

1. Import — block everything (a), or import valid and skip invalid (b) ⭐?
2. SPANCOP page — keep the small strip on Companies too?
3. Category — required or optional?
4. Category — on the deal ⭐ or per line item?
