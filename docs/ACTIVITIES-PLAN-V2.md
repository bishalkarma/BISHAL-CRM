# Activities — plan v2

**Discussion only. Nothing built until you say go.**

---

## 1. Your separation requirement — solved by the deal link

> *"Customer has open deal No.1 and I already had 10 activity logs… I have to
> check what's the last update on that deal No.1. I don't have to go to that 10
> activity logs and find where was the last communication."*

Understood. Every activity carries an optional **deal link**, so the same records
can be read at two levels:

| Where you are | What you see |
| --- | --- |
| **Deal drawer** — Deal No.1 | Only the activities tagged to Deal No.1 |
| **Company drawer** — Customer A | All 10, the full relationship |
| **Activities page** | Everything, every customer |

So you never scroll 10 entries to find the state of one deal — the deal shows
its own thread. One set of records, filtered three ways, nothing entered twice.

### This is also the answer to the task overlap

You chose **(b)**, and it fits: the deal keeps its task box exactly as it looks
now, but saving creates an activity **linked to that deal**. The deal thread
stays clean, and the Activities page still answers *"everything I owe anyone"*.

---

## 2. The journal view

Chronological, oldest at the bottom, exactly like a logbook.

### Collapse rule

Companies with **more than 5** entries collapse — showing the **most recent 3**,
not the first 3, because the recent ones are what matter.

```
  ▸ Show 2 earlier entries
  ─────────────────────────
  18 Jul  Call     Asked about the email, meeting set for 25 Jul
  25 Jul  Meeting  Shared requirement — flower vases
  27 Jul  Email    Sent quotation, awaiting feedback
```

Tapping expands **in place** to the full journal — same behaviour as Contacts.

---

## 3. The summary line — how it is produced

You want, at the top of each customer:

> *"Shared requirement of flower vase, quotation sent and waiting for the
> quotation update from Ankit."*

That sentence is really **two facts**:

| Part | Source |
| --- | --- |
| *"quotation sent"* | The **latest activity** |
| *"waiting for update from Ankit"* | The **oldest open task** |

Both already exist as fields on a deal — `nextAction` (*latest update from the
client*) and `task` (*what we must do next*). So the summary can be assembled
mechanically:

> **Last:** Email · 27 Jul — Sent quotation, awaiting feedback
> **Next:** Follow up with Mr. Ankit · due 30 Jul · ⚠ 2 days overdue

**Always accurate, nothing extra to type.**

### Three ways to build it

| | How | Trade-off |
| --- | --- | --- |
| **(a)** Latest activity + next open task ⭐ | Derived automatically | Reads as two lines, not one sentence |
| **(b)** Manual "current status" box | You write the sentence | Reads perfectly — but goes stale if not updated |
| **(c)** AI-written summary | Reads the whole journal | Needs the AI module; can be added later on top of (a) |

*Recommendation: **(a)** now, with **(c)** layered on later — the sidebar already
promises an AI assistant. (b) is the risk: a stale hand-written status is worse
than no status, because it is believed.*

---

## 4. Activity types

Your six, confirmed:

**Site visit · Call · Email · Meeting · Demo · Casual follow-up**

### Three I would add — you asked for ideas

| Type | Why |
| --- | --- |
| **Sample** ⭐ | Samples run through everything you have described. There is a whole **Sampling** pipeline stage and a sample tracker on the deal, but no way to log *"sent 4 blends to the head barista"* as an interaction |
| **WhatsApp** ⭐ | In the UAE this is not a phone call. Contacts already carry a *"same as WhatsApp"* flag — logging it as *Call* loses where the conversation actually happened |
| **Payment follow-up** | SPANCOP has a Payment stage meaning *delivered, cash pending*. Chasing money is not a *Casual follow-up*, and separating it lets you count collection effort |

*My pick: definitely **Sample** and **WhatsApp**. Payment follow-up is optional —
say if you would rather keep the list short.*

---

## 5. Confirmed behaviour

- **First activity → suggests Suspect → Approach.** Any single activity of any
  type qualifies. Suggested, never silent, as with every SPANCOP move.
- **Logging with a different person moves the deal's *current contact*.**
  *Enquiry from* stays locked. Neither the deal nor the activity is otherwise
  affected.
- **Three views kept for now** — Timeline (default), By customer, Open tasks.
  We can drop one later once you have used it.

---

## 6. Activity types — CONFIRMED

**Site visit · Call · Email · Meeting · Demo · Casual follow-up · WhatsApp ·
Payment follow-up**

