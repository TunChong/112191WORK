#!/usr/bin/env python3
"""Read-only recovery of publicly deployed 112191 WORK frontend assets."""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import hashlib, json, sys
VERSIONS = {
    "production": "https://112191work.pages.dev",
    "8fa9c30b": "https://8fa9c30b.112191work.pages.dev",
    "4dd8d2d4": "https://4dd8d2d4.112191work.pages.dev",
    "7f79fb8a": "https://7f79fb8a.112191work.pages.dev",
}
FILES = ["app.js","config.js","icon-192.png","icon-512.png","index.html",
         "manifest.webmanifest","robots.txt","style.css","sw.js"]
OUT = Path("recovery_artifacts")
OUT.mkdir(exist_ok=True)
manifest = []
fail = 0
for label, base in VERSIONS.items():
    dest = OUT / label
    dest.mkdir(exist_ok=True)
    for name in FILES:
        url = base + "/" + name
        try:
            req = Request(url, headers={"User-Agent":"112191-work-recovery/1.0", "Accept":"*/*"})
            with urlopen(req, timeout=20) as r:
                status = r.status
                typ = r.headers.get("Content-Type","")
                payload = r.read(10_000_001)
            if status != 200 or not payload or len(payload)>10_000_000:
                raise ValueError(f"bad response: status={status} size={len(payload)}")
            # Avoid mistaking HTML SPA fallback for JavaScript/CSS/images.
            if name.endswith(".png") and not payload.startswith(bytes.fromhex("89504e470d0a1a0a")):
                raise ValueError("unexpected content for PNG")
            if name.endswith((".js", ".css", ".webmanifest", ".txt")) and payload.lstrip().lower().startswith(b"<!doctype html"):
                raise ValueError("HTML fallback, not requested asset")
            (dest/name).write_bytes(payload)
            manifest.append({"version":label,"filename":name,"ok":True,"bytes":len(payload),
                 "sha256":hashlib.sha256(payload).hexdigest(),"content_type":typ})
            print(f"OK {label}/{name}: {len(payload)} bytes")
        except (HTTPError, URLError, ValueError, TimeoutError) as exc:
            fail += 1
            manifest.append({"version":label,"filename":name,"ok":False,"error":str(exc)[:250]})
            print(f"FAILED {label}/{name}: {exc}",file=sys.stderr)
(OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
print(f"SUCCESS={len(manifest)-fail} FAIL={fail}")
# Only save to workflow artifact; review config.js before committing contents to public repo.
