# Companies — Field Proposal

**Decision needed before Part 3 is built.** Pick a tier (A / B / C), then add or
remove individual fields. Nothing here is locked.

Legend: 📋 = from your sheet · ⭐ = my suggestion · `*` = required

---

## 1. Your sheet, mapped

Every column from your source-of-truth sheet is carried over — nothing is dropped.

| Your column | Becomes | Notes |
| --- | --- | --- |
| PROPERTY NAME | `name` | Company / property name |
| LOCATION / AREA | `area` | Dubai Marina, JBR, Deira… |
| CONTACT PERSON | `contact.name` | Becomes a *list* — see §3 |
| ROLE / TITLE | `contact.role` | Picklist, not free text |
| EMAIL ADDRESS | `contact.email` | |
| PHONE NO. | `contact.phone` | + WhatsApp flag |
| BUSINESS TYPE | `businessType` | Picklist |
| Star Ratings | `starRating` | 5★ / 4★ / 3★ / Boutique / Unrated |
| REMARKS | `remarks` | Free text + timestamped notes |
| SPANCOP | `spancop` | S-P-A-N-C-O-P picklist |
| LEAD STATUS | `leadStatus` | Hot / Warm / Cold / Dormant |

---

## 2. Full field catalogue

### A · Identity & classification

| Field | Src | Detail |
| --- | --- | --- |
| Property name `*` | 📋 | Trading name |
| Business type `*` | 📋 | Hotel · Restaurant · Café · Hotel Project · Cloud Kitchen · Bakery · Lounge/Bar · Catering · Distributor · Supermarket |
| Star rating | 📋 | 5★ · 4★ · 3★ · Boutique · Unrated |
| **Group / parent company** | ⭐ | *Jumeirah Group*, *Marriott Cluster*. Lets you roll 8 properties into one relationship and see total group spend. |
| **Chain or independent** | ⭐ | Chains buy centrally — changes who you sell to |
| **Account tier** | ⭐ | A / B / C — key account vs long tail |
| **Logo** | ⭐ | Instant visual recognition in lists |
| **Website / Instagram** | ⭐ | Instagram is how F&B venues are researched here |

### B · Location & territory

| Field | Src | Detail |
| --- | --- | --- |
| Location / Area `*` | 📋 | Dubai Marina, JBR, Deira, Al Quoz… |
| **Emirate** | ⭐ | Dubai · Abu Dhabi · Sharjah · Ajman · RAK · Fujairah · UMQ — drives territory & rep assignment |
| **Full address** | ⭐ | For delivery notes and invoices |
| **Map pin** | ⭐ | One tap to navigate — reps live in the car |

### C · Contacts

> **Recommendation:** make contacts a **repeatable list**, not four fixed columns.
> A hotel realistically has an Executive Chef, a Purchasing Manager and an F&B
> Director — and you lose deals when you only hold one of them.

| Field | Src | Detail |
| --- | --- | --- |
| Contact person `*` | 📋 | |
| Role / title `*` | 📋 | Exec Chef · Head Chef · F&B Manager · Purchasing Mgr · Storekeeper · GM · Owner · Finance |
| Email `*` | 📋 | |
| Phone `*` | 📋 | |
| **WhatsApp** | ⭐ | Separate from phone — the real channel in the UAE |
| **Primary contact flag** | ⭐ | One marked primary, shown in list views |
| **Decision maker flag** | ⭐ | Who actually signs |
| **Birthday** | ⭐ | Relationship selling |

### D · Hospitality profile ⭐ *the differentiator*

> None of the big CRMs have these. This is what makes the product yours.

| Field | Src | Detail |
| --- | --- | --- |
| **No. of F&B outlets** | ⭐ | A hotel with 8 restaurants is worth 8× one with a single café |
| **No. of rooms** | ⭐ | Best proxy for consumption volume |
| **Avg covers / day** | ⭐ | Volume estimate for restaurants |
| **Cuisine type** | ⭐ | Italian, Japanese, Indian… drives product fit |
| **Opening date** | ⭐ | Critical for pre-opening projects — order 3 months before |
| **Receiving hours** | ⭐ | e.g. *06:00–10:00 only, loading bay B*. Prevents rejected deliveries |
| **Kitchen / storage notes** | ⭐ | Freezer capacity limits order size |

### E · Commercial & credit ⭐ *trading essentials*

