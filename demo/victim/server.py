"""
victim/server.py  --  NorthPoint Bank (port 8001)

Serves the bank site from this directory. Intentionally omits the
X-Frame-Options and Content-Security-Policy frame-ancestors headers,
which is the vulnerability that makes clickjacking possible.

Run standalone:
    python victim/server.py

Or use the root launcher:
    python run.py
"""

import os
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler

HOST = "localhost"
PORT = 8001
FRAME_DEFENSE = os.environ.get("VICTIM_FRAME_DEFENSE", "off").strip().lower() in ("1", "true", "on", "yes")

# Serve files from the same directory as this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class VictimHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        # Resolve URL path to a file
        url_path = self.path.split("?")[0]
        if url_path == "/" or url_path == "":
            url_path = "/index.html"

        file_path = os.path.normpath(
            os.path.join(BASE_DIR, url_path.lstrip("/"))
        )

        # Prevent directory traversal outside BASE_DIR
        if not file_path.startswith(BASE_DIR):
            self.send_error(403, "Forbidden")
            return

        if not os.path.isfile(file_path):
            self.send_error(404, "Not found")
            return

        mime, _ = mimetypes.guess_type(file_path)
        mime = mime or "application/octet-stream"

        with open(file_path, "rb") as fh:
            body = fh.read()

        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(body)))

        if FRAME_DEFENSE:
            # Defence mode for classroom demos: block all iframe embedding.
            self.send_header("X-Frame-Options", "DENY")
            self.send_header("Content-Security-Policy", "frame-ancestors 'none'")

        # ── VULNERABILITY ──────────────────────────────────────────────
        # Neither of these headers is sent, so any origin can embed this
        # page inside an <iframe>. This is what the attacker exploits.
        #
        # DEFENCE — uncomment either line to block framing:
        #
        # self.send_header("X-Frame-Options", "DENY")
        # self.send_header("Content-Security-Policy", "frame-ancestors 'none'")
        # ──────────────────────────────────────────────────────────────

        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print("[victim:%d]  %s" % (PORT, fmt % args))


def run():
    httpd = HTTPServer((HOST, PORT), VictimHandler)
    mode = "DEFENDED" if FRAME_DEFENSE else "VULNERABLE"
    print("[victim:%d]  NorthPoint Bank running at http://%s:%d (%s mode)" % (PORT, HOST, PORT, mode))
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    run()
