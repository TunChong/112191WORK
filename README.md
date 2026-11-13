# 112191 WORK — mã nguồn khôi phục từ Cloudflare Pages

**Đã hoàn tất sao lưu frontend tại thời điểm 13/11/2026.**

- [Production](recovered_snapshots/production/) — phiên bản hiện chạy tại https://112191work.pages.dev
- [Deployment 8fa9c30b](recovered_snapshots/8fa9c30b/) — bản triển khai trùng production lúc sao lưu
- [Deployment 4dd8d2d4](recovered_snapshots/4dd8d2d4/) — bản lịch sử 1
- [Deployment 7f79fb8a](recovered_snapshots/7f79fb8a/) — bản lịch sử 2
- [Manifest SHA256 và danh sách file](recovered_snapshots/manifest.json)
- [Kế hoạch cập nhật app](recovery/IMPLEMENTATION_PLAN.md)

Mỗi bản chứa 9 tệp: `app.js`, `config.js`, `styles.css`, `index.html`, `sw.js`, `manifest.webmanifest`, `robots.txt`, `icon-192.png`, `icon-512.png`.

Các snapshots này là file *được website phục vụ công khai*, không phải bản sao cấu hình/backend Supabase, cơ sở dữ liệu người dùng, quyền RLS hay lịch sử Git cũ.

**Không chỉnh trực tiếp thư mục snapshots.** Mọi thay đổi tính năng nên làm trên nhánh riêng và thử Preview, không tự động ghi đè Cloudflare Production.

Repository đang ở chế độ public. Không commit mật khẩu, token riêng hay Supabase service_role/secret key.
