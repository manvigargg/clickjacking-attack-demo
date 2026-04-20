# Clickjacking Demo — Complete Walkthrough

**From zero to exploitation in under 10 minutes.**  
This guide covers setup, attacking, what the victim experiences, and how to detect clickjacking on real websites.

---

## Part 1 — Prerequisites & Setup

### Step 1.1 — Check if Python is installed

Open **PowerShell** or **Command Prompt**:

```powershell
python --version
```

**Expected output:**
```
Python 3.11.x   (any 3.6+ version is fine)
```

If you see an error like `'python' is not recognized`:

```powershell
# Try the alternate command first
python3 --version

# If still not found, download Python from:
# https://www.python.org/downloads/
# During install → CHECK "Add Python to PATH" ✅
```

**Verify pip is also available (optional, not needed for this demo):**
```powershell
pip --version
```

> ✅ This demo has **zero third-party dependencies** — only Python 3 standard library is used.

---

### Step 1.2 — Get the demo files

The demo lives at:
```
c:\Users\<you>\Desktop\New folder (2)\demo\
```

Confirm the structure exists:
```powershell
cd "c:\Users\<you>\Desktop\New folder (2)\demo"
dir
```

You should see:
```
    attacker\       ← Fake survey site (QuickSurvey.io)
    victim\         ← Target bank site (NorthPoint Bank)
    presentation\   ← Slides and this walkthrough
    run.py          ← Main launcher
    README.md
```

---

### Step 1.3 — Understand what each piece does

| File/Folder | Purpose |
|---|---|
| `victim/server.py` | Python HTTP server on port **8001** — serves the bank page |
| `victim/index.html` | NorthPoint Bank — Fund Transfer form with a "Confirm Transfer" button |
| `attacker/server.py` | Python HTTP server on port **8002** — serves the fake survey |
| `attacker/index.html` | QuickSurvey.io — The decoy lure page |
| `attacker/inject.js` | Core attack script — positions the invisible iframe |
| `run.py` | Starts both servers and opens the browser |

---

## Part 2 — Running the Demo (Attacker Perspective)

### Step 2.1 — Start both servers

Open PowerShell in the demo folder:

```powershell
cd "c:\Users\<you>\Desktop\New folder (2)\demo"
python run.py
```

**Expected terminal output:**
```
  Clickjacking Attack Demo
  ---------------------------------------------
  Victim mode: VULNERABLE

  Starting victim site   (NorthPoint Bank)  ...
  [victim:8001]  NorthPoint Bank running at http://localhost:8001 (VULNERABLE mode)
  Victim site ready      http://localhost:8001

  Starting attacker site (QuickSurvey.io)   ...
  [attacker:8002]  QuickSurvey running at http://localhost:8002
  Attacker site ready    http://localhost:8002

  Opening attacker page in browser ...

  ---------------------------------------------
  DEMO CONTROLS
    D key in browser       toggle debug overlay
    F12 DevTools console   see click intercept logs
    localhost:8001         visit victim site directly
  ---------------------------------------------
  Ctrl+C to stop.
```

> The browser opens automatically to `http://localhost:8002` (attacker page).

---

### Step 2.2 — What the attacker has set up

Visit `http://localhost:8002` — you see **QuickSurvey.io**:

```
┌────────────────────────────────────────────────────────┐
│ QuickSurvey                         Create survey  Sign in│
├────────────────────────────────────────────────────────┤
│                                                        │
│   Product feedback · Takes about 1 minute             │
│                                                        │
│   How was your recent experience with us?             │
│                                                        │
│   1 of 2 — RATE YOUR OVERALL EXPERIENCE?             │
│   ☆ ☆ ☆ ★ ★                                          │
│                                                        │
│   2 of 2 — WHAT COULD WE IMPROVE?                    │
│   ☑ Response time  ☐ Pricing  ☐ Support              │
│                                                        │
│   [ Submit feedback ]   ← The decoy button            │
│                                                        │
│   Responses are anonymous and used only to...         │
└────────────────────────────────────────────────────────┘
```

This **looks completely harmless**. The malicious part is invisible.

---

### Step 2.3 — Reveal the attack (Debug mode)

**Press the `D` key** on your keyboard while the attacker page is focused.

What you'll see:

