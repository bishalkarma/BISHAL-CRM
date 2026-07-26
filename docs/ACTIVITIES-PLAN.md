# Activities — plan

**Discussion document. Nothing built until you confirm.**

---

## Why this one first

Three things we already agreed are waiting on it:

1. **SPANCOP Suspect → Approach** fires on *"≥1 activity logged"*. That rule
   exists in code but can never trigger, because there is no way to log an
   activity.
2. **Next action** and **Task** on a deal were agreed to appear in the customer
   activity log.
3. **"If we open the activities it should show all the activities from each and
   every customer"** — your words.

The `activities` table is already in Supabase from the schema we ran, so no new
migration is needed.

---

## What an activity is

A record of contact with a customer. Six types:

| Type | Typical use |
| --- | --- |
| **Call** | Phone conversation |
| **Visit** | Site or outlet visit |
| **Email** | Sent or received |
| **Meeting** | Scheduled discussion |
| **Sample** | Samples sent or collected |
| **Note** | Anything else worth recording |

### Fields

| Field | Required | Notes |
| --- | --- | --- |
| Type | ✅ | The six above |
| Company | ✅ | Same locked picker as deals |
| Contact | — | Defaults to the company primary |
| Deal | — | Optional link to a specific enquiry |
| Title | ✅ | *"Called about revised pricing"* |
| Notes | — | What was said |
| Date | ✅ | Defaults to now; can be back-dated |
| Follow-up date | — | Creates the next task |
| Done | — | Open tasks vs completed history |

---

## Two things it does automatically

### 1. Moves SPANCOP — with your approval

Logging the first activity against a Suspect triggers the suggestion we
designed:

> 🔵 **Suggested: Suspect → Approach**
> First activity logged — *Called about tableware requirement*
> **[ Move to Approach ]** **[ Keep at Suspect ]**

Never automatic, exactly as agreed for every SPANCOP move.

### 2. Moves the deal's current contact — automatically

Also as agreed: log an activity with a different person at the same company and
the deal's **current contact** follows, while **enquiry from** stays locked.

---

## The page

**Three views**, switchable:

- **Timeline** *(default)* — newest first, grouped Today / Yesterday / This week
- **By customer** — grouped per company, matching your "all activities from
  every customer" requirement
- **Open tasks** — only what is not done, sorted by due date, overdue in red

Filters: type · owner · company · date range · open-only.

**Also appears on:**
- **Company drawer** — that customer's history
- **Deal drawer** — that enquiry's history

---

## ⚠️ One decision — the deal Task field

There is now an overlap. A deal already has `task` + `taskDueDate` + `taskDone`,
and an activity can also be a task with a due date.

| Option | Result |
| --- | --- |
| **(a)** Keep both separate | Two places to look for "what must I do" |
| **(b)** Deal task becomes an activity ⭐ | One task list. The deal drawer shows its own tasks, the Activities page shows all of them |
| **(c)** Drop the deal task field | Loses the quick inline task on a deal |

*Recommendation: **(b)**. The deal keeps its task box exactly as it looks today,
but saving creates an activity behind it — so nothing is lost and there is a
single place that answers "what do I owe anyone".*

---

## Questions

1. **Deal task overlap** — (a), (b) ⭐ or (c)?
2. **Six types** — right list? Anything to add or drop for HORECA?
3. **Default view** — Timeline, or Open tasks?
