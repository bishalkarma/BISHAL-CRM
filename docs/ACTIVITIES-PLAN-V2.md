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

## 6. Questions

1. **Summary** — derived (a) ⭐, manual (b), or wait for AI (c)?
2. **Extra types** — add Sample and WhatsApp? And Payment follow-up, yes or no?
3. Anything wrong in how I have read the deal-versus-customer split?
