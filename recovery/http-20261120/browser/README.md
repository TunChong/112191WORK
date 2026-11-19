# Chrome verification — 20/11/2026

**HTTP/PWA: PASS — 10/10 browser scenarios. Server 555 root cause: INCONCLUSIVE.**

Tested candidate: `eb2496303532fa26a3077d873d5e72ae96160d54`.
Chrome 156 on Linux, secure localhost context. Finished at `2026-11-19T18:50:36.211Z` (01:50:36 on 20/11/2026 in Vietnam).

The three application files in `../source/` were served byte-for-byte, with their manifest SHA-256 hashes verified before startup and after the run. Existing cached public CSS/modules were reused. Only the three required precache files absent from scratch were downloaded once: icon-512, audio-demo and the sample IMEI Excel. No whole-project audit or unchanged local regression rerun was performed.

`config.js` was replaced **only in this QA server** with a fictional local API base and public placeholder. This is not part of the production patch. API failures were actual HTTP responses from this local server, not a Node VM or a monkey-patched browser `fetch`. Native Chromium service workers and Cache Storage handled PWA fallbacks. The POST test submitted the real application's task form against the fake server; no Supabase record was created.

## Results

| Browser scenario | Result |
| --- | --- |
| Install service worker, cache correct app version | PASS |
| GET 555 then 200, exactly one retry | PASS |
| Persistent 555, session retained, manual reconnect succeeds | PASS |
| API 404, one GET, session retained | PASS |
| Auth returns text/HTML-style 555, preserves HTTP status/session | PASS |
| Task creation 555, one task POST, no assignment POST | PASS |
| Navigation 555, cached working HTML remains | PASS |
| Navigation 404, cached working HTML remains | PASS |
| Config 555, cached JavaScript remains | PASS |
| Config HTTP 200 with HTML MIME, rejects cache poisoning | PASS |

Evidence: `evidence/chrome-results.json` records the local server's method/path/status traces for every scenario. `evidence/chrome-pass.jpg` is the browser screenshot. The reporting metadata names API-base replacement explicitly; it is not an external network-capture claim.

These tests establish candidate behavior with controlled server errors. They do not reproduce an actual production 404, prove that live Supabase 555 has stopped, test real accounts, or certify other app features.

## Actual Supabase 555 evidence

Read-only project logs show:

| UTC timestamp | Path | HTTP | Origin duration |
| --- | --- | --- | --- |
| 18/11/2026 22:02:03.238 | `/rest/v1/work_shop_memberships` | 555 | 10,003 ms |
| 18/11/2026 22:23:02.369 | `/rest/v1/profiles` | 555 | 10,003 ms |

Both used gateway version 1, returned `text/plain;charset=UTF-8`, and omitted the upstream-service-time header. Nearby `/auth/v1/user` and `/rest/v1/profiles` calls succeeded in 303 ms and 165 ms. The health-advisor result was empty. No matching Postgres/PostgREST timeout/connection/error entry was returned in the inspected 21:55–22:30 UTC window.

The equal durations **suggest** a timeout at the server/upstream boundary. The failing upstream and underlying reason remain unverified. The [official Supabase status-code reference](https://supabase.com/kb/troubleshooting/http-status-codes) describes gateway timeout as **544** and does not define **555**, so status 555 alone is insufficient to diagnose it. No database, RLS or infrastructure fix is justified yet.

`server-555-evidence.json` preserves sanitized request IDs and trace IDs. The next useful evidence is Supabase's internal gateway/upstream diagnostics correlated with those IDs; generic log polling or unrelated SQL changes will not establish the cause.

## Reuse

The QA server is `serve.py`; the test controls/suite are `index.html` and `suite.js`. It only serves local fixtures and has no production forwarding route. Start it with a retained copy of the previously downloaded public assets and a writable local report path. In managed Work, use `sites-preview` with a dev script invoking this server; it accepts the preview daemon's `--host`, `--port` and `--strictPort` arguments. Reuse the existing assets and verify hashes rather than downloading them again. The QA harness is not a deployable production site.

The tested Preview was local `http://127.0.0.1:4173/`, not a public deployment. Its temporary server is stopped during teardown. The saved screenshot and JSON are durable evidence.
