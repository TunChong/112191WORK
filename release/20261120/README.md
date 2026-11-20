# Companion MWG · Checklist Công việc QLST

Nền RC2 tại `c848a17`. Xem [hướng dẫn Checklist](CHECKLIST-QLST.md) và [kết quả](verification.json). Migration mới nằm trong `supabase/migrations/20261120083850_qlst_checklist.sql`. Preview dùng dữ liệu thử. Supabase và Cloudflare thật chờ phê duyệt.

Dựng gói web với bản sao lưu đã bàn giao.

```sh
python3 release/20261120/build.py /path/to/BACKUP-COMPANION-MWG.zip --output COMPANION-MWG-CHECKLIST-QLST.zip
```

Để chạy lại Preview cục bộ từ gốc repository.

```sh
cd release/20261120/checklist-preview
npm ci
npm test
unzip /path/to/COMPANION-MWG-CHECKLIST-QLST.zip -x config.js -d site
npm run dev
```

Mở `http://127.0.0.1:4173/` và bấm **Chạy kiểm thử hai tài khoản**. Preview tạo cấu hình thử riêng. Mã SDK Realtime được ghim trong `checklist-preview/package-lock.json`.

## Nguồn RC2

### Companion MWG · v3.5.5-active56 RC2

Trạng thái **Release Candidate**. Cây này lưu mã nguồn của các tệp mới và sửa, danh sách hash cùng trình đóng gói. Gói RC2 nguyên gốc có 159 tệp. Cloudflare Pages phục vụ trực tiếp nội dung ZIP đã giải nén.

RC2 sửa bố cục “GIẢM CÒN” ở mẫu Giá rẻ quá, đồng thời tăng cỡ chữ và giá ở hai mẫu Gạch giá và Phiếu mua hàng. Chrome đạt 41/41 cho thẻ mẫu, bản A4 6/2/1 tem và PNG 450 DPI. Có 62 đối chiếu SVG trùng RC1 cho các mẫu ngoài phạm vi. Kiểm thử máy in thật còn thiếu.

Cả 154 tệp nền v3.5.5-active56 đã khớp phản hồi website đang chạy. Bản sao lưu bỏ danh sách nhân viên nhúng trong chế độ dùng thử và dòng ví dụ có IMEI trong mẫu Excel. Bản RC dùng cấu hình Supabase công khai của bản nền, có 16 tệp nguồn mới hoặc thay đổi so với bản sao lưu. Mục Thiết kế & In ấn UI11 giữ phạm vi tài khoản kiểm thử 112191.

- Checkpoint `3061de973c4bf9ff0e653e83b293225dc073765c` giữ lịch sử HTTP/PWA, báo giá, in ấn và nhập kho.
- `0270d99` lưu bằng chứng Chrome HTTP/PWA. `00a935b` là SHA của bản vá PNG/PDF.
- [verification.json](verification.json) lưu kiểm thử Chrome của RC1 và RC2 cùng các bước chưa kiểm thử.
- [sha256.json](sha256.json) lưu hash từng tệp của nền production, sao lưu và bản phát hành.

Chờ xác minh cấu hình triển khai Cloudflare trong Dashboard, chạy nghiệm thu với backend cô lập qua HTTPS và thử thiết bị thật theo DEPLOY-GUIDE.md trước khi phát hành chính thức. Nguyên nhân gốc HTTP 555 vẫn chờ log upstream.
