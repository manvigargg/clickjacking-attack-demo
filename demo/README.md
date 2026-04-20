# Clickjacking Attack Demo

Educational demo for security presentations. Simulates a real-world clickjacking attack
against a banking portal using a fake survey site as the lure.

**For academic and presentation purposes only.**

---

## What this demonstrates

Clickjacking (UI redressing) works by loading a target site inside a transparent iframe
and positioning it so the victim's interactive elements overlap with a decoy UI.
The user believes they are clicking one thing while actually clicking another.

This repo contains two independent sites and a launcher:

| Component | Port | Role |
|---|---|---|
| `victim/` | 8001 | NorthPoint Bank — a realistic banking portal missing `X-Frame-Options` |
| `attacker/` | 8002 | QuickSurvey.io — a convincing lure site |
| `run.py` | — | Launches both servers and opens the browser |

---

## How to run

```bash
python run.py
```

Run with victim-side protection enabled:

```bash
python run.py --defended
```

Run without opening a browser automatically:

```bash
python run.py --no-browser
```

Requires Python 3.6+. No third-party dependencies.

The browser will open `http://localhost:8002` (the attacker page) automatically.

---

## Demo walkthrough

1. **Normal view** — The attacker page looks like a harmless survey site asking you to rate a product.
   The "Submit Rating" button is visible and styled naturally.

2. **What is actually happening** — An invisible iframe loads the bank's fund transfer page.
   The iframe is offset so the bank's "Confirm Transfer" button sits directly under "Submit Rating".

3. **Press D** — Toggles the debug overlay. The iframe becomes semi-transparent (red border),
   revealing the real bank page underneath the decoy.

4. **Calibrate if needed** — Use **Shift + Arrow Keys** to tune button alignment for your
  projector/screen size. Press **R** to reset alignment defaults.

5. **Click the button** — The bank's transfer form submits. The attacker captures the action.

6. **Show mitigation** — Restart with `python run.py --defended` and reload the attacker page.
  The victim page can no longer be framed due to anti-clickjacking headers.

---

## Attack anatomy

```
Attacker page
+--------------------------------------------------+
|  [Survey UI visible to user]                     |
|                                                  |
|   Rate this product:  * * * * *                  |
|                                                  |
|   +------------------------------------------+  |
|   |  [Submit Rating]  <- user sees this       |  |
|   |  ______________________________________   |  |
|   |  |  INVISIBLE IFRAME (opacity: 0)      |  |  |
|   |  |  NorthPoint Bank - Transfer Funds   |  |  |
|   |  |                                     |  |  |
|   |  |  [Confirm Transfer] <- user clicks  |  |  |
|   |  |_____________________________________| |  |
|   +------------------------------------------+  |
+--------------------------------------------------+
```

The iframe is:
- Loaded from `http://localhost:8001` (victim site)
- Sized 900x700px, positioned with a negative top offset to align the bank button
- Set to `opacity: 0` so it is completely invisible
- Set to `pointer-events: auto` so it receives click events
- The decoy button has `pointer-events: none` so clicks fall through to the iframe

---

## Why this works

The victim site (`localhost:8001`) does **not** send the `X-Frame-Options` header or a
`Content-Security-Policy: frame-ancestors` directive. This allows any page to embed it
inside an iframe.

---

## Defence

Add any one of these headers to the victim server response:

```
X-Frame-Options: DENY
```
or
```
Content-Security-Policy: frame-ancestors 'none'
```

In `victim/server.py`, the `send_header` call is commented out with a `DEFENCE:` label.
Uncomment it to see the browser refuse to render the iframe.

---

## File structure

```
clickjacking-demo/
  run.py                  # launcher
  victim/
    server.py             # Python HTTP server for the bank site
    index.html            # NorthPoint Bank — transfer funds page
    style.css             # Bank site styles
  attacker/
    server.py             # Python HTTP server for the lure site
    index.html            # QuickSurvey.io — fake survey lure
    style.css             # Attacker site styles
    inject.js             # iframe positioning + debug overlay logic
  docs/
    attack-diagram.md     # Detailed technical breakdown
```
