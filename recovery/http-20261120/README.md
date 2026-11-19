# HTTP recovery candidate — 20/11/2026

**REVIEW ONLY. NOT DEPLOYED. `source/` IS A THREE-FILE PATCH, NOT A COMPLETE WEBSITE.**

Branch: `audit/20261119-production-recovery`.

The audit branch and main both started at `550cc5e`. The latest print review is separately saved at `67bc22a` on `staging/mientay2-v36-video-review`; it is still draft PR #1. The current public website reports `3.5.5-active56`, so this patch uses the actual public files, not the older nine-file main snapshot or UI11 print candidate.

## Evidence and scope

- Public HTML: HTTP 200. All 20 unique assets referenced by HTML/service worker in the first GET pass: HTTP 200 with appropriate content types.
- Additional checks: both catalogue samples returned JSON; the sample inventory Excel, audio demo and second icon responded to HEAD with HTTP 200.
- Supabase project `112191-WORK`: `ACTIVE_HEALTHY`; six existing Edge Functions are active.
- Last-24-hour aggregated Supabase logs contained one HTTP 555 for `/rest/v1/profiles`, one for `/rest/v1/work_shop_memberships`, and one function HTTP 503. No 404 matched that log query.
- The original boot catch removed the saved session on **any** load failure. The original Auth parser called `response.json()` even on an HTML error, losing the HTTP status.
- A missing 404 URL has **not** been reproduced. Do not claim that every 404 is fixed. Cloudflare Pages can return the index page as HTTP 200 for absent paths; check content type/body as well as status.

`http-evidence.json` contains sanitized statuses and hashes, without user log details, credentials or records. The infrastructure cause of HTTP 555 has not been established; this candidate corrects the client's response to it.

## Changes

- Retry a failing GET/HEAD once, after 500 ms, for 500/502/503/504/555 or a network failure. No automatic replay of writes/RPC POSTs on these failures. The existing one-time JWT refresh behavior remains.
- Preserve the session on a service failure, hide partially loaded account data and offer **Kết nối lại**. Clear genuinely invalid sessions and malformed saved JSON.
- Keep the selected login identity/role check when reconnecting an interrupted login. Avoid the legacy admin password fallback on service failures.
- Parse Auth HTML errors without losing HTTP status. Report a missing API resource as HTTP 404 without calling it an expired login.
- Increment only the app query version and PWA cache name needed to load this patch.

No schema, RLS, Auth configuration, Edge Function, production record or live deployment was modified.

## Verify and continue

```sh
node --check recovery/http-20261120/source/app.js
node --check recovery/http-20261120/source/sw.js
node --test recovery/http-20261120/tests/*.test.cjs
```

The HTTP tests use the actual application in a Node VM with simulated responses. They make no production requests. They cover session recovery, invalid-token removal, roles, bounded retries and writes not replayed on HTTP 555. Browser/device regression and authenticated end-to-end checks are pending.

`manifest.json` records the original three production hashes and candidate hashes. `http-recovery.patch` is a unified diff against those exact original files. Before applying it, verify the baseline hashes on a **complete isolated copy** of the matching website. Use `git apply --check` then `git apply` there. The reverse patch restores the exact original three files; all other website files must remain present. Do not deploy `source/`, main or the older recovered snapshots.

Next: investigate an exact reproducible 404 request if one appears, validate the candidate on a complete isolated website copy, then continue remaining functional bugs. Production release remains a separate user decision.
