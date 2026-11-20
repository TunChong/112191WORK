# Nghiệm thu và triển khai Checklist Công việc QLST

Phiên bản này tích hợp trên Companion MWG RC2, tại mục **Checklist Công việc QLST** ngay dưới **Tổng quan**. Trên điện thoại, lối vào nằm trong màn hình Tổng quan.

## 1. Kiểm tra bản Preview

Trong phiên Work, mở tab **Companion MWG · Preview Checklist QLST**. Chọn **Chạy kiểm thử hai tài khoản** để xem QLST và TC của SHOP-A dùng chung dữ liệu. Có thể chọn **Nhân viên · SHOP-A** hoặc **QLST · SHOP-B** trong hai danh sách thử để đối chiếu quyền.

| Phần kiểm thử | Kết quả |
| --- | --- |
| PostgreSQL thử nghiệm | **13/13 PASS**. Kiểm tra RLS, truy cập trực tiếp, phân quyền nhiều SHOP, ghi thời điểm và người hoàn tất, chống ghi đè bằng phiên bản, sinh việc theo ngày và chống nhắc trùng. |
| Chrome Preview | **7/7 PASS**. Kiểm tra vị trí menu, hai tài khoản cùng SHOP, lọc lịch sử theo thời gian và vai trò, quá hạn, popup và đổi SHOP. Bản thử đo QLST tạo việc và TC nhận sau khoảng 157 ms. |
| Kiểm tra gói | **PASS**. 163 tệp web, kiểm tra CRC ZIP, đường dẫn cache và dựng lại khớp SHA-256. |
| Supabase và Cloudflare đang chạy | **Chờ nghiệm thu có phê duyệt**. Preview chạy migration thật trên PostgreSQL cục bộ, với tài khoản thử và dịch vụ WebSocket thử theo giao thức Supabase. |

## 2. Phần Supabase cần phê duyệt

**CHECKLIST-QLST-SUPABASE.sql** là một migration bổ sung, chạy trong một transaction.

- Tạo bảng `public.qlst_checklist_items`, chỉ cho phép đọc qua RLS theo SHOP. Thêm ba bảng riêng để ghi mốc sinh công việc, cấu hình mẫu theo SHOP và biên nhận popup.
- Bổ sung bốn RPC để mở checklist, lưu, hoàn tất và nhận nhắc. Khi hoàn tất, máy chủ ghi mã, tên, vai trò của người xử lý và giờ thực tế. Phiên bản bản ghi và khóa dòng phân xử hai người thao tác đồng thời.
- Đưa bảng công việc mới vào publication `supabase_realtime`. Các chính sách trên bảng hiện hành không nằm trong migration.
- Dùng `work_shop_memberships.shop_role` để kiểm tra QLST `manager` và TC `shift_lead` trong SHOP đang hoạt động. Tài khoản admin cũng cần membership phù hợp. Lần đối chiếu chỉ đọc ngày 20/11/2026 chưa thấy membership `shift_lead` trong dữ liệu hiện có. Cấp TC đúng SHOP qua luồng phân quyền Companion MWG khi đã được người quản trị duyệt.

## 3. Nghiệm thu trên Supabase thử nghiệm

