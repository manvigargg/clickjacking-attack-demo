# Clickjacking Attack
### UI Redressing — How Invisible Iframes Steal Your Clicks

**Course / Module:** Web Security Fundamentals  
**Topic:** Client-Side Attacks  
**Presented by:** [Your Name]  
**Date:** April 2026

---

---

## Slide 1 — What is Clickjacking?

> _"You think you're clicking one thing. You're actually clicking another."_

**Clickjacking** (also called **UI Redressing**) is a web-based attack where a malicious page tricks a user into **clicking something invisible** — typically a sensitive button on a legitimate site — by overlaying it with a convincing decoy interface.

### How it works in one sentence:
An attacker embeds a **trusted site inside an invisible `<iframe>`** and positions a real interactive element (e.g. "Confirm Transfer") directly under a fake decoy button (e.g. "Submit Rating").

### Key insight:
- The user sees the **attacker's page** (surveys, games, prize wheels)
- The user clicks **the victim's page** (banks, social media, email)

---

## Slide 2 — History & Timeline

```
2002  ─── First theoretical discussion of iframe overlay attacks
2008  ─── Named "Clickjacking" by Jeremiah Grossman & Robert Hansen
           Adobe Flash plugin settings panel hijacked — mass exploitation
2009  ─── Twitter "Don't Click" worm spreads via clickjacked tweet button
           500,000+ retweets in 24 hours triggered by a single click
2010  ─── Facebook "Like" button clickjacking ("Likejacking") epidemic
           Millions of fake "Likes" on spam pages
2012  ─── Browser vendors begin shipping X-Frame-Options support
2013  ─── CSP frame-ancestors directive standardised (RFC 7034)
2014  ─── Android WebView clickjacking vulnerability (CVE-2014-6041)
           Affected ~75% of Android devices at the time
2016  ─── PayPal clickjacking — attackers could trigger payments
2019  ─── Reverse clickjacking (drag-and-drop variant) documented
2022+ ─── Modern apps still vulnerable; OWASP Top 10 A05 (Broken Access Control)
```

### Why it still matters in 2026:
- Thousands of active sites missing `X-Frame-Options` / CSP headers
- Single-page apps (React, Vue) often misconfigure security headers
- Mobile webviews frequently omit frame-busting defences

---

## Slide 3 — The Anatomy of an Attack

