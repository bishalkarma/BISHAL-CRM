# Running Bishal Sales CRM on Windows 11

A complete, copy-paste guide. Takes about 5 minutes the first time.

---

## Step 0 — Check your tools (30 seconds)

Open **PowerShell**: press `Win`, type `powershell`, hit Enter.

Paste these two commands:

```powershell
node -v
git --version
```

You should see something like `v20.x.x` (or higher) and `git version 2.x.x`.

> **If `node -v` fails or shows below v18.18**, install the LTS version from
> <https://nodejs.org> → then **close and reopen PowerShell** and try again.

---

## Step 1 — Download the code

Pick a folder you like (this example uses your Documents folder):

```powershell
cd $HOME\Documents
git clone https://github.com/bishalkarma/BISHAL-CRM.git
cd BISHAL-CRM
```

Now switch to the branch that has all this work:

```powershell
git checkout arena/019f97e3-bishal-crm
```

Confirm you're in the right place:

```powershell
git branch --show-current
```

It should print `arena/019f97e3-bishal-crm`.

---

## Step 2 — Install dependencies (2–3 minutes)

```powershell
npm install
```

This downloads the libraries into a `node_modules` folder. It's normal for this
to take a couple of minutes and print a few warnings — that's fine.

---

## Step 3 — Start the app

```powershell
npm run dev
```

You'll see:

```
▲ Next.js 15.5.21
- Local:  http://localhost:3000
✓ Ready in 1.2s
```

Open your browser to **<http://localhost:3000>** — it lands on the Dashboard.

> **To stop the server:** click the PowerShell window and press `Ctrl + C`.
> **To start it again later:** `cd $HOME\Documents\BISHAL-CRM` then `npm run dev`.

---

## Step 4 — Hands-on test drive 🎮

Work through this list and note anything that feels off.

### A. The Dashboard

1. Watch the four KPI numbers — they **count up** when the page loads.
2. Hover a KPI card — it lifts slightly with a soft shadow and a faint glow.
3. Hover the revenue chart — a tooltip follows your cursor with exact figures.
4. Hover the donut chart segments — each shows its revenue and percentage.
5. In **Today's activities**, click a checkbox — the task strikes through.
   Click again to undo.
6. Note the red **overdue** timestamp on the last activity.

### B. Dark mode 🌙

- Click the **sun/moon icon** in the top-right. The whole app switches instantly.
- Or press **`Ctrl + J`** — same thing, no mouse.
- Both charts, shadows and borders re-tune themselves for dark mode.

### C. The six themes 🎨

1. Click the **palette icon** (top-right) → pick any of the six themes.
2. Watch buttons, charts, icons and highlights all re-colour instantly.
3. Now go to **Settings** in the sidebar for the full gallery with mini previews.
4. **Refresh the page (F5)** — your theme is remembered, with no flash of the
   old colour on load.
5. Try a theme in dark mode too — each has a hand-tuned dark variant.

Your three picks are all there: *Modern Corporate Blue*, *Vibrant Tech Teal* and
*Warm Executive Amber*, plus my three: *Signature Indigo*, *Fresh Growth Emerald*
and *Boutique Rose*.

### D. Command palette ⌘K — the speed feature

1. Press **`Ctrl + K`**.
2. Type `atl` → **Atlantis The Palm** deal appears. Press `Enter`.
3. Press `Ctrl + K` again, type `dark` → switch mode straight from the palette.
4. Press `Ctrl + K`, type `amber` → change theme without touching Settings.
5. Press **`Esc`** to close.

### E. Keyboard shortcuts ⌨️

Press **`?`** to see the full cheat sheet. Then try:

| Keys | What happens |
| --- | --- |
| `G` then `D` | Jump to Dashboard |
| `G` then `P` | Jump to Pipeline |
| `G` then `S` | Jump to Settings |
| `Ctrl + B` | Collapse / expand the sidebar |
| `Ctrl + J` | Toggle dark mode |
| `/` | Open quick search |
| `N` | New deal |

> Press `G` then `D` **as two separate taps**, not together.
> Shortcuts are ignored while you're typing in a text box — as they should be.

### F. Collapsible sidebar

- Click the **`‹` arrow** next to the logo (or `Ctrl + B`).
- Collapsed to icons only, hover any icon to see its tooltip.
- Refresh — it remembers your preference.

### G. Mobile view 📱 (important — this is a mobile-first app)

1. Press **`F12`** to open DevTools.
2. Press **`Ctrl + Shift + M`** to toggle device mode.
3. Choose **iPhone 14 Pro** from the device dropdown at the top.
4. Check each of these:
   - Sidebar is gone → **bottom tab bar** appears with 4 tabs
   - Tap between tabs → the little indicator line **slides** across
   - Tap the **blue + button** (bottom right) → 5 actions fan out with a
     blur behind, and the `+` rotates into an `×`
   - Tap the **hamburger menu** (top left) → full nav slides in from the left
   - KPI cards reflow into a **2×2 grid**
   - On the Dashboard, the deals table becomes **stacked cards** instead of
     a cramped table
5. Rotate to landscape and try a tablet size (iPad) too.

### H. Try installing it as an app

In Chrome/Edge, look for the **install icon** in the address bar — the app has a
PWA manifest, so it installs to your desktop or phone home screen.

---

## What's built vs. what's coming

**Working now:** Dashboard, Settings/Appearance, full theming, command palette,
shortcuts, and the complete responsive shell.

**Roadmap pages** — Pipeline, Companies, Contacts, Activities, Quotations,
Orders, Products, Reports — currently show a polished "coming soon" screen
listing the planned features. They're real, navigable routes, so the shell,
routing and mobile layout can all be tested end to end now.

---

## Troubleshooting

**`npm : cannot be loaded because running scripts is disabled`**

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Type `Y`, press Enter, then reopen PowerShell.

**`Port 3000 is already in use`**

```powershell
npm run dev -- -p 3001
```

Then browse to <http://localhost:3001>.

**`'git' is not recognized` / `'node' is not recognized`**
Close and reopen PowerShell after installing — Windows needs a fresh window to
pick up the new PATH.

**Page looks unstyled or broken**
Stop the server (`Ctrl + C`) and run:

```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

**Want a clean reinstall**

```powershell
Remove-Item -Recurse -Force node_modules, .next
npm install
npm run dev
```

---

## Feedback for the next part

As you test, jot down notes against these questions:

1. Which of the six themes should be the **default**?
2. Is the information on the dashboard the **right** information for your
   business — or should something be swapped out?
3. Do the pipeline stages (Lead → Qualified → Sampling → Quotation →
   Negotiation → Won/Lost) match how your team actually sells?
4. Is **AED** the right default currency? Do you need multi-currency?
5. Anything that felt slow, confusing, or cramped on your phone?

Send those back and I'll fold them into **Part 2 — the Deals Pipeline**.
