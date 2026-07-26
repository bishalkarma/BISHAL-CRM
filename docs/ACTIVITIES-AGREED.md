# Activities — everything we agreed

**Sign-off sheet. Read this, then say build it.**

---

## 1. What it is

A journal of every interaction with a customer. One record type, readable at
three levels, so nothing is ever entered twice.

| Where you look | What you see |
| --- | --- |
| **Deal drawer** | Only activities linked to that deal |
| **Company drawer** | Every activity for that customer |
| **Activities page** | Everything, every customer |

---

## 2. Activity types — 8

| | | |
| --- | --- | --- |
| Site visit | Call | Email |
| Meeting | Demo *(= sample submitted)* | Casual follow-up |
| WhatsApp | Payment follow-up | |

*WhatsApp is separate from Call because in the UAE it is a different channel.
Payment follow-up is separate so chasing money is countable on its own.*

---

## 3. The log form

| Field | Required | Behaviour |
| --- | --- | --- |
| **Type** | ✅ | The 8 above |
| **Date** | ✅ | Defaults to today, can be back-dated |
| **Customer** | ✅ | Shows name, area and business type |
| **Contact person** | ✅ | Lists contacts with role, **collapses past 3** |
| **Link to deal** | — | **Nothing preselected** — see §4 |
| **Report** | ✅ | Textarea. **Label follows the type** — see §5 |
| **+ Add follow-up task** | — | **Inline reveal** — see §6 |

---

## 4. Deal linking — nothing is preselected

Auto-selecting the only open deal was rejected, and rightly:

```
Customer A · 1 open deal (D-1042 Flower vases)
  Diwali greeting call        -> would wrongly tag D-1042
  Met the new F&B manager     -> would wrongly tag D-1042
  Festive WhatsApp            -> would wrongly tag D-1042
```

The deal thread would fill with noise and stop being trustworthy.

**Rule:** the field defaults to *not linked*. The user links a deal only when
the conversation genuinely was about it.

- **Linked** → deal thread **and** customer journal
- **Not linked** → customer journal only, **with no chip or label** — an
  ordinary activity, because that is the common case

---

## 5. The report field

The label follows the type, which prompts a useful note rather than a bare
subject line. Rendered as a textarea, not a single line.

| Type | Label |
| --- | --- |
| Call | Call report |
| Site visit | Visit report |
| Email | Email summary |
| Meeting | Meeting report |
| Demo | Demo / sample report |
| WhatsApp | Message summary |
| Payment follow-up | Payment note |
| Casual follow-up | Follow-up note |

---

## 6. Follow-up task — inline reveal

One quiet line under the report: **`+ Add follow-up task`**.
Tap it and `Next task`, `Due date` and `Remind me` expand in place.

Chosen over a post-save popup because once a record is already saved,
*"No thanks"* costs nothing and becomes the reflex — follow-ups stop being set
and the reminder feature goes unused.

Still **one save**. Nothing is asked twice.

---

## 7. The journal

Chronological, like a logbook. **Newest 3 always visible**; anything older
collapses behind *"Show N earlier entries"* and expands **in place**.

```
  ▸ Show 2 earlier entries
  18 Jul  Call     Asked about the email, meeting set for 25 Jul
  25 Jul  Meeting  Shared requirement — flower vases
  27 Jul  Email    Sent quotation, awaiting feedback
```

---

## 8. The summary — derived, not typed

Two facts, assembled automatically:

> **Last:** Email · 27 Jul — quotation sent, awaiting feedback
> **Next:** Follow up Mr. Ankit · ⚠ 2 days overdue

From the **latest activity** and the **oldest open task**. Accurate by
construction, nothing extra to maintain.

*A hand-written status box was rejected — it reads better but goes stale, and a
stale status is worse than none because it is believed. An AI-written paragraph
can layer on top of this later without rework.*

---

## 9. Tasks carry full context

No bare one-liners. Every task, reminder and completion card shows:

| Shown |
| --- |
| Type + title |
| Customer · area |
| Contact · role |
| Deal chip + value *(only if linked)* |
| Urgency — Due today / Overdue 2 days |
| One-tap Call · WhatsApp · Email |

Ticking a task **done** writes it into the journal automatically, tagged to the
same customer, contact and deal.

---

## 10. Reminders — in-app only

| Where | What |
| --- | --- |
| **Top bar bell** | Red badge with a count, split overdue vs due today |
| **Dashboard tile** | *"Due today 4 · Overdue 2"*, tap to jump |
| **Open tasks view** | Overdue pinned to the top in red |

⚠️ **Known limit:** these appear only while the CRM is open. Email or WhatsApp
reminders that reach you when the app is closed need a background scheduler —
separate work, agreed for later.

---

## 11. Two automatic behaviours

**SPANCOP Suspect → Approach.** The first activity of *any* type triggers the
suggestion. Suggested, never silent, consistent with every other SPANCOP move.

**Deal current contact moves.** Logging with a different person at the same
company updates the deal's *current contact*. **Enquiry from stays locked**, so
the "who feeds us business" report stays accurate.

---

## 12. Views

**Timeline** *(default)* · **By customer** · **Open tasks**

Filters: type · owner · customer · date range · open only.
We keep all three for now and can drop one once it has been used.

---

## 13. Deal task overlap

The deal keeps its task box exactly as it looks today, but saving now creates a
**linked activity** behind it. The deal thread stays clean, and the Activities
page remains the single answer to *"what do I owe anyone"*.

---

## Build order — testable in stages

| Stage | What | You can check |
| --- | --- | --- |
| **1** | Model + log form + Supabase persistence | Log one, refresh, it survives |
| **2** | Activities page — 3 views | Timeline, By customer, Open tasks |
| **3** | Journal on company + deal drawers | Collapse, and deal-only filtering |
| **4** | Reminders — bell, dashboard, overdue | Counts match reality |
| **5** | SPANCOP suggestion + contact move | Suspect → Approach prompt appears |

Rollback point remains `stable-before-supabase`.