Note: *Demo* means **sample submitted**, so no separate Sample type is needed —
Demo covers it. Payment follow-up is in, so collection chasing is visible
separately from ordinary follow-up.

---

## 7. Deal linking — CORRECTED, no auto-select

My earlier proposal to auto-select the only open deal was **wrong**, and the
objection was right: a customer with one open deal still has conversations that
have nothing to do with it.

```
Customer A · 1 open deal (D-1042 Flower vases)
  Diwali greeting call            -> auto-select would tag it D-1042
  Site visit, met new F&B manager -> auto-select would tag it D-1042
  WhatsApp festive greetings      -> auto-select would tag it D-1042
  Coffee catch-up                 -> auto-select would tag it D-1042
```

The deal thread fills with noise and stops being trustworthy — the exact thing
deal-scoping was meant to prevent.

**Rule: nothing is preselected.** The field defaults to *"Not linked — general
relationship"*. The user picks a deal only when the conversation really was
about it.

- **Linked** → deal thread **and** customer journal
- **Not linked** → customer journal only

Two taps when it matters, and no risk of a polluted thread.

---

## 8. Context on every card

The log form shows the customer with area and business type, and the contact
list with role, collapsing past three exactly like the Contacts page.

Task, reminder and completion cards all carry the same block:

| Shown | Example |
| --- | --- |
| Type + title | Email · *Send quotation* |
| Customer | Atlantis The Palm · Palm Jumeirah, Dubai |
| Contact | Mr. Ankit Singh Chauhan · Purchasing Manager |
| Deal | `D-1042` Flower vases · AED 38,930 |
| Urgency | Due today / Overdue 2 days |
| Actions | Call · WhatsApp · Email, one tap |

Nothing has to be opened to know what a task is about.

---

## 9. Reminders — scope

In-app only: bell badge, dashboard tile, and overdue pinned in Open tasks.

**Email and WhatsApp reminders are not included.** Reaching you when the CRM is
closed needs a background scheduler, which is separate work. Flagged now rather
than discovered later.

---

## 10. Summary — DECIDED

**Option A, derived.** Latest activity plus oldest open task, shown as two
short facts. Accurate by construction, nothing extra to type.

AI (option C) can layer on later without rework, since it would sit on top of
the same derived data rather than replacing it.

---

## 11. Final three refinements

**1 · Unlinked activities show nothing.** No *"No deal — general"* chip. The
absence of a deal chip already communicates it; the chip was visual noise on
what is the more common case.

**2 · "Title" becomes a type-aware report field.** The label follows the type
rather than always reading "Title", which nudges a useful note instead of a
bare subject line:

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

Rendered as a textarea, not a single line, since a report needs room.

**3 · Task reminder — inline reveal, not a popup.**

The request was for a popup *after* saving. The instinct behind it is right —
the form should not carry two empty fields when most notes need no follow-up —
but asking after the save has a flaw:

> Once the record is already saved, answering **No** costs nothing, so it
> becomes the reflex. Follow-ups stop being set, the bell stays empty, and the
> reminder feature quietly goes unused.

In a sales CRM the follow-up date is the field that most needs a *little*
friction to skip, not the least.

**Same clean form, without that risk:** a single line under the report reading
**`+ Add follow-up task`**. Tap it and `Next task`, `Due date` and `Remind me`
expand in place. Ignore it and it stays one line.

| | Extra clicks over 10 activities (8 needing follow-up) |
| --- | --- |
| Always visible | 0, but two empty fields always on screen |
| Popup after save | 10 — asks even when the answer is no |
| **Inline reveal** ⭐ | 8 — only when actually needed |

Still one save. Nothing is asked twice.

---

## Ready to build

All decisions are closed:

| Decision | Outcome |
| --- | --- |
| Deal linking | Nothing preselected, user links deliberately |
| Types | Site visit · Call · Email · Meeting · Demo · Casual follow-up · WhatsApp · Payment follow-up |
| Journal | Newest 3 visible, older collapse, expand in place |
| Summary | Derived — last activity + next open task |
| Task overlap | Deal task creates a linked activity |
| Reminders | In-app only: bell, dashboard tile, open tasks |
| Views | Timeline (default) · By customer · Open tasks |
| SPANCOP | First activity of any type suggests Suspect to Approach |
| Unlinked activities | No chip — shown as normal |
| Report field | Label follows the type, textarea not single line |
| Task reminder | Same form, under "What happens next" |
