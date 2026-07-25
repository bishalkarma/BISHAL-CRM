# SPANCOP Engine — Company-level relationship stage

**Status: proposal awaiting sign-off.** Nothing built yet.

Two separate ladders, lightly linked:

| | Tracks | Level | Count |
| --- | --- | --- | --- |
| **SPANCOP** | The *relationship* | Company | One per company |
| **Pipeline stages** | A *specific opportunity* | Deal | Many per company |

---

## ⚠️ One contradiction to resolve first

Your two messages disagree on what a **lost** deal should do:

> **Message 1:** "…then after that same customer move to **APPROACH** stage if there's no any deal, but if the customer deal is closed like **won**, then it should move to **CLOSE**."

> **Message 2:** "**CLOSE**: if the user closed the last ongoing deal **either won or lost**, then that customer move to close."

**My strong recommendation: follow Message 1.**

In SPANCOP, *Close* means **the sale was closed successfully** — it is the gateway
to Order and Payment. If a lost deal also lands on Close, then:

- Your SPANCOP funnel counts failures as successes
- A company sits at Close with nothing to invoice, forever
- "Close → Order" conversion becomes meaningless as a metric

A lost deal doesn't destroy the relationship — you still know them, you've still
talked to them. That is precisely **Approach**.

```
Deal WON   →  CLOSE      (progress: something to invoice)
Deal LOST  →  APPROACH   (relationship intact, no live opportunity)
```

---

## The rules

### The seven stages

| Stage | Meaning | Trigger |
| --- | --- | --- |
| **S** · Suspect | Added, never contacted | Company created — default |
| **P** · Prospect | Qualified on paper, not yet contacted | Profile completed / manual promote |
| **A** · Approach | In live conversation, no deal yet | ≥1 activity logged |
| **N** · Negotiate | An opportunity is on the table | ≥1 open deal |
| **C** · Close | Deal won, awaiting the PO | Last deal closed **won** |
| **O** · Order | Purchase order received | Sales order confirmed |
| **P** · Payment | Cycle complete | Delivered **and** paid |

### Precedence — highest match wins

A company's stage is recomputed on every relevant event. Rules are evaluated
top-down; the first match wins.

| # | Stage | Condition |
| --- | --- | --- |
| 1 | **Negotiate** | Has ≥1 **open** deal |
| 2 | **Payment** | No open deals · all orders delivered **and** paid |
| 3 | **Order** | No open deals · has a confirmed PO not yet delivered/paid |
| 4 | **Close** | No open deals · most recent deal **won** · no PO yet |
| 5 | **Approach** | No open deals · ≥1 activity logged · no won deal |
| 6 | **Prospect** | Profile complete, or manually promoted · no activity |
| 7 | **Suspect** | Nothing above — the default |

**Rule 1 sits at the top deliberately**, matching your instruction: *"if the user
opens any deal then move directly to Negotiation… don't move until that deal is
closed."* With three deals open, the company stays at Negotiate until the **last**
one closes.

### Worked examples

```
New company added                        → SUSPECT
Fill in TRN, contacts, outlets           → PROSPECT
Log a site visit                         → APPROACH
Open a deal                              → NEGOTIATE
Open 2 more deals (3 open)               → NEGOTIATE  (unchanged)
Close 2 of them, 1 still open            → NEGOTIATE  (last deal rule)
Close the last one — WON                 → CLOSE
Close the last one — LOST                → APPROACH   ⚠️ see contradiction
Receive the purchase order               → ORDER
Deliver + collect payment                → PAYMENT
Open a brand-new deal later              → NEGOTIATE  (new cycle)
```

---

## My additional suggestions

You asked for options — these are the seven I'd argue for, ranked.

### 1. ⭐ Add a **Customer Type** badge, separate from SPANCOP

**The problem:** once a company reaches Payment and you open a new deal, they drop
back to Negotiate. So the SPANCOP stage alone can never tell you whether this is a
loyal customer of five years or someone who has never bought a single carton.

**The fix** — a small derived badge shown next to SPANCOP:

| Badge | Meaning |
| --- | --- |
| `Prospect` | Never ordered |
| `Customer` | Has ordered, active in the last 90 days |
| `Lapsed` | Has ordered, nothing in 90+ days |

SPANCOP answers *"where are we in the current cycle?"*.
Customer Type answers *"how valuable is this relationship?"*.
You need both — this is the single most valuable addition I can offer.

### 2. ⭐ Auto-suggest, with manual override and an audit trail

Never silently overrule a human. Every automatic move is logged:

> *Approach → Negotiate · automatic · deal "Annual dry goods" opened by Bishal · 12 Feb 14:22*

A rep can always override manually (that's logged too, with a reason). Overridden
companies are marked so automation doesn't fight the user.

### 3. ⭐ A "why is it here / what's next" line on every company

> **APPROACH** — 2 activities logged, last call 3 days ago.
> **Next:** open a deal to move to Negotiate.

This turns SPANCOP from a label into coaching. New reps learn the process by
using it. Cheap to build, disproportionately useful.

### 4. ⭐ Stalled-stage alerts (SPANCOP SLA)

Same idea as the pipeline's rotting-deal warning, one level up:

| Stage | Alert after |
| --- | --- |
| Suspect | 30 days — never contacted |
| Prospect | 21 days — qualified but not approached |
| Approach | 30 days — talking, no deal |
| Close | 14 days — won but no PO chased |
| Order | 30 days — delivered but unpaid 🚩 |

Dashboard line: *"18 companies stuck in Approach for 30+ days."* That's a
morning to-do list for a sales director.

### 5. ⭐ A SPANCOP funnel on the dashboard

Companies per stage, plus stage-to-stage conversion. If Suspect → Prospect is 80%
but Approach → Negotiate is 9%, your problem is conversations that don't become
opportunities. That's a coaching insight your spreadsheet can't give you.

### 6. Never regress silently

Downward moves (Close → Approach after a loss) appear as a notification rather
than a silent edit, so nobody is surprised when a number changes.

### 7. Keep **Lead Status** doing a different job

You already have Hot / Warm / Cold / Dormant. Keep it — it's *temperature*, not
*position*. A company can be at **Approach** and **Hot**, or **Order** and **Cold**
(bought once, gone quiet). Two axes, two decisions.

---

## Three questions for you

**Q1 · Lost deals** — Approach (my recommendation) or Close (your message 2)?

**Q2 · What does Payment mean?**
&nbsp;&nbsp;**(a)** Delivered *and* cash collected — my recommendation, cash is what matters
&nbsp;&nbsp;**(b)** Delivered only, payment tracked separately

**Q3 · Do you always get a formal PO?**
If purchase orders are often verbal, **Close** and **Order** collapse into one step
in practice, and we could merge them. If your hotels always issue a written PO,
keep them separate.

---

## Build note

**Negotiate**, **Close** and **Approach** can be automated now — deals and
activities already exist.

**Order** and **Payment** need the Orders module (Part 4). Until then they'll be
manual, with the automation switching on when Part 4 lands. No rework.