```
┌──────────────────────────────────────────────────────────────────┐
│ DEBUG MODE — Red outline shows the invisible iframe.             │  ← Red banner
│ The decoy button is dimmed. Press D to hide. Shift+Arrow adjusts.│
├──────────────────────────────────────────────────────────────────┤
│ QuickSurvey                              Create survey  Sign in  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ★ ★ ★ ★ ★                                                    │
│   ☑ Response time  ☐ Pricing  ☐ Support                         │
│                                                                  │
│   [ Submit feedback ]  ← Dimmed (pointer-events: none)          │
│   ╔════════════════════════════════════════╗                     │
│   ║  NorthPoint Bank (35% opacity)        ║  ← Now visible!     │
│   ║  Transfer Funds                       ║                     │
│   ║  From: **** 4829   To: A. Tacker LLC  ║                     │
│   ║  Amount: $5,000.00                    ║                     │
│   ║  [ Cancel ]  [ Confirm Transfer ] ────╫──── Aligned here    │
│   ╚════════════════════════════════════════╝                     │
│                                                                  │
│ Alignment: top=777px, left=889px | D toggle, Shift+Arrows tune  │  ← Status bar
└──────────────────────────────────────────────────────────────────┘
```

The bank's **"Confirm Transfer"** button is sitting **directly under** the survey's **"Submit feedback"** button.

---

### Step 2.4 — Open DevTools to see the attack in the console

Press `F12` → **Console tab**.

You'll see pre-loaded debug info. Now **click "Submit feedback"** on the attacker page.

Console output:
```
▼ [ATTACKER] Click intercepted
    Coordinates :  305  758
    Time        :  2026-04-05T13:09:43.000Z
    Action      :  Click forwarded to hidden iframe
    Target      :  NorthPoint Bank — Confirm Transfer button

[VICTIM] Transfer triggered. Recipient: 9988776655. Amount: $5,000.00
```

The bank's transfer function fired. ✅

---

### Step 2.5 — Fine-tune alignment (if needed)

On different monitors or projector setups, alignment may be slightly off.

| Key | Action |
|---|---|
| `Shift + ↑` | Move iframe up (victim button moves up) |
| `Shift + ↓` | Move iframe down |
| `Shift + ←` | Move iframe left |
| `Shift + →` | Move iframe right |
| `R` | Reset to default calibration |
| `D` | Toggle debug overlay on/off |

The alignment value is saved to `localStorage` so it persists across page reloads.

---

## Part 3 — What the Victim Sees

### Step 3.1 — Open the victim (bank) site directly

In a **new browser tab** navigate to: `http://localhost:8001`

```
┌──────────────────────────────────────────────────────────────────┐
│ ███ NorthPoint Bank          Accounts  Transfers  Payments       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Primary Checking  │  Transfer Funds                             │
│ **** 4829         │  ──────────────────────────────────          │
│ $12,450.00        │  From account:  Primary Checking ▼          │
│                   │  Recipient:     9988776655                  │
│ MENU              │  Name:          A. Tacker Holdings LLC       │
│ Transaction Hx    │  Amount (USD):  5,000.00                    │
│ Fund Transfer ●   │  Date:          04/05/2026                  │
│ Pay Bills         │  ─────────────────────────────────          │
│ Statements        │  Transfer amount   $5,000.00               │
│ Settings          │  Processing fee    $0.00                    │
│                   │  Total deducted    $5,000.00               │
│                   │  ─────────────────────────────────          │
│                   │  [ Cancel ]  [ Confirm Transfer ]  ←        │
└──────────────────────────────────────────────────────────────────┘
```

This is the **target** page. The victim never sees this directly during the attack — they only see the fake survey page.

### Step 3.2 — What the victim experiences end-to-end

```
1. Victim receives a link:  "Rate our product! Takes 1 minute."
         ↓
2. Victim opens the link → sees QuickSurvey.io (harmless looking)
         ↓
3. Victim clicks a few stars, ticks a checkbox
         ↓
4. Victim clicks [ Submit Feedback ]
         ↓
5. On-screen: nothing unusual happens (the survey just sits there)
         ↓
   In reality: NorthPoint Bank's "Confirm Transfer" was clicked
               Transfer of $5,000 to A. Tacker Holdings LLC submitted
         ↓
6. Victim has no idea they triggered a bank transfer
```

The victim **never sees the bank page**, never gets a confirmation dialog, and never knows anything happened.

---

### Step 3.3 — Simulate the victim clicking

