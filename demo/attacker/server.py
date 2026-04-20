"""
attacker/server.py  --  QuickSurvey.io lure site (port 8002)

Serves the attacker-controlled survey page from this directory.
This is the page the victim visits — it looks like a harmless survey
but embeds the bank site in an invisible iframe.

Run standalone:
    python attacker/server.py

Or use the root launcher:
    python run.py
"""

import os
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler

HOST = "localhost"
PORT = 8002

# Serve files from the same directory as this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class AttackerHandler(BaseHTTPRequestHandler):

    def do_GET(self):
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
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        print("[attacker:%d]  %s" % (PORT, fmt % args))


def run():
    httpd = HTTPServer((HOST, PORT), AttackerHandler)
    print("[attacker:%d]  YT-Fetch running at http://%s:%d" % (PORT, HOST, PORT))
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    run()
