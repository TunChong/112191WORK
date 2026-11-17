# Companion-MWG v3.6.0 — staging safety checkpoint

**Status:** REVIEW ONLY — NOT DEPLOYABLE, NOT PRODUCTION.  
**Prepared:** 2026-11-17.  
**Existing Cloudflare Pages:** 112191work (reference from historical manually gated workflow).  
**Supabase:** project oyjrgbpjrazwvmiomquw — NO MIGRATION APPLIED FOR MWGX.

## Immutable reference artifacts prepared outside GitHub

- Baseline site: `Companion-MWG-v3.5.7-SOURCE-ROLLBACK.zip`, SHA-256 `0e1e9663ad1d91f3eccea878ca6e6282762a8205a8a198decf3941782c572aa6`, 155 files.
- Candidate preview: `Companion-MWG-v3.6.0-MWGX-PREVIEW-CLOUDFLARE.zip`, SHA-256 `a3b3de8be4571a84ccdadc6c2c0415fec9315b7d605a219b2b22c403bdc2c7d0`, 167 files.
- Additive SQL prepared but **not executed:** `Companion-MWG-v3.6.0-SUPABASE-ADDITIVE.sql`, SHA-256 `cf0f3a94bd136d3e4c6169a9918c9ce218d883d7ffdaa4d728fde6a95b2334cc`.

The above files are conversation artifacts, not yet uploaded to this repository. This staging branch intentionally **must not be deployed** until all 167 candidate files are verified and added from the exact ZIP. The repository's main branch currently contains snapshots from 2026-11-13 and is not the complete v3.5.7 source.

## Local checks

- Baseline vs preview: 152/155 original files byte-for-byte unchanged; only `app.js`, `index.html`, `sw.js` changed.
- 12 independent `modules/mwgx/*` files added; no original file removed.
- 23 JavaScript files passed `node --check`; both ZIP archives passed CRC checks.
- No `service_role` or Supabase secret key found in preview ZIP.
- Browser-based testing reported in accompanying conversation, but device/production end-to-end tests **remain pending**.

## Release gates (must ALL pass)

1. Import the baseline and preview source into an isolated feature branch; check hashes and full asset list.
2. Verify actual current Cloudflare Pages project build setup and take a recoverable Production snapshot.
3. Securely back up Supabase data, Auth metadata, Storage and schema via supported backup/export; do not run destructive SQL.
4. Test additive migration and RLS on staging (3 roles, multi-SHOP isolation, cash approval).
5. Deploy Cloudflare **Preview only** from verified source, never main/Production.
6. Verify login, work, assignments, notifications, v3.5.7 barcode workflow, active inventory, quote images PNG/PDF, Audio, icon, VietQR and PWA on real devices.
7. Verify print dimensions and unknown vendor template specifications as **CẦN ĐỐI CHIẾU**.
8. Release to Production only after green regression + verified rollback path.

## Current blockers

- Cloudflare dashboard integration has not been authenticated/verified through the available tools.
- Browser automation provider could not start because its wallet was out of funds; no charge authorized.
- No confirmed full database/Storage backup or preview Supabase instance.
- The current repository `main` is older than the current production ZIP; never deploy main to replace production.

**Policy: ADD-ONLY, NON-DESTRUCTIVE, BACKWARD COMPATIBLE.**