```
┌─────────────────────────────────────────────────────────┐
│            ATTACKER'S PAGE (QuickSurvey.io)             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Rate your experience:  ★ ★ ★ ★ ★              │   │
│  │  ─────────────────────────────────────────────  │   │
│  │  ┌────────────────────────────────────────────┐ │   │
│  │  │      [ Submit Feedback ]  ← USER SEES THIS │ │   │
│  │  │  ┌──────────────────────────────────────┐  │ │   │
│  │  │  │  INVISIBLE IFRAME  (opacity: 0)       │  │ │   │
│  │  │  │  NorthPoint Bank — Transfer Funds     │  │ │   │
│  │  │  │                                       │  │ │   │
│  │  │  │       [ Confirm Transfer ] ←──────────┼──┼─┼── USER ACTUALLY CLICKS THIS
│  │  │  └──────────────────────────────────────┘  │ │   │
│  │  └────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Attack ingredients:
| Component | Role |
|---|---|
| `<iframe src="victim.com">` | Embeds the target site |
| `opacity: 0` | Makes iframe invisible |
| `pointer-events: auto` on iframe | iframe receives all clicks |
| `pointer-events: none` on decoy | Clicks fall through to iframe |
| CSS `transform: translate(x, y)` | Aligns victim button with decoy |

---

## Slide 4 — Types of Clickjacking

### 1. Classic Clickjacking
Invisible iframe overlaid on a decoy button. The most common form.  
**Target:** Bank transfers, OAuth confirmations, account deletion

---

### 2. Likejacking / Social Hijacking
Overlaying Facebook Like, Twitter Follow, or YouTube Subscribe buttons under harmless content.  
**Effect:** Spam propagation, fake social proof, data harvesting

---

### 3. Cursorjacking
Spoofing the CSS cursor to shift perceived click position 10–50px from the actual click target.  
**Effect:** User thinks they're clicking one thing, CSS cursor lies about where

---

### 4. Filejacking / Drag-and-Drop Clickjacking
Tricking the user into **dragging text** from a hidden iframe into a visible field, leaking cross-origin content.  
**Target:** Gmail, Outlook (reading private email content)

---

### 5. Tapjacking (Mobile)
On touchscreen devices, a transparent overlay captures taps.  
**Context:** Android WebViews, mobile browsers missing touch-action controls  
**CVE:** CVE-2014-6041 affected Android < 4.4

---

### 6. Reverse Clickjacking
Attacker moves a **floating element** onto visible actions using animation, so the target changes at click-time.  
**Stealth:** Very hard to detect visually

---

### 7. Multi-step Clickjacking
Multiple clicks required — attacker uses a sequence of decoy buttons (e.g., "Next → Next → Confirm") to step through a multi-page sensitive flow.

---

## Slide 5 — Real-World Case Studies

### Case 1: Adobe Flash (2008)
- The Flash plugin settings panel was hosted at a fixed URL: `macromedia.com/support/flashplayer/ts/documents/tn_16494.htm`
- Attackers embedded it in an invisible iframe
- Users could be tricked into **enabling their webcam/microphone** without knowing

### Case 2: Twitter Worm (2009)
```
User visits malicious page
→ Invisible iframe loads twitter.com/intent/tweet
→ "Click here to see your IQ!" → User clicks → Tweet posted
→ Tweet contains same malicious link → spreads
→ 500,000 retweets in 24h
```

### Case 3: Facebook Likejacking (2010)
- Attacker page: "See who viewed your profile"  
- Hidden: `<iframe src="facebook.com/plugins/like.php?href=spampage">` at opacity 0  
- Result: Mass fake Likes, spam spread virally

### Case 4: PayPal (2016)
- Researchers found PayPal payment confirmation could be framed
- Attacker could construct a page triggering a payment transfer to attacker account with a single user click

---

## Slide 6 — Why Websites Are Vulnerable

```
HTTP Response Headers on a Vulnerable Server:

  HTTP/1.1 200 OK
  Content-Type: text/html
  ← No X-Frame-Options header
  ← No Content-Security-Policy header
  ← No frame-busting JavaScript
```

```
HTTP Response Headers on a Protected Server:

  HTTP/1.1 200 OK
  Content-Type: text/html
  X-Frame-Options: DENY
  Content-Security-Policy: frame-ancestors 'none'
```

### Common reasons sites remain vulnerable:
- Legacy codebases with no header management
- CDN / reverse proxy stripping custom headers
- Developers unaware of the attack vector
- API-first backends that don't consider browser framing
- SPA frameworks where only the bundled app, not the server, is configured

---

## Slide 7 — Defences & Safeguards

### Defence 1: `X-Frame-Options` Header ✅
```http
X-Frame-Options: DENY
```
Tells the browser: **never** allow this page in any `<iframe>`, `<frame>`, or `<object>`.

```http
X-Frame-Options: SAMEORIGIN
```
Allows embedding only by pages on the **same origin**.

> ⚠️ `X-Frame-Options` is older and does not support wildcards or multiple origins. Use CSP for more control.

---

### Defence 2: `Content-Security-Policy: frame-ancestors` ✅ (Recommended)
```http
Content-Security-Policy: frame-ancestors 'none'
```
Like `X-Frame-Options: DENY` but more flexible:

```http
Content-Security-Policy: frame-ancestors 'self' https://trusted-partner.com
```
Only allow framing from the same origin OR a specific trusted domain.

> ✅ More powerful than XFO — supports lists, wildcards, and is the modern standard.

---

### Defence 3: Frame-Busting JavaScript (Legacy, Unreliable)
```html
<script>
  if (top !== self) { top.location = self.location; }
