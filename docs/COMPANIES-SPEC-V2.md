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

### 7.2 · What happens after cash is collected? ⚠️ *new gap*

You defined **Payment** as *delivered, cash not yet collected*. So what is the
company's stage once they pay? Falling back to Approach would look like a demotion.

- **(a) Stay at Payment as the resting state** — with a sub-flag
  `Awaiting collection` 🔴 → `Settled` ✅. A new deal starts a fresh cycle.
- **(b) Add an eighth stage** (e.g. *Repeat / Active customer*)
- **(c) Fall back to Approach**

*Recommendation: **(a)**. It keeps SPANCOP at seven stages, gives you a live
"who owes me money" list, and a company resting at Payment is self-evidently an
existing customer — which recovers most of what the dropped Customer Type badge
would have told you.*

### 7.3 · Email — optional, correct?

Read as: field present, **not required**, validated only when filled.

### 7.4 · TRN — defer, don't drop

Agreed it isn't needed for the Companies module. Flagging once for the record: a
UAE tax invoice is not compliant without the customer TRN, so it will be needed
when **Quotations** are built in Part 4. Proposal: add it then, as a single field.

---

## 8. Also in the module

List · card · map views · Excel/CSV import · inline editing · saved views ·
duplicate detection on create · company detail page (contacts, deals, activity
timeline) · bulk owner reassign · mobile tap-to-call / WhatsApp / navigate.
