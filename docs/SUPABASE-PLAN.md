# Supabase — what I'll do, and what it touches

**Nothing built yet. Read this, then say go.**

---

## 0. Your safety net is already in place ✅

A named restore point is committed **and pushed to GitHub**:

```
stable-before-supabase
```

Everything works at that tag except persistence. If Supabase goes wrong at any
point, one command puts you back:

```powershell
git reset --hard stable-before-supabase
npm install
npm run dev
```

**I have tested this**, not just written it down: I cloned the repo, deliberately
destroyed a core file, ran the rollback, and confirmed the working file came
back. The net holds.

I will also build on a **separate branch**, so `main` is never touched until you
have tested and approved.

---

## 1. What Supabase actually is

A hosted **Postgres database** with a login system and file storage attached.
Your CRM stops keeping records in browser memory and starts reading and writing
to a real database in the cloud.

| | Today | After |
| --- | --- | --- |
| Where records live | Browser memory | Postgres, hosted |
| Survives refresh | ❌ | ✅ |
| Same data on phone | ❌ | ✅ |
| Team on one dataset | ❌ | ✅ |
| Login | none | email + password |
| Cost | — | free tier, ample here |

---

## 2. Who does what

### You — about 10 minutes, no technical knowledge

1. Create a free account at **supabase.com**
2. Click **New project**, name it, choose a region *(Frankfurt or Mumbai are
   closest to the UAE)*, set a database password and keep it somewhere safe
3. Open **Settings → API** and copy two values:
   - Project URL
   - `anon` public key
4. Paste both into a chat message to me

That is the whole of your part. I will send exact screenshots-level steps when
you are ready.

### Me — everything else

5. Create `.env.local` with your two keys *(git-ignored, never committed)*
6. Write the database schema — tables for companies, contacts, deals, line
   items, stage transitions, activities
7. Run the migration to create those tables
8. Load your existing demo data in, so the app is not empty on first run
9. Rewrite **one file** — `data-provider.tsx` — to read and write Supabase
10. Add login (email + password)
11. Turn on row-level security so one company's data cannot leak to another
12. Test every page, then hand it to you

---

## 3. Where the code changes — and where it does not

This is the part worth understanding.

### Changes

| File | Why |
| --- | --- |
| `data-provider.tsx` | The only file that talks to storage. Becomes async. |
| `.env.local` | **New.** Your keys. Never committed. |
| `supabase/schema.sql` | **New.** Table definitions. |
| `lib/supabase.ts` | **New.** Client setup. |
| `app/(auth)/login` | **New.** Login screen. |
| `middleware.ts` | **New.** Redirects signed-out users to login. |

### Does NOT change

- Companies page · Contacts · Deals Pipeline · SPANCOP funnel and report
- Dashboard · Settings · every dialog and form
- All the logic we agreed: SPANCOP rules, furthest-reached, active-days ageing,
  line items, lost reasons, category, CSV import

**Why:** every component already calls `useData()` and never touches storage
directly. That was deliberate from Part 5 — this is the moment it pays off.

### One real difference you will notice

Data arrives from the network, so it is no longer instant. Pages will show
**skeleton loaders** for a moment on first load. Saving shows a brief spinner
instead of updating instantly.

---

## 4. Honest risks

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Keys pasted into the wrong place | Low | `.env.local` is git-ignored; I will verify |
| Schema mismatch with our types | Medium | Schema generated from the existing TypeScript types |
| Login locks you out in testing | Low | I will seed your account first |
| Something else breaks | Low | Separate branch + tested rollback tag |

**The `anon` key is safe to share with me** — it is designed for browser use and
is protected by row-level security. Never share the `service_role` key or your
database password; I will not ask for them.

---

## 5. Suggested order — small, checkable steps

Rather than one large change, four stages. You test after each.

| Stage | What | You can check |
| --- | --- | --- |
| **1** | Line-item fixes + Settings cleanup *(no Supabase)* | Qty visible, price empty, gear icon |
| **2** | Connect Supabase, read-only | Existing data loads from the cloud |
| **3** | Writes — create, edit, delete | **Refresh and your record is still there** |
| **4** | Login + row-level security | Sign in, data is protected |

If any stage misbehaves we stop and fix before moving on. Rolling back one
stage is far easier than unpicking everything at once.

---

## 6. Also confirmed

**Theme gallery — dropped.** Display mode, colour theme and the six-theme
gallery all leave Settings. Theme switching stays in the top bar only.

Settings becomes:

```
Settings
  Data         Import · Export
  Currencies   Base AED, enabled currencies
```

---

## Say the word

Reply **"start stage 1"** and I will do the line-item and settings fixes with no
Supabase involved — a safe, visible first step.

When you are ready for the database I will send the Supabase signup walkthrough.