| Field | Src | Detail |
| --- | --- | --- |
| **TRN (VAT number)** | ⭐ | Legally required on UAE tax invoices |
| **Trade licence no.** | ⭐ | |
| **Licence expiry** | ⭐ | Auto-reminder before it lapses |
| **Credit limit** | ⭐ | |
| **Payment terms** | ⭐ | Advance · COD · Net 15 / 30 / 60 / 90 · PDC |
| **Credit status** | ⭐ | Good · Watch · **On hold** — blocks new orders |
| **Outstanding balance** | ⭐ | |
| **Preferred currency** | ⭐ | Uses the multi-currency engine already built |
| **Billing address** | ⭐ | Often differs from delivery |

### F · Sales tracking

| Field | Src | Detail |
| --- | --- | --- |
| SPANCOP `*` | 📋 | Suspect · Prospect · Approach · Negotiate · Close · Order · Payment |
| Lead status `*` | 📋 | Hot · Warm · Cold · Dormant |
| Remarks | 📋 | Free text **plus** timestamped note history |
| **Account owner** | ⭐ | Assigned rep |
| **Lead source** | ⭐ | Referral · Walk-in · Exhibition · Instagram · Cold call · Website |
| **Last order date** | ⭐ | |
| **Reorder gap alert** | ⭐ | "No order in 45 days" — catches churn before it happens |
| **Lifetime / YTD value** | ⭐ | |
| **Next follow-up date** | ⭐ | Feeds the Activities module |
| **Tags** | ⭐ | Free-form: *Ramadan menu*, *Halal only*, *Organic* |

---

## 3. Two things worth deciding

### ⚠️ SPANCOP vs pipeline stages

Your SPANCOP column and the deal pipeline overlap:

```
SPANCOP   Suspect → Prospect → Approach → Negotiate → Close → Order → Payment
Pipeline  Lead → Qualified → Quotation → Negotiation → Sampling → Won/Lost
```

**My recommendation — keep both, they answer different questions:**

- **SPANCOP** = where the *relationship* stands (company level)
- **Pipeline** = where a *specific deal* stands (deal level)

A hotel can be at **Order** (buying monthly) while a new deal for their pool bar
sits at **Quotation**. That is normal and useful.

*Alternatives:* (a) SPANCOP only, drop pipeline stages · (b) auto-derive SPANCOP
from the furthest deal, no manual entry.

### Star rating for non-hotels

Restaurants and cafés have no star rating. Options:
**(a)** show the field only for Hotels / Hotel Projects *(recommended)* ·
**(b)** always show, default "Unrated" · **(c)** repurpose as your own A/B/C quality score.

---

## 4. Pick a tier

### 🅰️ Lean — *your sheet, digitised* · 11 fields
Exactly your columns, nothing more. Fast to fill, instantly familiar.
**Trade-off:** no credit control, no VAT/TRN, no churn detection.

### 🅱️ Recommended — *your sheet + trading essentials* · ~26 fields ⭐
Everything in your sheet **plus** Group/parent, Emirate, multiple contacts,
WhatsApp, outlets & rooms, TRN, trade licence, credit limit, payment terms,
credit status, account owner, lead source, last order date, reorder alert, tags.

Optional fields stay collapsed under "Show more", so day-to-day entry still
feels like your sheet.
**Why this one:** it's the smallest set that supports real trading — you cannot
raise a compliant UAE invoice without a TRN, and you cannot protect cash flow
without credit terms.

### 🅲 Full enterprise — *everything above* · ~40 fields
Adds covers/day, cuisine, receiving hours, storage notes, licence expiry alerts,
outstanding balance, birthdays, decision-maker mapping, lifetime value.
**Trade-off:** more to maintain. Best once the core is running.

---

## 5. Also planned for the Companies module

Regardless of tier:

- **List + card + map views**, switchable
- **Excel / CSV import** — bring your existing sheet across in one go
- **Inline editing** — click a cell, edit, done (spreadsheet speed)
- **Saved views** — "My 5★ hotels in Dubai", "Credit on hold", "No order 60 days"
- **Duplicate detection** on create
- **Company detail page** — contacts, deals, orders, notes, files in one place
- **Bulk actions** — reassign owner, tag, export
- **Mobile**: tap-to-call, tap-to-WhatsApp, tap-to-navigate

---

## ✅ Reply with

1. **Tier** — A, B or C
2. **Add / remove** any individual fields
3. **SPANCOP** — keep both, or one?
4. **Star rating** — hotels only, or everyone?
