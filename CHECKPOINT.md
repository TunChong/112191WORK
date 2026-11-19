# Companion MWG — checkpoint 20/11/2026

Continue on `audit/20261119-production-recovery`. Start by reading `recovery/http-20261120/README.md` and `manifest.json`; do not re-audit the whole repository.

- Base: `550cc5e`, identical to main at takeover. Prior UI11 print review remains on `staging/mientay2-v36-video-review` at `67bc22a`, draft PR #1.
- Actual website: `3.5.5-active56`. This differs from main's older recovered snapshot.
- Confirmed recent HTTP 555 on profile/membership reads; server currently healthy. Infrastructure root cause remains open.
- First fix is saved on GitHub at `5cda0e99bfb5216dc6d7cb384a8674f0b92d3239`: bounded read retry and session preservation on service errors. Follow-up protects PWA HTML/config cache from HTTP errors and incorrect content types.
- **39/39 local regression/package tests pass** from the previous checkpoint; unchanged checks were not rerun. **10/10 actual Chrome HTTP/PWA scenarios now PASS** on the exact `eb24963` candidate, with a local fictional API and real service-worker/cache behavior. Evidence and reproduction are in `recovery/http-20261120/browser/`.
- No 404 reproduced among the checked public dependencies or matching recent Supabase logs. An exact failing URL is still needed to diagnose a remaining 404.
- Candidate: `recovery/http-20261120/source/` (three changed files only, **not a complete deployable website**). Hashes, unified patch and sanitized HTTP evidence are beside it.
- No production deployment, database/schema/RLS/Auth/Storage write, or Edge Function update was performed. Never deploy main or a partial source directory.

## Server 555 follow-up

Read-only logs confirm two gateway-version-1 HTTP 555 events at `2026-11-18T22:02:03.238Z` and `22:23:02.369Z`, each with origin duration **10,003 ms**. They are text responses without the upstream-service-time header. No corresponding Postgres/PostgREST error was returned in the inspected window; health advisors were empty. The timeout interpretation is an inference, **not a verified root cause**. The official status-code reference defines gateway timeout as 544 and does not define 555. Sanitized request/trace IDs are in `browser/server-555-evidence.json`.

The follow-up searched only the two recorded request/trace IDs, in 30-second windows around each error. The connected log stream returned edge records only. The membership trace grouped one 555 and two nearby 200 responses, and the profile trace had one 555. No upstream source or SQLSTATE was available. Server root cause remains unverified. Resume this investigation only if internal Supabase gateway diagnostics or a new failing trace becomes available.

## Functional follow-up

The three verified HTTP/PWA candidate files still match `0270d99` byte-for-byte. The subsequent fixes are separate, reviewable diffs in `recovery/function-20261120/`.

- Print Studio UI11: switching from SHOP A to B previously displayed A's unsaved draft state. The patch starts B with its own defaults and loads its saved draft, then restores A's draft when returning to A. Three Chrome scenarios passed after the fix, including vector print and Sticker PNG 450 DPI. The UI11 draft branch and production remain separate.
