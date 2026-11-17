# Companion-MWG v3.6.0 Preview UI3 — print template refinement

This folder contains the 15-file v3.6.0 source delta for review on `staging/companion-mwg-v3.6.0-safety`. UI3 refines the print template shown in the supplied reference: a black-and-white A4 landscape layout with the gift mark, crossed-out price, large sale price, installment line, product/date footer, and a right-side print guide. The matching `GIÁ RẺ QUÁ` selection is available from both POPUP and Sticker catalogs.

Preview package SHA-256: `6a0cc5f41ce4ded6bcda11602a58a5448226229a98e9596ff5f36de512e95006`
v3.5.7 rollback package SHA-256: `0e1e9663ad1d91f3eccea878ca6e6282762a8205a8a198decf3941782c572aa6`

The patch adds 12 MWGX modules and modifies the existing application shell files. This UI3 revision changes only the print studio, print engine, MWGX stylesheet, page asset versions, and service-worker cache version. No files were deleted.

## Safety status

- GitHub `main` remains unchanged.
- Cloudflare Production remains unchanged.
- No Supabase migration was applied.
- The package still points to the existing Production Supabase project. Do not use live data writes for verification until a separate backend and backup are available.
- Local rendering and selection checks passed for the supplied A4 landscape template. Physical printer output and connected database operations have not been verified.
