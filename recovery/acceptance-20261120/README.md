# Nghiệm thu Companion MWG trên Preview — 20/11/2026

Chrome 156 đạt **8/8, 0 FAIL** trên bản ghép cuối với hai SHOP giả. Checkpoint chức năng trước đó là `00a935b`. Các bản vá cũ và checkpoint HTTP/PWA `0270d99` vẫn khớp SHA-256. Kết quả trước/sau và phép đo các file xuất nằm trong [`chrome-results.json`](chrome-results.json).

| Nhóm | Kết quả trên Chrome |
| --- | --- |
| In ấn UI11 | A7 có bốn mẫu, phiếu bán hàng có mười ô độc lập và Giờ Vàng khôi phục đúng bản nháp ngay sau tải lại. |
| Báo giá | PNG 1.840 × 1.778 và PDF một trang A4 ngang hiển thị đủ sáu ảnh theo đúng thứ tự và tỷ lệ. Nhận ảnh thay thế khi ảnh đầu tiên trả 404 trong môi trường thử. Nháp SHOP A/B độc lập kể cả khi ảnh đang đọc. |
| Kiểm kê 5.0 | Hai biểu mẫu giữ tên kỳ và tệp Excel khi làm mới. Excel không IMEI ghi thiếu 2 và dư 1. Khóa kỳ chặn nhập, mở khóa cho nhập lại. IMEI không ghi trùng và mã dư/thiếu giữ số 0 đầu dưới dạng text. |
| Kiểm kê Chủ Động | Hoàn tác số lượng 5 → 2, SHOP khác trống và tải lại phục hồi số lượng đã lưu. |
| Audio | Chặn kịch bản quá dài và yêu cầu thiếu xác nhận. Gửi một đơn thử và thấy lịch sử chờ duyệt trong Preview. |
| Thông báo | Mô phỏng tín hiệu tới tab đang mở. Popup ưu tiên cao mở đúng nhiệm vụ. |

Ba bản vá tiếp theo được áp theo thứ tự dưới đây. Các file `*.sha256.json` lưu cả hash đầu vào và đầu ra. Dùng `git apply --unidiff-zero --check` rồi `git apply --unidiff-zero` trong bản copy đúng phiên bản.

1. `print-draft.patch` áp sau `print-ui11.patch` trên UI11. Khi mở In ấn, màn hình cập nhật ngay từ nháp đã đọc. Khi đổi SHOP, dữ liệu nháp được nạp riêng cho SHOP đó.
2. `quote-upload.patch` áp sau `stable-quote.patch` trên bản ổn định. Ảnh đính kèm hoàn tất muộn chỉ được ghi vào đúng nháp, đúng SHOP và đúng sản phẩm ban đầu nếu chúng còn đang được chỉnh.
3. `inventory-import.patch` áp sau `quote-upload.patch` trên bản ổn định. Biểu mẫu giữ file và tên kỳ trong bộ nhớ của phiên theo người dùng và SHOP. Việc làm mới màn hình không bỏ tệp. Kỳ kiểm kê tiếp tục sử dụng API hiện tại.

Các overlay cập nhật phiên bản tài nguyên và tên cache cần thiết để tải file vừa sửa. Dùng bản Preview cô lập qua Work. Phần Audio hiển thị ảnh nhắc dùng dữ liệu giả thay cho mã thanh toán. Hệ thống thử chỉ ghi dữ liệu giả vào tiến trình cục bộ và không trỏ tới Supabase production.

## Anh nghiệm thu trong Work

Mở tab **Companion MWG · Nghiệm thu Preview** và chọn **Chạy nghiệm thu** để xem tám kết quả. Muốn thử tay thì bấm **Mở In ấn** hoặc **Mở ứng dụng**. Trong Báo giá, chọn siêu thị, thêm hoặc tải ảnh thử, đổi qua SHOP B rồi về SHOP A để kiểm tra dữ liệu. Bấm **Chụp bảng báo giá** và **Xuất PDF**, mở hai file và xem đủ ảnh, tổng tiền và mép dưới trang.

## Thiết bị thật chưa kiểm thử

| Thiết bị | Việc cần thử trên môi trường thử nghiệm có quyền truy cập |
| --- | --- |
| Máy in | In A4/A5 ở tỷ lệ 100% với đúng khổ giấy. In tờ sticker 6/2/1 mẫu. Đo lề và kích thước trên giấy, kiểm tra viền, chữ và vùng cắt. |
| Máy quét USB và camera điện thoại | Quét QR và mã vạch thật. Với camera, mỗi lượt nhận đúng một mã rồi dừng và chỉ quét tiếp khi bấm **Quét tiếp**. Quét lại một IMEI có số 0 đầu và kiểm tra chỉ có một dòng trong Excel. |
| iPhone | Mở Preview HTTPS từ Safari để tải PNG/PDF/XLSX và mở file. Thử Audio khi chuyển ứng dụng rồi quay lại. Với PWA, cấp quyền thông báo, khóa màn hình hoặc đưa app xuống nền, gửi việc thử rồi chạm thông báo để mở đúng nhiệm vụ. |

Preview ở `http://127.0.0.1:4173/qa/acceptance.html` chỉ mở từ trình duyệt Work của phiên này. Chưa có URL HTTPS riêng để thử iPhone, giao hàng Audio thật, ảnh từ dịch vụ ngoài hoặc Web Push khi app đóng. HTTP 555 chờ bằng chứng upstream mới theo checkpoint HTTP/PWA.

Để mở lại Preview, tái sử dụng hai ZIP đã xác minh của lượt trước và các thư viện đã lưu. Trình chuẩn bị kiểm tra hash trước khi ghép các bản vá.

```sh
python recovery/acceptance-20261120/preview/prepare.py STABLE_ZIP UI11_BASE_ZIP HTML2CANVAS_JS JSPDF_JS XLSX_JS HTML5_QRCODE_JS /workspace/scratch/mwg-acceptance
sites-preview start /workspace/scratch/mwg-acceptance
```
