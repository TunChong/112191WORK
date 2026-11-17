# Companion-MWG v3.6.0 Preview — staging patch

This directory holds the 15-file code delta extracted from the prepared v3.6.0 Preview package. It is staged for review on `staging/companion-mwg-v3.6.0-safety`; it is not a standalone website and has not been deployed.

## Source and rollback references

- Preview package SHA-256: `a3b3de8be4571a84ccdadc6c2c0415fec9315b7d605a219b2b22c403bdc2c7d0`
- v3.5.7 rollback package SHA-256: `0e1e9663ad1d91f3eccea878ca6e6282762a8205a8a198decf3941782c572aa6`
- The complete Preview and rollback ZIPs remain in the project Library.

The patch adds 12 MWGX modules and changes `app.js`, `index.html`, and `sw.js`. It leaves all 155 baseline files unmodified in the package comparison; 152 matched byte-for-byte, and three existing files changed. No baseline file was deleted.

## Deployment gate

The Preview package's `config.js` targets the existing Production Supabase project `oyjrgbpjrazwvmiomquw`. A Cloudflare Pages Preview alone would therefore still use Production data. Do not deploy this patch for live write testing until a suitable database backup exists and an isolated backend is available.

The additive SQL file is staged for review only. It has not been applied. Do not use the repository's existing Production deployment workflow for this release. Production branch `main` and the live deployment have not been changed.
