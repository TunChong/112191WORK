# Preview deployment gate

- Branch: `staging/companion-mwg-v3.6.0-safety`
- Scope: staged v3.6.0 source delta only.
- Production Cloudflare Pages deployment: unchanged.
- GitHub `main`: unchanged.
- Supabase migration: not applied.
- Supabase backup: not available on the current Free plan; no manual full backup has been completed.
- Preview backend isolation: not available; package `config.js` points to Production project `oyjrgbpjrazwvmiomquw`.
- Live feature testing: not started; no results are claimed.

The next safe deployment path is to keep the Pages deployment on a non-production branch and supply an isolated Supabase backend plus a verified backup before any operation that could write data.