</script>
```
> ❌ **Easily bypassed** with `sandbox="allow-scripts"` on the iframe.  
> Only use as a last resort on old browsers. Not a substitute for headers.

---

### Defence 4: `SameSite` Cookie Attribute
```http
Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly
```
Prevents the victim's session cookie from being sent when the page is embedded cross-origin.  
> Mitigates the *impact* but does not prevent the attack entirely.

---

### Defence 5: CSP `sandbox` Directive
If you **must** embed third-party content, sandbox it:
```html
<iframe sandbox="allow-scripts allow-same-origin" src="..."></iframe>
```
Remove `allow-forms` and `allow-top-navigation` to restrict what the embedded page can do.

---

### Summary Table

| Defence | Prevents Framing | Browser Support | Complexity |
|---|---|---|---|
| `X-Frame-Options: DENY` | ✅ Yes | All modern | Low |
| `CSP: frame-ancestors 'none'` | ✅ Yes | All modern | Low |
| Frame-busting JS | ⚠️ Unreliable | All | Medium |
| SameSite Cookies | ⚠️ Partial | All modern | Low |
| Sandbox attribute | ✅ Partial | All modern | Medium |

---

## Slide 8 — How to Detect Clickjacking Vulnerability

### Method 1: Manual Browser Check
Open DevTools → Console and run:
```javascript
// Try to embed the target site in an iframe
var f = document.createElement('iframe');
f.src = 'https://target-site.com';
document.body.appendChild(f);
// If the iframe loads with content → VULNERABLE
// If it shows blank / console error → PROTECTED
```

---

### Method 2: Check Response Headers (curl)
```bash
curl -I https://target-site.com
```
Look for:
```
X-Frame-Options: DENY           ← Protected
X-Frame-Options: SAMEORIGIN     ← Protected (partially)
Content-Security-Policy: ...frame-ancestors...  ← Protected
```
If **neither** header is present → **Likely vulnerable**

---

### Method 3: Online Scanners
- **securityheaders.com** — Free header scanner, grades A–F
- **Mozilla Observatory** — observatory.mozilla.org
- **OWASP ZAP** — Full automated scanner
- **Burp Suite** → Passive scan flags missing XFO/CSP headers

---

### Method 4: Embed Test HTML
```html
<!DOCTYPE html>
<html>
<body>
  <h2>Clickjacking Test</h2>
  <iframe src="https://target-site.com"
          width="800" height="600"
          style="border: 2px solid red">
  </iframe>
  <p>If the site appears in the red box above → VULNERABLE</p>
</body>
</html>
```
Save as `test.html`, open in browser locally.  
If the target page renders inside the red iframe → **it is frameable → clickjacking risk**.

---

## Slide 9 — OWASP & CVE Context

### OWASP Classification
- **OWASP Top 10 2021:** A05 — Security Misconfiguration  
- **OWASP Testing Guide:** WSTG-CLNT-09 (Testing for Clickjacking)

### Common CVEs

| CVE | Year | Target | Impact |
|---|---|---|---|
| CVE-2009-1681 | 2009 | Safari | Cross-origin click capture |
| CVE-2014-6041 | 2014 | Android WebView | Tapjacking on ~75% of Android |
| CVE-2015-2440 | 2015 | Internet Explorer | Frame confusion |
| CVE-2016-5546 | 2016 | Oracle Java | Applet clickjacking |
| CVE-2021-21220 | 2021 | Google Chrome | Frame navigation bypass |

### CVSS Severity
Typically rated **Medium (5.3–6.1)** — high usability requirement (user must click)  
but can escalate to **High** when paired with CSRF or sensitive one-click actions.

---

## Slide 10 — Attack vs Defence Flow

```
ATTACK FLOW                         DEFENCE FLOW
─────────────────────────────────   ─────────────────────────────────
Attacker creates fake page          Developer adds header to server:
  → Embeds victim in iframe           X-Frame-Options: DENY
  → Opacity set to 0
  → Decoy UI placed over it         Browser receives page response
  → Victim's button aligned           → Sees X-Frame-Options: DENY
    with decoy button                 → Refuses to render iframe content
                                      → Shows blank/broken frame instead
