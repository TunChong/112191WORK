# UI11 video review patch

- Base package: `Companion-MWG-v3.6.0-UI11-KIEM-KE-BAO-CAO-MO-RONG.zip`
- Base SHA-256: `596463522391497034ba8f62aa21dfe12a94a16a550f5ca534e34e339449513d`
- Candidate package: `Companion-MWG-v3.6.0-UI11-VIDEO-REVIEW-CANDIDATE.zip`
- Candidate SHA-256: `90f7f4745cb32e35da0935666ac5702a968d2e2dcf00eda82e07a69dd7941507`
- Candidate contents: 169 files; exactly 5 files differ from base: `index.html`, `sw.js`, and the three `modules/mwgx/` Print Studio files. No paths were added or removed.

This is review-only. GitHub PR #1 is a draft and is not merged. The staging source is UI3, while this package is UI11; it also points to the current production Supabase configuration. Do not deploy this candidate. Chrome, app PNG/PDF, and physical-printer checks remain pending.

The review package now includes `evidence/verify_print_modes_static.cjs` for repeatable SVG geometry, page-count, and independent-entry checks. These checks do not clear the pending Chrome/browser and real-printer verification gates.

The video report was extended after decoding all 7,431 video frames: 87 significant visual-change markers are listed in `report/MIENTAY2_VIDEO_EVENT_INDEX.csv`. These markers are not a mouse/keyboard action log. The corrected report records the observed A4 layouts and the unresolved Chrome margin setting; it does not claim pixel-perfect or physical-print validation.
