# Companies — Agreed Spec (v2)

Revised after review. **Awaiting final sign-off on 4 open points (§7).**

---

## 1. Locked decisions

| Decision | Outcome |
| --- | --- |
| Lost deal → | **Approach** (not Close) |
| Multiple deals per company | Supported; company stays at **Negotiate** until the **last** open deal closes |
| Deal serial numbers | Short, global, searchable — see §5 |
| Customer Type badge | **Dropped** — SPANCOP is the single company funnel |
| Automation | **Suggest only** — never auto-applies; user confirms |
| Stalled-stage alerts | **In** |
| Approach → Negotiate conversion | **Tracked** |
| Written PO via email / WhatsApp | Confirmed — **Close** and **Order** stay separate |
| Full address, Account Tier, Hospitality profile, Commercial/credit, Tags | **Removed** |

---

## 2. Final field list — 13 fields

| # | Field | Req | Control |
| --- | --- | --- | --- |
| 1 | Property name | ✅ | Text |
| 2 | Cluster | — | **Combobox** — search existing or type to create |
| 3 | Emirate | ✅ | Dropdown, 7 emirates |
| 4 | Location / Area | ✅ | Text **+ manual map pin** |
| 5 | Business | ✅ | Hotel · Project · Restaurant · Cafe · Catering · Banquet |
| 6 | Type | ✅ | **Conditional** — see §3 |
| 7 | Contact person | ✅ | Text |
| 8 | Role / title | ✅ | Dropdown |
| 9 | Email | ➖ | Optional — validated only if filled |
| 10 | Phone | ✅ | UAE format + WhatsApp flag |
| 11 | Account owner | — | User picker |
| 12 | Lead source | — | Dropdown |
| 13 | Remarks | — | Textarea |

**Not in the create form:**
`SPANCOP` — always **Suspect** on creation, then automatic (§4).
`Lead status` — pending decision (§7.1).

---

## 3. Conditional "Type" field

```
Business = Hotel        →  Type = 4★ · 5★ · 6★ · 7★
Business = anything else →  Type = New · Old · Renovation
```

The Type dropdown re-populates the moment Business changes. If Business is
switched after a Type is chosen, the stale value is cleared rather than left
mismatched.

---

## 4. SPANCOP — suggest, never auto-apply

A banner appears on the company; the stage only moves when the user accepts.

> 🔵 **Suggested: Approach → Negotiate**
> Deal `#D-1042 — Annual dry goods supply` was opened today.
> **[ Move to Negotiate ]** **[ Keep at Approach ]**

Every decision — accepted, declined or manual — is written to the company
timeline with who, when and why.

### Precedence (highest match wins)

| # | Stage | Condition |
| --- | --- | --- |
| 1 | **Negotiate** | ≥1 **open** deal — outranks everything |
| 2 | **Payment** | Delivered · awaiting or completed collection |
| 3 | **Order** | PO received, not yet delivered |
| 4 | **Close** | Last deal **won**, no PO yet |
| 5 | **Approach** | ≥1 activity logged, no open deal, no win |
| 6 | **Prospect** | Profile completed / manually promoted |
| 7 | **Suspect** | Default on creation |

---

## 5. Deal serial numbers

Format **`D-1042`** — short, global, sequential. Easy to read out on a call.

- Searchable in ⌘K by number alone: type `1042`
- Shown on the deal card, drawer and every list
- On a company: *"Deal 3 of 5"* so multi-deal accounts stay legible
- Never reused, even after deletion

---

## 6. Stalled-stage alerts

| Stage | Alert after |
| --- | --- |
| Suspect | 30 days — never contacted |
| Prospect | 21 days — qualified, not approached |
| Approach | 30 days — talking, no deal |
| Close | 14 days — won but PO not chased |
| Payment | 30 days — **money owed** 🚩 |

---

## 7. Open points

### 7.1 · Lead Status — keep or drop?

Hot / Warm / Cold / Dormant is a **manual priority flag**; SPANCOP is an
**automatic position**. Two companies can both sit at Approach — one warm and
close to buying, one going nowhere. SPANCOP can't separate them; Lead Status can.

- **(a) Keep it** — one-tap sort for "who do I call today"
- **(b) Drop it, use a *Next follow-up date* instead** — a date is more
  actionable than a temperature and drives the Activities module
- **(c) Keep both**

*Recommendation: **(b)**, or (a) if your team already thinks in Hot/Warm/Cold.*

### 7.2 · After cash is collected — RESOLVED ✅

**Payment collected → roll back to Approach.** The relationship is known and
warm, there is simply no live opportunity. A new query creates a new deal, which
moves the company to Negotiate and the cycle runs again.

So SPANCOP is a **repeating loop**, not a one-way ladder:

```
Suspect → Prospect → Approach → Negotiate → Close → Order → Payment
                        ↑                                      │
                        └──────── cash collected ──────────────┘
                        ↑                                      
                        └──────── deal lost ────────────────────
```

**Approach is the resting state** for every known customer between deals.

### 7.3 · Email — optional, correct?

Read as: field present, **not required**, validated only when filled.

### 7.4 · TRN — defer, don't drop

Agreed it isn't needed for the Companies module. Flagging once for the record: a
UAE tax invoice is not compliant without the customer TRN, so it will be needed
when **Quotations** are built in Part 4. Proposal: add it then, as a single field.

---

## 7A · Consequences of the roll-back loop

Because a company returns to **Approach** after payment, two things follow.

### A. A live snapshot is not enough for periodic review ⚠️

You asked to review stages weekly / monthly / quarterly / yearly. But if a
company completes a full cycle in January and rolls back, today's snapshot just
shows **Approach** — the whole won-and-collected cycle becomes invisible.

**Fix — log every stage transition** (date, from, to, trigger, user). That gives
two different and equally necessary reports:

| Report | Question | Example |
| --- | --- | --- |
| **Snapshot** (live) | Where is everyone *right now*? | 42 Suspect · 18 Approach · 7 Negotiate |
| **Period flow** (history) | What *happened* in this period? | In Q1: 14 companies reached Order, 9 collected payment |

The flow report is the one that proves performance. Without stored history it
cannot be produced retrospectively — so the log must exist from day one, even
though the reports themselves are built in Part 5.

### B. The Approach alert needs splitting ⚠️

Approach is now the resting state for **every** known customer between deals. A
flat "30 days in Approach" alert would fire constantly for perfectly healthy
repeat customers — pure noise.

**Fix — branch on order history (already known, no new field):**

| Situation | Alert | Meaning |
| --- | --- | --- |
| Approach · **never** ordered · 30 days | "Not converting" | Talked, never bought |
| Approach · **has** ordered · 60+ days since last order | "Reorder gap" | Existing customer going quiet 🚩 |

Same stage, two very different problems — and the second is the one that
protects revenue.

---

## 8. Also in the module

List · card · map views · Excel/CSV import · inline editing · saved views ·
duplicate detection on create · company detail page (contacts, deals, activity
timeline) · bulk owner reassign · mobile tap-to-call / WhatsApp / navigate.
