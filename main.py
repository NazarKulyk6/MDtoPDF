#!/usr/bin/env python3
"""
Local HTTP server for Markdown -> PDF converter.

This server serves the local `index.html` and static files from the current folder.
Perfect for local development and testing.
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path
import argparse

DEFAULT_PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers (useful for Playwright / automation)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Silence noisy logs
        pass

def start_server(port: int):
    """Start the local HTTP server"""
    base_dir = Path(__file__).parent
    app_dir = base_dir / "app"
    
    # Change to app directory to serve files from there
    if app_dir.exists():
        os.chdir(app_dir)
        print(f"📁 Serving files from: {app_dir}")
    else:
        os.chdir(base_dir)
        print(f"⚠️  App directory not found, serving from: {base_dir}")

    # ThreadingTCPServer so the browser/resources don't block each other
    class ThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
        allow_reuse_address = True

    with ThreadingTCPServer(("", port), MyHTTPRequestHandler) as httpd:
        print(f"🌐 Local server started at http://localhost:{port}/")
        print(f"📄 Open in your browser: http://localhost:{port}/")
        print(f"\n⏸️  Press Ctrl+C to stop the server\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🔒 Server stopped")
            sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Local Markdown -> PDF server")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args()
    start_server(args.port)