Turn debug mode **OFF** (press `D` again if it's on, or press `R` to reset).

The page looks completely normal again. Click **"Submit Feedback"**.

Check the **F12 Console** — the transfer fired silently.

On the victim page (`localhost:8001`) you'd also see a green toast notification:
```
Transfer of $5,000.00 to A. Tacker Holdings LLC has been submitted.
```

---

## Part 4 — Demonstrating the Defence

### Step 4.1 — Stop the current demo

In the terminal: press `Ctrl + C`

```
  Stopping servers ...
  Done.
```

---

### Step 4.2 — Restart in Defended Mode

```powershell
python run.py --defended
```

Terminal output:
```
  Victim mode: DEFENDED

  Starting victim site   (NorthPoint Bank)  ...
  [victim:8001]  NorthPoint Bank running at http://localhost:8001 (DEFENDED mode)
```

---

### Step 4.3 — What happens now

Visit `http://localhost:8002` (attacker page).

Press `D` to show the debug overlay.

**The iframe area is blank.** The bank page no longer loads inside the frame.

In the **F12 Console:**
```
Refused to display 'http://localhost:8001/' in a frame because it set
'X-Frame-Options' to 'deny'.
```

This is the browser itself rejecting the framing. ✅

---

### Step 4.4 — Inspect the defence headers

```powershell
curl -I http://localhost:8001
```

**Vulnerable mode:**
```http
HTTP/1.0 200 OK
Content-Type: text/html
Content-Length: 4948
```
No framing headers → can be embedded.

**Defended mode:**
```http
HTTP/1.0 200 OK
Content-Type: text/html
Content-Length: 4948
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
```
Both defence headers present → browser refuses framing.

---

## Part 5 — Checking Any Real Website for Clickjacking

### Method 1 — Curl / PowerShell Header Check

```powershell
# PowerShell (Windows)
Invoke-WebRequest -Uri "https://example.com" -Method HEAD | Select-Object -ExpandProperty Headers

# Or with curl if installed
curl -I https://example.com
```

**What to look for:**
```
X-Frame-Options: DENY          → Protected ✅
X-Frame-Options: SAMEORIGIN    → Partially protected ⚠️
Content-Security-Policy: ...frame-ancestors 'none'... → Protected ✅

(nothing)  →  VULNERABLE ❌
```

---

### Method 2 — Quick Browser Test (DevTools)

1. Open any website you want to test (e.g. your college portal, an e-commerce site)
2. Press `F12` → Console
3. Paste and run:

```javascript
var f = document.createElement('iframe');
f.src = window.location.href;
f.style = 'width:400px;height:300px;border:3px solid red';
document.body.appendChild(f);
```

- **Site renders inside the red box** → VULNERABLE ❌
- **Box stays blank / console shows CSP/XFO error** → PROTECTED ✅

---

### Method 3 — Online Tool (Fastest)

1. Go to **https://securityheaders.com**
2. Enter the URL of any website
3. Click **Scan**

Look for the row labelled:
- `X-Frame-Options` → should show green ✅
- `Content-Security-Policy` → check for `frame-ancestors`

An **A or B grade** generally means clickjacking protection is in place.

---

### Method 4 — Local Embed Test File

Create a file called `clickjack_test.html` anywhere on your PC:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Clickjacking Test</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #1e1e2e; color: #cdd6f4; }
    iframe { border: 3px dashed red; display: block; margin: 20px 0; }
  </style>
</head>
<body>
  <h2>🔍 Clickjacking Vulnerability Test</h2>
  <p>If the site below renders in the red box → it is <strong>VULNERABLE</strong> to clickjacking.</p>

  <iframe src="https://TARGET-SITE-HERE.com"
          width="900"
          height="600">
  </iframe>

  <p>If the box is blank or you see a browser error → it is <strong>PROTECTED</strong>.</p>
</body>
</html>
```

Replace `TARGET-SITE-HERE.com` with any site you want to test.  
Open the file in your browser — **no server needed** (just double-click the file).

---

## Summary — Full Demo Checklist

```
□ 1. Verify Python 3 is installed:         python --version
□ 2. Navigate to demo folder:              cd ".../demo"
□ 3. Start demo in vulnerable mode:        python run.py
□ 4. Show attacker page at               http://localhost:8002
□ 5. Press D — show debug overlay          (bank page revealed)
□ 6. Click "Submit Feedback"               (F12 console shows transfer fired)
□ 7. Open victim page at                 http://localhost:8001
         (show what was actually being clicked)
□ 8. Ctrl+C to stop
□ 9. Restart in defended mode:             python run.py --defended
□ 10. Show attacker page — iframe blank    (browser blocks framing)
□ 11. curl -I http://localhost:8001        (show XFO and CSP headers)
□ 12. Live test any real site:             securityheaders.com or browser snippet
```

---

## Glossary

| Term | Definition |
|---|---|
| `<iframe>` | HTML element that embeds another web page inside the current page |
| `opacity: 0` | CSS property making an element invisible but still interactive |
| `pointer-events` | CSS property controlling whether an element receives mouse/click events |
| `X-Frame-Options` | HTTP response header preventing a page from being embedded in a frame |
| `Content-Security-Policy` | HTTP header declaring security rules; `frame-ancestors` controls framing |
| `position: fixed` | CSS positioning relative to the viewport (not the document flow) |
| `localStorage` | Browser-side key-value storage, used to persist calibration settings |
| UI Redressing | Another name for clickjacking — the attacker "redresses" (re-skins) another site's UI |
| SameSite Cookie | Cookie attribute limiting cross-site cookie sending, partially mitigating session hijack |
| CSRF | Cross-Site Request Forgery — related attack; clickjacking can be used to submit CSRF actions |

---

*Walkthrough prepared for educational purposes. All testing is on localhost only.*
