#!/usr/bin/env python3
"""
Локальний HTTP сервер для автономної (офлайн) сторінки Markdown -> PDF.

Навіщо це треба:
- Збережена сторінка www.markdowntopdf.com залежить від їхнього бекенду/авторизації/модулів і локально ламається.
- Цей сервер віддає локальний `index.html` і статичні файли з поточної папки.
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
        # Додаємо CORS заголовки для роботи з Playwright
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Прибираємо зайві логи
        pass

def start_server(port: int):
    """Запускає локальний HTTP сервер"""
    os.chdir(Path(__file__).parent)

    # ThreadingTCPServer, щоб браузер/ресурси не блокували один одного
    class ThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
        allow_reuse_address = True

    with ThreadingTCPServer(("", port), MyHTTPRequestHandler) as httpd:
        print(f"🌐 Локальний сервер запущено на http://localhost:{port}/")
        print(f"📄 Відкрийте в браузері: http://localhost:{port}/ (index.html)")
        print(f"\n⏸️  Натисніть Ctrl+C для зупинки сервера\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🔒 Сервер зупинено")
            sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Local offline Markdown -> PDF server")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    args = parser.parse_args()
    start_server(args.port)