1. Chọn dự án hoặc nhánh Supabase **thử nghiệm** đã có các bảng `profiles`, `work_shops`, `work_shop_memberships` và publication `supabase_realtime`. Dùng tài khoản và SHOP thử. [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Mở **SQL Editor → New query**, dán nội dung **CHECKLIST-QLST-SUPABASE.sql**, kiểm tra lại tên dự án rồi chạy đúng một lần ở môi trường thử. Xác nhận bảng mới tồn tại, RLS được bật và bảng thuộc publication. Vai trò `authenticated` chỉ có quyền đọc bảng trực tiếp qua RLS. [Supabase Data API](https://supabase.com/docs/guides/api/securing-your-api)
3. Giải nén một bản sao ZIP và chỉnh **config.js** của bản sao thành URL và **publishable key** của Supabase thử nghiệm. Tạo Cloudflare Pages **Preview** với thư mục web của bản sao. Nếu dự án nhận ZIP bằng Direct Upload, nén từ bên trong thư mục để `index.html` nằm ở gốc ZIP. Chọn phương thức triển khai đang dùng trong Dashboard. [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) · [Cloudflare Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
4. Mở Preview bằng hai phiên trình duyệt tách biệt. Đăng nhập QLST và TC của cùng SHOP. QLST tạo một việc, TC sửa ưu tiên và hoàn tất. Cả hai phải thấy trạng thái mới khi mục báo **Đồng bộ trực tiếp**, cùng tên/mã TC và giờ hoàn tất. Thử thêm một việc đã quá hạn rồi xác nhận lịch sử ghi **Hoàn thành trễ**.
5. Lặp lại với tài khoản nhân viên và QLST thuộc SHOP khác. Kiểm tra đường dẫn `/?tool=qlst-checklist` bị chặn ở giao diện. API thử nghiệm phải từ chối thao tác của tài khoản ngoài quyền và trả danh sách trống cho dữ liệu SHOP khác.

## 4. Cách dùng và nhắc việc

- **Cần làm** sắp xếp theo ưu tiên và hạn. Nút **＋ Thêm công việc** cho nhập giờ và chọn người phụ trách tại SHOP. Hai vai trò đều có thể hoàn tất công việc.
- **Hoàn tất** hiển thị người thực hiện, thời điểm và tình trạng đúng hạn hoặc trễ. Có thể lọc theo ngày, tuần, tháng, vai trò hoặc người thực hiện. **Quá hạn** giữ các việc chưa xong qua ngày mới.
- Tám mẫu hằng ngày có giờ gợi ý theo giờ Việt Nam. Trong **Chỉnh** của một mẫu, chọn **Dùng giờ, ưu tiên và nhắc việc này cho các ngày sau** để lưu giờ riêng của SHOP. Mỗi ngày được sinh một lần khi SHOP mở ứng dụng. Nếu SHOP đã bắt đầu dùng và nghỉ vài ngày, lần mở kế tiếp tạo bù các ngày đã qua và giữ lịch sử cũ. **Check Mail Nội Bộ** là mục đánh dấu thủ công.
- Nhắc mặc định 60 phút. Nhập 0 để tắt. Popup chỉ hiện khi ứng dụng đang mở và hiển thị SHOP tương ứng. Mỗi tài khoản nhận một lần theo lịch nhắc của công việc. Phần này dùng popup trong app.

| Mẫu | Hạn gợi ý theo giờ Việt Nam |
| --- | --- |
| Công việc siêu thị | 10:00 |
| Báo cáo hình ảnh đầu ngày | 09:00 |
| Check Mail Nội Bộ | 09:30 |
| Kiểm tra nhân sự và phân ca | 10:30 |
| Kiểm tra doanh thu | 12:00 |
| Kiểm tra trưng bày, bảng giá | 13:30 |
| Kiểm tra hàng hóa và tồn kho | 16:00 |
| Báo cáo cuối ngày | 21:00 |

## 5. Triển khai thật sau khi được phê duyệt

1. Chỉ tiếp tục sau khi nghiệm thu bước 3 và người quản trị duyệt migration cùng bản web. Ghi lại deployment Cloudflare đang dùng để có thể khôi phục. [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Áp dụng migration đã kiểm chứng vào dự án Supabase thật trước. Kiểm tra RLS, publication và membership TC/QLST. Sau đó tải đúng **COMPANION-MWG-CHECKLIST-QLST.zip** theo phương thức đã xác định trong Dashboard. ZIP bàn giao dùng cấu hình web của RC2. Bản sao sửa sang Supabase thử nghiệm dùng riêng cho Preview.
3. Kiểm tra hai tài khoản đã cấp SHOP và xác nhận Realtime trên hạ tầng thật. Kiểm tra lại màn hình Tổng quan và liên kết các công cụ RC2 trước khi đưa cho toàn bộ cửa hàng.
4. Nếu cần lùi bản web, khôi phục deployment trước đó đã lưu. Giữ bảng Checklist để bảo toàn lịch sử. [Cloudflare Rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/)

| Tệp | SHA-256 |
| --- | --- |
| COMPANION-MWG-CHECKLIST-QLST.zip | `aa2584740b840d0fbe80ac8e5298772ad7e3212b39cef96e339f1830f111df19` |
| CHECKLIST-QLST-SUPABASE.sql | `8e273fc32f83aef1549f388e15a8faa7357b6022abfe06ba6f0a31835e1292d0` |
