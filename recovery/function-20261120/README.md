# Companion MWG functional verification — 20/11/2026

Chrome 156 passed nine covered scenarios. The initial run passed six and found three failures. The five In ấn and Báo giá scenarios passed after the targeted fixes. The four passing Kiểm kê, Audio and Thông báo scenarios used the unchanged modules. See `chrome-results.json` for both runs and file inspection.

| Group | Verified | Result |
| --- | --- | --- |
| In ấn UI11 | A4/A5 preview, independent Sticker 6/2/1 fields, native print window, 3,720 × 5,262 PNG at 450 DPI, draft restored per SHOP | 3/3 PASS |
| Báo giá | PNG and one-page A4 landscape PDF on desktop and a 400 px viewport, proportional product image, immediate clearing when a product link changes | 2/2 PASS |
| Kiểm kê Chủ động | Duplicate IMEI rejected, leading zeros kept as Excel text, numeric quantity 2 + 3 merged into one row | 2/2 PASS |
| Audio | Real demo MP3 played, sought to 50%, and paused | 1/1 PASS |
| Thông báo | Bell unread count decreased on read, and read state survived reload against a fake API | 1/1 PASS |

The initial Print Studio draft appeared in another SHOP. `print-ui11.patch` resets the in-memory draft when the SHOP or user changes, then loads that scope's saved draft. Chrome verified the full A → B → A round trip. The initial quotation also retained the old product photo/title during lookup and stretched a square image in its outputs. `stable-quote.patch` updates the edited row and preview immediately, then fixes document width and image proportions in the export clone. The desktop/mobile PNG widths after the fix were 1,800/1,840 px. Both PDFs had one A4 landscape page. The PNG square marker's measured ratio became 1.00 on both viewports.

Each patch also increments only the matching module URL in `index.html` and `sw.js`, plus the service worker cache name. The tracked HTTP/PWA candidate files from `0270d99` retain all three original hashes. For stable, apply the quotation patch **after** those HTTP/PWA files. For UI11, apply the print patch **after** the five files from the `67bc22a` video review. The two builds stay independent. Each adjacent `*.sha256.json` records before and after hashes. Apply using `git apply --unidiff-zero --check PATH` then `git apply --unidiff-zero PATH` in the corresponding complete copy. The reverse uses `git apply --unidiff-zero -R PATH`.

The upstream 555 search used the two already recorded request/trace IDs, with one 30-second window each. It returned `edge_logs` only. The membership trace grouped a 555 and two successful edge records, and the profiles trace returned one 555. Both recorded 10,003 ms for the 555. No matching upstream log source or SQLSTATE was exposed. The root cause remains inconclusive. Retain the existing evidence at `../http-20261120/browser/server-555-evidence.json`; resume the investigation if internal gateway diagnostics or a new failing trace becomes available.

The Work Preview runs the two isolated builds with a fictional local API. The Chrome print window showed the vector document. The physical printer, hardware barcode/IMEI scanning, real accounts, live Audio orders, real web push and live third-party quote lookups remain outside these tests. No production 404 was reproduced. The pinned html2canvas 1.4.1 and jsPDF 2.5.2 libraries were served locally for the run.

To recreate the Preview in Work, use `preview/prepare.py` with the saved `Companion-MWG-v3.5.5-KIEM-KE-CHU-DONG-ROLLBACK.zip`, the saved **base** `Companion-MWG-v3.6.0-UI11-KIEM-KE-BAO-CAO-MO-RONG.zip`, and the cached pinned html2canvas/jsPDF files. The builder checks input hashes and applies both verified overlays to an empty directory.

```sh
python recovery/function-20261120/preview/prepare.py STABLE_ZIP UI11_BASE_ZIP HTML2CANVAS_JS JSPDF_JS /workspace/scratch/mwg-review
sites-preview start /workspace/scratch/mwg-review
```

Open the URL printed by the server within Work. `Chạy kiểm thử` runs all nine scenarios and `Thử lại In & Báo giá` runs the five scenarios affected by the fixes. The harness serves fake data and saves generated evidence to the local `evidence/` directory. Production release is outside this QA checkpoint.
