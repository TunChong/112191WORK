# Gói review bản vá Sticker UI11

Đây là bản xem xét từ gói UI11 Preview. Bản chỉnh đang giới hạn ở 5 file để sửa renderer Sticker và làm mới cache của đúng các bundle Print Studio. Gói chưa sẵn sàng triển khai vì chưa kiểm tra được Chrome, nút xuất PNG/PDF của ứng dụng và máy in vật lý.

## Nội dung

- `modules/mwgx/`: ba file Print Studio đã chỉnh.
- `modules/index.html`, `modules/sw.js`: cập nhật phiên bản tải/cached đúng ba bundle Print Studio.
- `rollback/`: bản trước chỉnh tương ứng của cả 5 file.
- `report/`: báo cáo phân tích video, đối chiếu và giới hạn kiểm thử.
- `evidence/`: ảnh vector kết xuất ngoài ứng dụng và script `verify_print_modes_static.cjs` để chạy lại kiểm tra vector/dữ liệu; không thay thế ảnh Chrome hoặc bản in thật.

Để chạy kiểm tra tĩnh: `node evidence/verify_print_modes_static.cjs` từ thư mục giải nén gói review. Kết quả chỉ chứng minh cách dựng SVG và dữ liệu đầu vào; không chứng minh nút tải PNG/PDF của ứng dụng hoặc bản in máy thật.

Candidate UI11 có 169 đường dẫn, không thêm/xóa file so với gói nguồn. Không chép gói này lên nhánh UI3, Production hoặc Supabase.
