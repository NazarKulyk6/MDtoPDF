#!/usr/bin/env python3
"""
Local HTTP server for Markdown -> PDF converter with API support.

This server serves the local `index.html` and static files from the current folder.
Also provides REST API endpoints for Markdown to PDF conversion.
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path
import argparse
import json
import cgi
from io import BytesIO

try:
    from api_handler import convert_markdown_to_pdf
    API_AVAILABLE = True
except ImportError:
    API_AVAILABLE = False
    print("⚠️  API features disabled. Install dependencies: pip install -r requirements.txt")

DEFAULT_PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for API access from any origin
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Accept')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.end_headers()
    
    def do_POST(self):
        """Handle POST requests for API"""
        if self.path == '/api/convert' or self.path == '/api/convert/':
            self.handle_api_convert()
        else:
            self.send_error(404, "Not Found")
    
    def handle_api_convert(self):
        """Handle Markdown to PDF conversion API"""
        if not API_AVAILABLE:
            self.send_error(503, "API not available. Install dependencies: pip install -r requirements.txt")
            return
        
        try:
            content_type = self.headers.get('Content-Type', '')
            
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            markdown_text = None
            filename = "document"
            
            if 'application/json' in content_type:
                # JSON request: {"markdown": "...", "filename": "..."}
                data = json.loads(post_data.decode('utf-8'))
                markdown_text = data.get('markdown', '')
                filename = data.get('filename', 'document')
            
            elif 'multipart/form-data' in content_type:
                # Form data with file upload
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={'REQUEST_METHOD': 'POST'}
                )
                
                if 'file' in form:
                    file_item = form['file']
                    if file_item.filename:
                        markdown_text = file_item.file.read().decode('utf-8')
                        # Use original filename without extension
                        filename = Path(file_item.filename).stem
                
                if 'markdown' in form:
                    markdown_text = form['markdown'].value
                
                if 'filename' in form:
                    filename = form['filename'].value
            
            elif 'text/plain' in content_type or 'text/markdown' in content_type:
                # Plain text markdown
                markdown_text = post_data.decode('utf-8')
                # Try to get filename from query string
                from urllib.parse import urlparse, parse_qs
                parsed = urlparse(self.path)
                params = parse_qs(parsed.query)
                if 'filename' in params:
                    filename = params['filename'][0]
            
            if not markdown_text:
                self.send_error(400, "No markdown content provided")
                return
            
            # Convert to PDF
            pdf_buffer = convert_markdown_to_pdf(markdown_text, filename)
            
            # Send PDF response
            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}.pdf"')
            self.send_header('Content-Length', str(len(pdf_buffer.getvalue())))
            self.end_headers()
            self.wfile.write(pdf_buffer.getvalue())
            
        except Exception as e:
            self.send_error(500, f"Error converting to PDF: {str(e)}")
    
    def log_message(self, format, *args):
        # Silence noisy logs for static files, but log API calls
        if '/api/' in self.path:
            super().log_message(format, *args)

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
