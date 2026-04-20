# Clickjacking Attack Demonstration Project

## Overview
This project is an advanced, highly realistic, end-to-end demonstration of a Clickjacking (UI Redressing) vulnerability. It consists of two standalone local web servers representing an **Attacker Site** (a malicious YouTube Video Downloader) and a **Victim Site** (a vulnerable online banking portal).

The primary objective is to show how a sophisticated attacker can use an invisible frame, dynamic UI manipulation, and session hijacking to trick a victim into authorizing an unintended bank transfer.

## Architecture & Components
The project is completely self-contained and runs purely on the Python 3 standard library.
- **Launcher:** `run.py` launches both servers simultaneously.
- **Attacker Site (`localhost:8002`):** Located in the `attacker/` directory.
- **Victim Site (`localhost:8001`):** Located in the `victim/` directory.

### 1. Attacker Site ("YT-Fetch" Downloader)
* **`attacker/server.py`:** A simple Python HTTP server running on port 8002.
* **`attacker/index.html`:** A realistic, dark-mode GUI mimicking a "YouTube to MP4" downloaded.
    * It includes an input field for a YouTube URL.
    * A decoy "Download Video" button (`.decoy-btn`) which is the actual attack surface.
* **`attacker/style.css`:** Styles the lure and manages the invisible iframe (`#evil-iframe`). The iframe uses a massive `z-index` and is fixed in position. Critically, to allow the victim to interact with harmless elements on the attacker site (like dropdowns), the iframe is set to `pointer-events: none` globally, but switches to `pointer-events: auto` exclusively when the user hovers over the `.submit-area`.
* **`attacker/inject.js`:** 
    * Handles user input, parsing YouTube URLs, and pulling real thumbnail/title metadata via the `noembed` oEmbed proxy to make the lure exceptionally believable.
    * Uses `postMessage` to receive alignment coordinates from the victim iframe, automatically overlapping the bank's hidden button precisely under the mouse cursor.
    * When the attack triggers, it fakes a fake progress bar ("Downloading..." -> "Download Complete") to mask the attack.
    * Processes debug commands (Press 'D' in the browser).

### 2. Victim Site ("NorthPoint Bank")
* **`attacker/server.py`:** Python HTTP server running on port 8001. Listens to an environment variable (`VICTIM_FRAME_DEFENSE`) to conditionally apply `X-Frame-Options: DENY` and `CSP: frame-ancestors 'none'` headers.
* **`victim/login.html`:** Simulates an organic banking session. Shows a loader for 3 seconds simulating an existing session auto-authenticating, then redirects to `index.html`. This explains the "session hijacking" narrative—the clickjacking relies on the victim already having an active cookie/session in the background, rather than stealing passwords.
* **`victim/index.html`:** The core sensitive "Fund Transfer" page.
    * Has a form filled with the attacker's recipient info.
    * The critical button is `#confirm-btn`. 
    * Includes an educational exploit aid: On load, it calculates the viewport position of `#confirm-btn` and uses `postMessage()` to broadcast it to `window.parent`. (In a real attack, the attacker manually hardcodes this CSS alignment offset prior to the attack).
    * Clicking the confirm button visually deducts the account balance to emphasize the severity of the action.

## How the Attack Works
1. Target organically navigates to the attacker's "YouTube Downloader" site (perhaps searching for it via Google).
2. Target interacts with the site, entering a YouTube link.
3. The attacker site dynamically triggers the hidden `iframe` in the background, navigating to the target's bank. Because the target is logged into their bank in another tab/previously, the frame auto-authenticates.
4. Target goes to click the big "Download Video" button. Because the invisible bank iframe overlays the screen, their click passes into the iframe and hits "Confirm Transfer".
5. The attacker script detects the click, logs it, and immediately shows a fake "Download Complete" text while hiding the iframe, completing the illusion.

## Running the Demo

* **Vulnerable Mode:** 
  ```bash
  python run.py
  ```
  This launches both servers and immediately opens the attacker's lure in your default browser.

* **Defended Mode:**
  ```bash
  python run.py --defended
  ```
  This runs the exact same setup, but the Victim Server attaches frame-busting security headers (`X-Frame-Options` and `Content-Security-Policy`). Setting these headers effectively mitigates the attack, causing the iframe to fail to load.

## Demo Controls (Keyboard)
* **`D`**: Toggles a visual Debug Mode. This makes the invisible iframe highly visible with a red dashed border and partially dims the attacker page. Crucial for demonstrating how the pages overlap.
* **`Shift + Arrows`**: Micro-adjusts the X/Y alignment offsets of the iframe in real time.
* **`R`**: Resets custom offset calibration.
