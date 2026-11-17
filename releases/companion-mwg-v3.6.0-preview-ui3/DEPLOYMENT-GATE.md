# Preview deployment gate — UI3

- Branch: `staging/companion-mwg-v3.6.0-safety`
- Release folder: `releases/companion-mwg-v3.6.0-preview-ui3`
- Production Cloudflare Pages deployment: unchanged.
- GitHub `main`: unchanged.
- Supabase migration: not applied.
- Supabase backup: not available on the current Free plan; no manual full backup has been completed.
- Preview backend isolation: not available; package `config.js` points to Production project `oyjrgbpjrazwvmiomquw`.
- Live data-write testing: not started; no such results are claimed.

The package is prepared for Cloudflare Preview review only. Keep data writes disabled until a suitable backup and isolated backend are available. Do not use the Production deployment workflow for this release.
