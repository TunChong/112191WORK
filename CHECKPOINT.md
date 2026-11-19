# Companion MWG — checkpoint 20/11/2026

Continue on `audit/20261119-production-recovery`. Start by reading `recovery/http-20261120/README.md` and `manifest.json`; do not re-audit the whole repository.

- Base: `550cc5e`, identical to main at takeover. Prior UI11 print review remains on `staging/mientay2-v36-video-review` at `67bc22a`, draft PR #1.
- Actual website: `3.5.5-active56`. This differs from main's older recovered snapshot.
- Confirmed recent HTTP 555 on profile/membership reads; server currently healthy. Infrastructure root cause remains open.
- First fix is saved on GitHub at `5cda0e99bfb5216dc6d7cb384a8674f0b92d3239`: bounded read retry and session preservation on service errors. Follow-up protects PWA HTML/config cache from HTTP errors and incorrect content types.
- **39/39 local regression/package tests pass:** 25 HTTP/session tests, 12 PWA response/cache tests and 2 artifact/hash/rollback tests. Authenticated browser/device checks remain pending.
- No 404 reproduced among the checked public dependencies or matching recent Supabase logs. An exact failing URL is still needed to diagnose a remaining 404.
- Candidate: `recovery/http-20261120/source/` (three changed files only, **not a complete deployable website**). Hashes, unified patch and sanitized HTTP evidence are beside it.
- No production deployment, database/schema/RLS/Auth/Storage write, or Edge Function update was performed. Never deploy main or a partial source directory.

Next: investigate any exact 404 reproduction and run candidate browser/device regression using a complete isolated copy. PWA HTTP-error cache protection is implemented and tested. Do not repeat unchanged public-asset downloads or previous tests unless source changes or a new failure justifies it. Keep ECO MODE and save subsequent checkpoints on this branch.
