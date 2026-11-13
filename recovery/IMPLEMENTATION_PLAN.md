# Kế hoạch cập nhật 112191 WORK (chưa deploy)

## Đã khôi phục
- Bản production (8fa9c30b) và 2 bản lịch sử (4dd8d2d4, 7f79fb8a).
- 9 file/phiên bản, gồm app.js, config.js, styles.css, index.html, sw.js, icons, manifest, robots.
- File ở `recovered_snapshots/<phiên_bản>/`; không sửa trực tiếp các thư mục này.
- Dự án Cloudflare Pages production hoàn toàn chưa bị cập nhật.

## Kết quả rà soát app.js bản production
- App frontend JavaScript thuần, sử dụng Supabase Auth và Supabase REST API.
- `createView()`: dropdown `name="category"` hiện có Trưng bày, Kiểm tra, Vệ sinh, Kho, Khác.
- `teamView()`: chỉ quản lý xem nhân viên; danh sách lấy từ `profiles`, hiện có nút Khóa/Kích hoạt.
- `toggleUser()`: cập nhật cột `profiles.active`, không xóa tài khoản.
- `loadCloud()`: tải `profiles`, `tasks`, `assignments`, `recurring_templates`, `recurring_members`, `notifications`.
- Danh sách ROSTER cố định 14 người tồn tại trong mã, trong khi giao diện trực tuyến dựa vào dữ liệu Supabase khi đăng nhập.

## Thay đổi 1: nhóm Công Việc Siêu Thị
- Thêm `<option>Công Việc Siêu Thị</option>` ngay trước Khác ở `createView()`.
- Kiểm tra các `CHECK` constraints/enum trên hai bảng `tasks` và `recurring_templates`. Nếu có ràng buộc, phải thêm giá trị mới trong database.
- Kiểm thử tạo việc thường, lặp hằng ngày, xem lại nhãn công việc và lọc/xuất CSV.

## Thay đổi 2: nhân sự và tài khoản
- Tab mới `Quản lý tài khoản` chỉ hiển thị cho quản lý; quyền phải được xác minh phía backend dựa trên role/identity không do người dùng tự chỉnh được.
- Chức năng: thêm nhân viên, sửa tên/mã NV, khóa/khôi phục, đặt lại mật khẩu; không xóa lịch sử nhiệm vụ.
- Quản lý có thể xem thời điểm tài khoản được tạo, đổi mật khẩu gần nhất (nếu backend hỗ trợ), lần đăng nhập gần nhất, trạng thái; **không xem/lưu mật khẩu hiện tại hoặc mật khẩu mới của nhân viên**.
- Quản lý tạo/reset tài khoản qua Supabase Edge Function hoặc backend server an toàn với kiểm tra vai trò phía server và service_role/secret lưu server-only. Tuyệt đối không đưa service_role vào config.js/app.js.
- Supabase Auth và các bảng `profiles` phải giữ liên kết theo auth.users.id, kiểm tra RLS, ngăn tự cấp quyền quản lý.
- Xóa nhân viên = vô hiệu hóa tài khoản / thu hồi phiên phù hợp, không xóa vật lý các dữ liệu công việc.
- Cần kiểm tra SQL hiện tại và quyền quản trị Supabase trước khi triển khai.

## Quy trình an toàn
1. Kiểm tra schema, RLS, Edge Functions và flow tạo user trên Supabase hiện tại.
2. Tạo nhánh tính năng hoặc bản copy preview, không sửa snapshots gốc.
3. Kiểm thử quyền quản lý/nhân viên, đổi mật khẩu, báo cáo và phân công việc.
4. Sau khi kiểm thử, mới triển khai bản Preview riêng lên Cloudflare; giữ nguyên Production cho đến khi người dùng duyệt.

## Bảo mật
Repository hiện công khai. Publishable key trong config.js là key dùng cho frontend, nhưng không được lưu secret/service_role hoặc thông tin đăng nhập riêng vào GitHub. Hãy cân nhắc chuyển repository sang private nếu không muốn mã nguồn công khai.
