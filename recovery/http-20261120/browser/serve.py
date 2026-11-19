"""Isolated HTTP/PWA QA. Serves exact candidate bytes; all API traffic is local fake data."""
import argparse
import hashlib
import json
import mimetypes
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

HERE = Path(__file__).resolve().parent
PACKAGE = HERE.parent
STATE = {"mode": "healthy", "requests": [], "report": None}
LOCK = threading.Lock()
MANAGER = {"id": "qa-manager", "employee_code": "123456", "full_name": "QA MANAGER", "role": "manager", "is_admin": False, "active": True, "must_change_password": False}
STAFF = {"id": "qa-staff", "employee_code": "234567", "full_name": "QA STAFF", "role": "staff", "is_admin": False, "active": True, "must_change_password": False}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def send(self, status, body, content_type="application/json", record=True):
        data = body if isinstance(body, bytes) else (body.encode() if isinstance(body, str) else json.dumps(body).encode())
        if record:
            with LOCK:
                STATE["requests"].append({"method": self.command, "path": urlparse(self.path).path, "status": status})
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        path = urlparse(self.path).path
        raw = self.rfile.read(int(self.headers.get("content-length", "0")))
        body = json.loads(raw or "{}")
        if path == "/qa/control":
            with LOCK:
                STATE["mode"] = body["mode"]
                if body.get("reset"):
                    STATE["requests"] = []
            return self.send(200, {"ok": True}, record=False)
        if path == "/qa/report":
            STATE["report"] = body
            ARGS.report.parent.mkdir(parents=True, exist_ok=True)
            ARGS.report.write_text(json.dumps(body, ensure_ascii=False, indent=2) + "\n")
            return self.send(200, {"saved": True}, record=False)
        if path.startswith("/qa-api/"):
            if "/auth/v1/token" in path and STATE["mode"] == "auth555":
                return self.send(555, "QA injected Auth HTTP 555", "text/plain")
            if path == "/qa-api/rest/v1/tasks":
                return self.send(555, "QA injected write HTTP 555; no record created", "text/plain")
            if path == "/qa-api/functions/v1/manage-shops":
                return self.send(200, {"ready": True})
            if path == "/qa-api/functions/v1/work-push":
                return self.send(200, {"enabled": False, "sent": 0, "public_key": ""})
            return self.send(400, {"error": "Unimplemented fake API; never forwards to Supabase"})
        return self.send(404, {"error": "QA route not found"})

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        mode = STATE["mode"]
        if path in ("/", "/qa/"):
            return self.send(200, (HERE / "index.html").read_bytes(), "text/html", record=False)
        if path == "/qa/suite.js":
            return self.send(200, (HERE / "suite.js").read_bytes(), "application/javascript", record=False)
        if path == "/qa/stats":
            return self.send(200, {"mode": mode, "requests": list(STATE["requests"])}, record=False)
        if path == "/qa/results":
            return self.send(200, STATE["report"], record=False)
        if path == "/qa/seed":
            script = """<!doctype html><script>
            localStorage.setItem('work112191_session',JSON.stringify({access_token:'qa-fictional-access',refresh_token:'qa-fictional-refresh',expires_at:EXPIRES,user:{id:'qa-manager'}}));
            localStorage.removeItem('work112191_selected_shop');location.replace('/app/index.html?qa='+Date.now());
            </script>"""
            expires = "0" if "expired" in parsed.query else "Math.floor(Date.now()/1000)+3600"
            return self.send(200, script.replace("EXPIRES", expires), "text/html", record=False)
        if path.startswith("/qa-api/"):
            resource = path.removeprefix("/qa-api")
            if resource == "/rest/v1/profiles":
                previous = sum(r["path"] == path and r["method"] == "GET" for r in STATE["requests"])
                if mode == "persistent555" or (mode == "once555" and previous == 0):
                    return self.send(555, "QA injected read HTTP 555", "text/plain")
                if mode == "api404":
                    return self.send(404, {"code": "NOT_FOUND", "message": "QA missing resource"})
                return self.send(200, [MANAGER])
            if resource == "/rest/v1/work_shops":
                return self.send(200, [{"id": "qa-shop", "shop_code": "QA", "shop_name": "ISOLATED TEST SHOP", "active": True, "is_primary": True}])
            if resource == "/rest/v1/work_shop_memberships":
                if "profile:" in parsed.query:
                    return self.send(200, [{"user_id": p["id"], "shop_role": p["role"], "active": True, "profile": p} for p in (MANAGER, STAFF)])
                return self.send(200, [{"shop_id": "qa-shop", "shop_role": "manager", "active": True}])
            return self.send(200, [])
        if path.startswith("/app/"):
            relative = path.removeprefix("/app/") or "index.html"
            if relative == "index.html" and mode in ("nav555", "nav404"):
                status = int(mode[3:])
                return self.send(status, "QA injected navigation HTTP " + str(status), "text/plain")
            if relative == "config.js":
                if mode == "config555":
                    return self.send(555, "QA injected config HTTP 555", "text/plain")
                if mode == "configHtml":
                    return self.send(200, "<!doctype html><h1>QA missing JS: HTML fallback</h1>", "text/html")
                return self.send(200, "window.WORK_CONFIG={supabaseUrl:location.origin+'/qa-api',supabasePublishableKey:'qa-fictional-public'};", "application/javascript")
            if relative in ("app.js", "sw.js", "index.html"):
                file = PACKAGE / "source" / relative
            else:
                file = (ARGS.assets / relative).resolve()
                if not file.is_relative_to(ARGS.assets.resolve()):
                    return self.send(403, "Forbidden", "text/plain")
            if not file.is_file():
                return self.send(404, "QA static resource missing", "text/plain")
            content_type = "application/javascript" if file.suffix == ".js" else mimetypes.guess_type(file.name)[0] or "application/octet-stream"
            return self.send(200, file.read_bytes(), content_type)
        return self.send(404, "QA route missing", "text/plain")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--assets", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "3000")))
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--strictPort", action="store_true")
    ARGS = parser.parse_args()
    manifest = json.loads((PACKAGE / "manifest.json").read_text())
    for name, expected in manifest["candidate_sha256"].items():
        assert hashlib.sha256((PACKAGE / "source" / name).read_bytes()).hexdigest() == expected, name
    print(f"QA preview http://0.0.0.0:{ARGS.port}; fake API only; exact three candidate files", flush=True)
    ThreadingHTTPServer((ARGS.host, ARGS.port), Handler).serve_forever()