User visits attacker page
  → Sees only the decoy UI         User visits attacker page
  → Clicks "Submit Feedback"         → Blank iframe appears
  → Victim's action fires             → Attack fails silently

Result: Transfer/Action Confirmed   Result: Attack blocked ✅
```

---

## Slide 11 — Live Demonstration

### What We Built

A fully dynamic local simulation:

| Component | Role |
|---|---|
| NorthPoint Bank `8001/login.html` | Convincing bank login page (simulates victim's existing active session, auto-redirects) |
| NorthPoint Bank `8001/index.html` | The target transfer page missing `X-Frame-Options` |
| Attacker Email `8002/landing.html` | Phishing email simulating the initial lure |
| QuickSurvey.io `8002/index.html` | Cloned "ShopEase Rewards" UI with fake trust badges |

---

### The Attack Narrative

**"How does the attacker know the credentials?"**
They don't! The attack relies on the victim **already having an active browser session** (a saved cookie) with the targeted bank.

1. Victim clicks a phishing link in an email 
2. Victim arrives at the attacker's branded survey (which embeds the bank login form hidden)
3. Because the victim has active cookies, the embedded bank page auto-authenticates and redirects to the Transfer Funds page.
4. The victim clicks the visible "Submit Feedback" button.
5. The hidden "Confirm Transfer" button receives the click!

---

### The Attack Mechanism

```
ShopEase Rewards Survey (localhost:8002)
┌──────────────────────────────────────────────────────────┐
│  How was your experience with your recent order?         │
│  ★ ★ ★ ★ ★                                             │
│  ─────────────────────────────────────────────────────  │
│  What could we improve?                                   │
│  ☑ Delivery speed                                          │
│                                                          │
│  ┌─────────────────────────────────┐                    │
│  │  [ Submit Feedback ]            │  ← User sees this  │
│  │  ╔═════════════════════════════╗│                    │
│  │  ║  INVISIBLE IFRAME (Bank)   ║│                    │
│  │  ║  [ Confirm Transfer $5000 ]║│  ← User clicks this│
│  │  ╚═════════════════════════════╝│                    │
│  └─────────────────────────────────┘                    │
│  🔒 256-bit SSL encrypted  ✔️ Verified by TrustSafe         │
└──────────────────────────────────────────────────────────┘
```

---

### What Was Achieved

✅ **Zero-credential session hijack** — Attacker performs authenticated actions without stealing passwords  
✅ **Dynamic auto-calibration** — Iframe pixel-perfectly aligns itself on any screen resolution  
✅ **UI Redressing** — Fake trust badges and progress bars maximize victim trust  
✅ **Defence mode** — X-Frame-Options blocks the entire attack  

---

### Key Technical Insight

The attacker does **not** need any server-side access to the victim's site.  
They only need:
1. The victim site to be **frameable** (no `X-Frame-Options`)
2. The victim button's **pixel coordinates** within the page (measurable via DevTools)
3. A convincing lure page that looks legitimate

One missing HTTP header is all it takes.

---

### The Fix — One Line

```python
# victim/server.py
self.send_header("X-Frame-Options", "DENY")
# or
self.send_header("Content-Security-Policy", "frame-ancestors 'none'")
```

Demo: restart with `python run.py --defended` → **attack fails immediately**.

---

## References

- OWASP Clickjacking Defence Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html
- OWASP Testing Guide WSTG-CLNT-09: https://owasp.org/www-project-web-security-testing-guide/
- RFC 7034 — HTTP Header X-Frame-Options: https://tools.ietf.org/html/rfc7034
- Mozilla MDN — X-Frame-Options: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
- Grossman & Hansen (2008) — Original Clickjacking disclosure
- securityheaders.com — Header scanner

---

*This presentation is for educational purposes only. All demonstrations are conducted in a controlled, local-only environment.*
