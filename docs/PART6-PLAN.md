# Part 6 — Persistence, layout fixes, settings cleanup

**Discussion document. Nothing built until you confirm.**

---

## A. Why your data disappears on refresh 🔴

**Nothing is broken.** The data was never being saved — it only ever lived in
the browser's memory.

```
src/components/providers/data-provider.tsx

  useState(COMPANIES)   ← seeded from a file, held in memory
  useState(CONTACTS)    ← same
  useState(DEALS)       ← same
```

`useState` is **RAM**. Refresh the page and React rebuilds the app from the
original seed file, so every record you added is gone. Only four things survive
today — theme, currency, sidebar and the accent colour — because those *are*
written to `localStorage`.

This was always the plan: Part 1 said the demo data would be replaced by a real
backend. You have simply reached the point where it matters.

### Three ways forward

| | What it is | Survives refresh | Multi-device | Team sharing | Effort |
| --- | --- | --- | --- | --- | --- |
| **A. localStorage** | Saved in your browser | ✅ | ❌ | ❌ | ~1 hour |
| **B. Supabase** ⭐ | Real Postgres database | ✅ | ✅ | ✅ | ~1 day |
| **C. Leave as demo** | Resets every refresh | ❌ | ❌ | ❌ | none |

### On option A

Data lives in *that browser only*. Clearing history wipes it, your phone shows
nothing, and a second user sees an empty CRM. Fine for continued testing —
never a real system.

### On option B ⭐

The Supabase libraries are already installed and the data layer was written so
that `DataProvider` is the only file that needs to change — no component
touches storage directly. That was deliberate.

Supabase also brings what a real CRM needs:

- **Login** — the app currently has no accounts at all
- **Multi-user** — your team on the same data, live
- **Row-level security** — reps see their own accounts
- **File storage** — quotations, trade licences, product images
- **Free tier** — sufficient for a business this size

**Recommendation: B.** A is a detour that gets thrown away; it only makes sense
if you want to keep testing offline for a few weeks first.

**Question:** shall I wire Supabase next, or put localStorage in as a stopgap?

---

## B. Line-item row — spacing bugs 🐛

Two real defects in the same row (your screenshot):

### 1. Quantity is cut off

The Qty column is **74px**, but it holds *both* the number input and the unit
dropdown. The dropdown takes ~50px, leaving ~24px for the number — so `455`
gets clipped.

**Fix:** widen the column to 120px and give the input a sensible minimum.
Qty and Unit each get real room.

### 2. Unit price shows a literal `0`

The field is seeded with the number `0`, so you must delete it before typing.
Every price ends up typed as `085.56` unless you notice.

**Fix:** start both price and quantity **empty** with a faint placeholder, and
treat empty as zero for the total. Nothing to delete first.

### Also worth fixing while there

- **Line total** shows a bare `38930` — should read `AED 38,930`
- On mobile the six columns cram; give each field its own labelled row

---

## C. Settings — remove the duplication ✅

Agreed. Display mode and colour theme are already one click away in the top
bar, so Settings repeats them for no reason.

**Settings becomes:**

```
Settings
  Data          Import · Export
  Currencies    Base AED, enabled currencies
```

**Top bar gains a gear icon**, next to the avatar:

```
🔔   🎨   🌙   ⚙️   BK
```

### One question

The top-bar palette icon changes the accent theme, but only offers a small
dropdown. The Settings gallery showed all six with live previews. Options:

- **(a)** Drop the gallery entirely — the dropdown is enough
- **(b)** Keep a **Appearance** section in Settings with only the six-theme
  gallery, and drop the light/dark buttons *(they are the moon icon)* ⭐

*Recommendation: **(b)**. The dropdown is fine for a quick switch, but picking a
theme properly benefits from seeing the previews side by side.*

---

## Proposed order

1. 🐛 Qty width + empty price fields + currency on line totals
2. Settings cleanup + gear icon in the top bar
3. 💾 Persistence — Supabase or localStorage, your call

---

## Confirm

1. **Persistence** — Supabase now ⭐, or localStorage stopgap first?
2. **Theme gallery** — drop it (a), or keep just the six-theme picker (b) ⭐?
