# 112191 WORK v2.1 — Candidate (not deployed)

## Implemented in this branch
- Adds `Công Việc Siêu Thị` to the existing task-category dropdown.
- Adds a manager-only `Quản lý tài khoản` tab that lists current staff and account status, last sign-in if available, password change timestamp (after database migration), and an audit history.
- Supports manager create, archive/reactivate, and one-time reset password through a protected Supabase Edge Function.
- Preserves task and assignment history when archiving a staff account. Passwords are never retained or shown after the one-time temporary credential dialog.
- Keeps all other existing user-facing features from the recovered production frontend.
- Updates service worker cache to v2.1.

## Known blockers — DO NOT DEPLOY TO PRODUCTION YET
1. The connected Supabase project is `ldleyqdrcikpuoyccdrm`, but the existing 112191 WORK config uses `oyjrgbpjrazwvmiomquw`. Connected Supabase management access denied the target project, so this session **cannot run the migration or deploy the Edge Function** on the correct backend.
2. Cloudflare Pages is set to manual uploads, and this session does not have its deployment credentials. The actual site at `112191work.pages.dev` has **not been changed**.
3. Verify the target database's `profiles` role checks and RLS policies. Ensure staff cannot self-edit `role`, `active`, or `must_change_password`. Verify category constraints on `tasks` and `recurring_templates` before allowing new category values.
4. End-to-end Auth and staff lifecycle tests need the actual target project. JavaScript checks are not a substitute for live integration tests.

## Files
- Public frontend files: `candidate_v21/{app.js,index.html,styles.css,config.js,sw.js,manifest.webmanifest,robots.txt,icon-192.png,icon-512.png}`.
- Server-only function: `candidate_v21/supabase/functions/manage-staff/index.ts`.
- SQL migration: `candidate_v21/supabase/migrations/20261113_manage_staff.sql`.
- Workflow `validate-v21.yml` outputs an artifact with **only nine public site files**, not the server code.

## Deployment sequence once target backend is available
1. Check/backup current Supabase schema and RLS; test on a safe clone.
2. Review and apply the SQL migration to the CORRECT Supabase project, verify security.
3. Deploy Edge Function `manage-staff` there, with JWT verification required. Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code or repository secrets.
4. Test sign-in as staff vs manager; create staff, password reset, archive/reactivate and history; verify employee cannot call management actions.
5. Deploy only the nine public frontend files to a **Cloudflare preview** first, verify features.
6. After explicit testing and acceptance, deploy to Production. Original deployment remains unchanged until then.
