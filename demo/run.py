"""
run.py  --  Demo launcher

Starts victim/server.py (port 8001) and attacker/server.py (port 8002)
as separate subprocesses, waits for both to be ready, then opens the
attacker page in the default browser.

Usage:
    python run.py

Stop with Ctrl+C.
"""

import os
import sys
import time
import socket
import argparse
import subprocess
import webbrowser

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

VICTIM_SERVER   = os.path.join(BASE_DIR, "victim",   "server.py")
ATTACKER_SERVER = os.path.join(BASE_DIR, "attacker", "server.py")


def wait_for_port(port, timeout=8.0):
    """Return True once localhost:port accepts a TCP connection."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection(("localhost", port), timeout=0.3):
                return True
        except OSError:
            time.sleep(0.1)
    return False


def parse_args():
    parser = argparse.ArgumentParser(description="Launch clickjacking demo servers")
    parser.add_argument(
        "--defended",
        action="store_true",
        help="Start victim in defended mode (blocks framing with XFO/CSP)",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not open browser automatically",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    # Sanity-check that both server scripts exist before doing anything
    for path in (VICTIM_SERVER, ATTACKER_SERVER):
        if not os.path.isfile(path):
            print("[error] Missing file: %s" % path)
            print("        Make sure you are running run.py from the repo root.")
            sys.exit(1)

    print("")
    print("  Clickjacking Attack Demo")
    print("  " + "-" * 45)
    print("  Victim mode: %s" % ("DEFENDED" if args.defended else "VULNERABLE"))
    print("")

    # ── Start victim server ──────────────────────────────────────────────
    print("  Starting victim site   (NorthPoint Bank)  ...")
    victim_env = os.environ.copy()
    victim_env["VICTIM_FRAME_DEFENSE"] = "on" if args.defended else "off"
    victim_proc = subprocess.Popen(
        [sys.executable, VICTIM_SERVER],
        stdout=sys.stdout,
        stderr=sys.stderr,
        env=victim_env,
    )

    if not wait_for_port(8001):
        print("  [error] Victim server did not start on port 8001.")
        victim_proc.terminate()
        sys.exit(1)

    print("  Victim site ready      http://localhost:8001")
    print("")

    # ── Start attacker server ────────────────────────────────────────────
    print("  Starting attacker site (YT-Fetch)   ...")
    attacker_proc = subprocess.Popen(
        [sys.executable, ATTACKER_SERVER],
        stdout=sys.stdout,
        stderr=sys.stderr,
    )

    if not wait_for_port(8002):
        print("  [error] Attacker server did not start on port 8002.")
        victim_proc.terminate()
        attacker_proc.terminate()
        sys.exit(1)

    print("  Attacker site ready    http://localhost:8002")
    print("")

    # ── Open browser ─────────────────────────────────────────────────────
    if args.no_browser:
        print("  Browser auto-open skipped (--no-browser)")
    else:
        print("  Opening attacker page in browser ...")
        webbrowser.open("http://localhost:8002")

    print("")
    print("  " + "-" * 45)
    print("  DEMO CONTROLS")
    print("    D key in browser       toggle debug overlay")
    print("    F12 DevTools console   see click intercept logs")
    print("    localhost:8001         visit victim site directly")
    print("  " + "-" * 45)
    print("  Ctrl+C to stop.")
    print("")

    try:
        victim_proc.wait()
    except KeyboardInterrupt:
        print("")
        print("  Stopping servers ...")
        victim_proc.terminate()
        attacker_proc.terminate()
        victim_proc.wait()
        attacker_proc.wait()
        print("  Done.")


if __name__ == "__main__":
    main()
