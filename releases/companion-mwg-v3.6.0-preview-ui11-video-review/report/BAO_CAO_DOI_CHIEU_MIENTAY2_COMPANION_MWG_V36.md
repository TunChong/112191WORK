# Báo cáo đối chiếu video Miền Tây 2 và Companion MWG

**Ngày phân tích:** 18/11/2026  
**Video:** MIỀN TÂY 2 - Google Chrome 2026-11-18 15-49-42.mp4  
**Thời lượng:** khoảng 4 phút 18 giây; khung hình 1920 × 1020, 60 fps.  
**Phạm vi mã đã tiếp cận:** bản UI11 Preview được giải nén tại companion_mwgx_source/, không phải working tree Git đang đồng bộ với Production.

## 1. Cách rà soát video

Đã xem toàn bộ thời lượng bằng storyboard 258 ảnh lấy mỗi giây, rà contact sheet và mở riêng các khung hình thao tác in, nhóm Sticker, POPUP và Bảng tên. Đây là phân tích theo mốc 1 giây, không phải xem thủ công đủ cả 15.000+ khung nguồn ở 60 fps. Các thao tác rất nhanh nằm giữa hai mốc có thể cần xác nhận thêm.

## 2. Công cụ và thao tác quan sát được

Trang chủ cho thấy **5 nhóm**: Sticker, Pop-up, Bán hàng, Công việc và Trang trí. Trong video, thao tác cụ thể được ghi nhận ở Sticker, Pop-up và Công việc/Bảng tên. Hai thẻ Bán hàng và Trang trí chỉ xuất hiện trên trang chủ, chưa có thao tác để kết luận chức năng.

| Mốc video (xấp xỉ) | Chức năng / thao tác quan sát | Điều video chứng minh |
|---|---|---|
| 00:00–00:04 | Trang chủ | Có 5 thẻ công cụ nêu trên. |
| 00:05–00:42 | Sticker → **ĐIỀN THÔNG TIN** | 5 mẫu: phần trăm giảm, 2 mẫu gạch giá theo mốc 1 triệu, phiếu mua hàng, “GIÁ RẺ QUÁ / VERY GOOD!”. Mỗi thẻ có ô ghi chú và chọn cỡ nhỏ 6, vừa 2, lớn 1. Mở hộp thoại in Chrome; hướng dẫn chọn A4/A5, lề Không, bật đồ họa nền. |
| 00:43–01:33 | Sticker → **GIÁ CHÉO** | 5 thẻ: 3 mẫu gạch giá và 2 mẫu giá giảm. Có bản chữ nhật và bản viền dạng vé; sau khi chọn mẫu, xem kết quả in trên trang. |
| 01:34–02:03 | Sticker → **TRẢ CHẬM** | 3 mẫu. Trang in hiển thị nhiều huy hiệu trên một tờ; ảnh quan sát cho thấy 6 cột trong phần đang xem, nhưng không đủ căn cứ xác định chính xác tổng số hàng/mẫu của cả trang. |
| 02:04–02:24 | Sticker → **BẢO HIỂM** và **KHÁC** | Nhìn thấy các thẻ bảo hiểm rơi vỡ, bảo hành mở rộng, tặng bảo hành 1/2 năm, 1 đổi 1; nhóm Khác có mẫu sản phẩm đặc biệt/đặc quyền và trợ giá. Số lượng bảo hiểm nhìn thấy là 7 thẻ; nhóm Khác thấy 3 thẻ. |
| 02:25–03:50 | **POPUP** | Có 6 danh mục: ICT, Máy Lạnh, TV & Tủ Lạnh, Lọc Nước, Máy Giặt, Gia Dụng; mỗi danh mục có nhóm Giảm giá, Trả chậm, Dịch vụ. Video duyệt nhiều mẫu theo ngành hàng; có mẫu dịch vụ máy lọc nước và nội dung “SÁNG MUA CHIỀU UP → TRẢ CHẬM 0%…”. Mẫu dịch vụ hiển thị chỉ dẫn cỡ giấy A4 / POPUP A5. Không đủ video để kiểm kê mọi biến thể và trường dữ liệu. |
| 03:51–04:17 | **Công việc → BẢNG TÊN** | Có các tab Bảng tên và Biên bản & Khác. Hộp thoại in cho xem một trang A4 với 6 thẻ tên (2 cột × 3 hàng), mỗi thẻ có vùng logo, TÊN và BỘ PHẬN. Có thao tác in Chrome. Các mẫu khác trong tab chưa được thao tác đủ để xác nhận. |

**Quy trình in đã thấy:** dùng Chrome/Cốc Cốc và nút in của trang để mở Print; chọn giấy A4/A5 theo mẫu, lề Không, bật đồ họa nền. Video không chứng minh đã in ra máy in vật lý hay kiểm tra sai số bằng thước.

## 3. Đối chiếu với bản Companion MWG hiện có trong workspace

| Tiêu chí | Website trong video | Bản UI11 Preview được kiểm tra | Khác biệt / trạng thái | Cần xử lý |
|---|---|---|---|---|
| Giao diện | Thư viện thẻ theo nhóm Sticker; POPUP có danh mục hàng và nhóm Giảm giá/Trả chậm/Dịch vụ; Công việc có trang Bảng tên | Print Studio có các tab POPUP A4, POPUP A5, Giờ vàng, POPUP A7, Sticker, Phiếu bán hàng, Lịch sử | **KHÁC BIỆT**: thiếu cách điều hướng thư viện POPUP theo ngành hàng và Công việc/Bảng tên | Thiết kế, kiểm tra và tích hợp riêng các màn hình còn thiếu vào nhánh an toàn |
| Chức năng | 5 nhóm Sticker; 6 danh mục POPUP × 3 nhóm con; Bảng tên; trang chủ còn Bán hàng/Trang trí chưa thao tác | Có POPUP theo khổ giấy, Giờ vàng, A7, Sticker, phiếu bán hàng và lịch sử | **CÒN THIẾU**: POPUP danh mục, mẫu dịch vụ/trả chậm thực tế, Bảng tên; Bán hàng/Trang trí **CHƯA XÁC MINH** | Chỉ bổ sung hành vi có thể đối chiếu bằng đủ biểu mẫu/video và mã nguồn |
| Kích thước | Sticker Điền thông tin có cỡ 6/2/1; popup có chỉ dẫn A4/POPUP A5; Bảng tên xem trước A4; hộp thoại in có A4/A5 và lề Không | Có bố cục sticker 6/2/1, A4/A5/A7 và các mẫu riêng | **KHÁC BIỆT / CHƯA XÁC MINH**: cỡ A4/A5/A7 trong app không đồng nghĩa với kích thước các mẫu trên video; mật độ trang Trả chậm cần xác minh | Đối chiếu từng mẫu bằng ảnh in đủ trang và kích thước chuẩn, không suy ra từ ảnh màn hình |
| Font chữ | Chữ tiêu đề và số dùng nét đậm/hẹp; ảnh mẫu xem trước bị giới hạn bởi độ phân giải màn hình | Engine nhúng Open Sans ExtraBold và Open Sans Condensed Bold | **CHƯA XÁC MINH**: chưa xác định font gốc từ website và chưa xem render trong Chrome sau sửa | So ảnh xuất từ Chrome ở cùng kích thước; không khẳng định đã giống font 100% |
| Màu sắc | Nhiều mẫu sticker đen trắng; thẻ thư viện xanh/đen; hướng dẫn in nằm bên phải trang in | Sticker mới đang dùng vector đen/trắng; giao diện studio theo phong cách Companion | **KHÁC BIỆT**: không cùng bố cục thư viện/trang in; không phải mọi màu/mẫu đã được kiểm chứng | Bám từng mẫu; không tự thay bố cục |
| Hình ảnh | Có logo “GIÁ RẺ QUÁ / VERY GOOD!”, huy hiệu và nhiều hình viền | Logo GIÁ RẺ QUÁ đang được nhúng dưới dạng ảnh raster; khung/đường nét còn lại vẽ vector | **CHƯA XÁC MINH** chất lượng khi xuất bằng trình duyệt và khi in; logo không phải vector | Kiểm tra xuất Chrome 450 DPI và kích thước thực trước khi xác nhận đạt |
| Mẫu in | Sticker có 5 nhóm; POPUP có nhiều mẫu theo ngành hàng; Bảng tên 6 thẻ/tờ trong khung in được thấy | Đã bổ sung vector cho 23 mẫu Sticker, nhưng chưa có POPUP theo danh mục video và Bảng tên | **CÒN THIẾU** các họ mẫu POPUP/Bảng tên; các SVG Sticker mới là bản dựng theo ảnh tham khảo, chưa đối chiếu từng kích thước với bản gốc | Chưa thể gọi là tương đương 100% |
| PNG/PDF | Video chỉ chứng minh gọi hộp thoại in của trình duyệt; không thấy tải PNG/PDF | Có nút PNG 450 DPI và in trình duyệt; PDF có thể chọn trong hộp thoại in của Chrome | **CHƯA XÁC MINH** luồng PNG của app, PDF của Chrome và in thật; video không chứng minh nút xuất PNG riêng | Phải chạy trong Chrome thật và so file/tờ in; không dùng kết xuất thay thế để kết luận |
| Thao tác | Chọn thẻ/mẫu, điền ghi chú, chọn cỡ ở nhóm đầu, mở Print và chỉnh lề/đồ họa nền | Có form theo mẫu, xem trước vector, các nút In/PNG/lưu nháp; dữ liệu sticker tách theo loại và thứ tự | **MỘT PHẦN ĐÃ CÓ**; luồng popup và công việc chưa khớp. Video không chứng minh mọi sticker cho phép sửa từng ô riêng | Kiểm tra tương tác trình duyệt và từng form sau khi tích hợp |

## 4. Thay đổi đã thực hiện trong bản Preview cục bộ

Chỉ chỉnh 3 file của Print Studio trong thư mục UI11 Preview:

- modules/mwgx/print_studio.js: thêm 5 tab nhóm Sticker và 23 loại mẫu (5/5/3/7/3); giữ riêng dữ liệu theo mẫu và theo vị trí sticker; khi chuyển mẫu không lấy nhầm nội dung mẫu khác.
- modules/mwgx/print_engine.js: thêm renderer vector cho các họ gạch giá, trả chậm, bảo hiểm và nhóm khác; căn đường gạch giá cũ theo tâm ký tự bằng đường cơ sở và cỡ chữ; cắt phần trang trí đỉnh sticker theo đường viền trong để không tràn khỏi viền kép.
- modules/mwgx/style.css: bổ sung kiểu cho tab nhóm và tiêu đề nhóm con.

> Những mẫu mới là dựng lại từ ảnh màn hình nén trong video; đây chưa phải bản xác minh pixel-perfect. Cụm POPUP theo 6 danh mục và Bảng tên chưa được triển khai trong lượt này vì mã UI11 hiện có không chứa các luồng đó và video không cho thấy đầy đủ mọi mẫu/trường để tạo hành vi thật mà không suy đoán.

## 5. Kiểm thử đã chạy và giới hạn

- node --check đạt cho print_studio.js và print_engine.js.
- Harness JavaScript kiểm tra 5 nhóm, đủ 23 loại tạo SVG, khổ A4 6/2/1 và dữ liệu riêng giữa các mẫu: **đạt**.
- Kết xuất SVG bằng Inkscape thành PNG 3720 × 5261 px và PDF một trang A4 210 × 297 mm: **đạt ở bộ kết xuất vector ngoài ứng dụng**. Ảnh sau sửa cho thấy đường viền ngoài không còn bị phần trang trí đỉnh sticker che lấn.
- Kiểm thử giao diện thật trong Chrome/Chromium bị môi trường chặn khởi chạy (socket(): Operation not permitted, ptrace: Operation not permitted). Vì vậy **chưa xác minh** xem trước trên trình duyệt, nút PNG của ứng dụng, hộp thoại in từ ứng dụng, font Chrome, PDF Chrome, máy in vật lý hoặc hồi quy toàn ứng dụng.
- Inkscape cảnh báo không hỗ trợ thuộc tính font-kerning; kết quả này không thay cho việc xác nhận font trong Chrome.

## 6. Bảo toàn hệ thống và quyết định triển khai

- Không thay đổi Supabase, dữ liệu, Authentication, RLS, quyền, SHOP, Nhiệm vụ, Thông báo, Kiểm kê, Audio, Báo giá hay Production.
- Có bản phục hồi trước khi sửa cho đủ 5 file đã chạm tới (3 file Print Studio và 2 file cache/load) trong restore_before_video_sync_20261118/, có SHA-256 đối chiếu.
- Workspace hiện là mã đã giải nén từ gói UI11 Preview, không phải working tree Git sạch; nhánh/staging đang biết trong lịch sử là phiên bản cũ hơn. Do đó không ghi đè nhánh hoặc triển khai gói này như Production.
- **Trạng thái triển khai: CHƯA SẴN SÀNG.** Còn thiếu POPUP theo ngành hàng, Bảng tên, kiểm thử trình duyệt thật, kiểm thử in thực tế và hồi quy. Production vẫn giữ nguyên.

## 7. Trả lời 10 nội dung báo cáo

1. Trang chủ có **5 nhóm công cụ**; video thao tác chi tiết 3 khu vực: Sticker, POPUP, Công việc/Bảng tên.
2. Đã có phần tương ứng về xem trước vector, in từ trình duyệt, chọn mẫu Sticker và kích thước 6/2/1.
3. Khác biệt chính: giao diện thư viện, POPUP theo 6 ngành hàng × 3 nhóm chức năng, mẫu dịch vụ/trả chậm, trang Bảng tên và cách xếp tem.
4. Bảng đối chiếu có **9 tiêu chí**; cả 9 còn ít nhất một điểm khác hoặc chưa xác minh. Số sai khác pixel riêng lẻ chưa thể đếm chính xác từ video nén và thiếu bản in chuẩn.
5. Đã cập nhật 5 nhóm/23 loại Sticker trong bản UI11 Preview cục bộ, tách dữ liệu mẫu, chỉnh gạch giá và sửa phần trang trí sticker bị tràn viền.
6. POPUP theo danh mục, Bảng tên và độ giống chính xác từng mẫu Sticker còn thiếu/chưa xác minh.
7. Đã thay đổi 5 file trong thư mục Preview: 3 file Print Studio (`print_studio.js`, `print_engine.js`, `style.css`) và 2 file làm mới cache (`index.html`, `sw.js`). Không thay đổi Production.
8. Đã kiểm tra cú pháp JS, sinh SVG 23 mẫu, A4 6/2/1, dữ liệu độc lập, PNG/PDF qua Inkscape. Chưa test Chrome, PNG của app, PDF Chrome, máy in vật lý hoặc hồi quy toàn app.
9. Dữ liệu và hệ thống cũ được giữ nguyên vì không sửa Supabase, phân quyền hay các tool khác; có bản khôi phục của cả 5 file đã chỉnh.
10. **Chưa sẵn sàng triển khai.** Chưa thay đổi Production.

## 8. Cập nhật kiểm tra source và candidate — 18/11/2026

- Đã xác định chính xác gói nguồn UI11 đang có trong workspace: `Companion-MWG-v3.6.0-UI11-KIEM-KE-BAO-CAO-MO-RONG.zip`, gồm 169 file.
- Đã dựng lại candidate từ đúng gói UI11. So từng đường dẫn và byte với gói gốc: cùng đủ 169 file, không xóa file; đúng 5 file khác nội dung: `index.html`, `sw.js` và 3 file `modules/mwgx/` (`print_engine.js`, `print_studio.js`, `style.css`). Hai file đầu chỉ đổi query/cache version cho đúng bundle Print Studio mới.
- Tất cả JavaScript trong candidate qua `node --check`. ZIP candidate có 169 đường dẫn duy nhất, CRC hợp lệ và nội dung từng file trùng thư mục source đã kiểm tra.
- Harness JavaScript kiểm tra 23/23 loại Sticker sinh SVG; 3 cách xếp A4 có lần lượt 6/2/1 mẫu; các trường dữ liệu của từng sticker và từng loại sticker được giữ riêng. Kết quả này xác nhận logic dữ liệu/vector, chưa xác nhận pixel-perfect hay in ngoài đời.
- Đối chiếu GitHub: `main` chỉ có các snapshot khôi phục cũ; nhánh staging đang có release UI3 chứ không có đủ source UI11. `print_engine.js` UI3 là 7.996 byte, còn UI11 là 351.654 byte; bản sao lưu UI3 cũng không trùng mã UI11. Vì vậy không chép patch UI11 vào nhánh UI3.
- Candidate UI11 SHA-256: `1efa4389060dbbf006492688b8d86684c17e7add8f2a396ced7f73a3731fa10f`. Gói có đủ 169 file, không thêm/xóa đường dẫn; từng byte trong ZIP khớp source đã kiểm tra.
- Có PR nháp #1 trên nhánh review để ghi nhận bản vá và báo cáo. PR chưa được merge; chưa triển khai Cloudflare và chưa thay đổi Production, Supabase, Authentication hay RLS.

### Còn cần kiểm chứng trước khi gọi là hoàn tất

- Xem trước trong Chrome của đúng môi trường Companion, tải PNG của ứng dụng, hộp thoại PDF/in và in thử trên máy thật chưa kiểm tra được trong môi trường hiện tại.
- Font dùng trong Chrome và độ giống từng chi tiết với website tham chiếu chưa được chứng minh 100%; ảnh video nén không thay cho file mẫu gốc hoặc bản in chuẩn.
- Repository hiện chưa có source UI11 đầy đủ trên nhánh staging. Candidate hiện là gói riêng để xem, không phải bản đã tích hợp vào nhánh build của Cloudflare.

## 9. Cập nhật chỉnh sticker theo khung in gốc — 18/11/2026

- Rà lại khung 00:19 cho mẫu phần trăm 6 tem/tờ, 01:03 cho mẫu gạch giá lớn và khung phóng lớn của sticker gốc. Mẫu phần trăm trong video là bát giác gần vuông, viền kép đen trắng, mảng đỉnh đen có sao trắng, chữ “GIẢM SỐC”, tên sản phẩm, phần trăm lớn, thanh thời gian và ngày áp dụng.
- Sửa `markHexSticker()` để dựng cấu trúc này bằng SVG vector; giá trị chữ trên từng tem tiếp tục lấy từ `items[index]`. Tem 6/tờ xấp xỉ 78 × 78 mm và tem 1/tờ xấp xỉ 180 × 180 mm theo tỷ lệ xem trước A4 trong video. Đây là ước lượng hình học trên màn hình, chưa xác nhận bằng bản in đo thước.
- Mẫu gạch giá lớn thứ ba chuyển sang khung bát giác: giá cũ gạch ngang qua tâm chữ, giá mới lớn, thanh thời gian và ngày áp dụng. Các thẻ thư viện giá chữ nhật/dạng vé vẫn giữ renderer riêng.
- Sau chỉnh sửa: `node --check` toàn bộ JavaScript trong source UI11 đạt; kiểm tra 23 loại Sticker ở ba cỡ A4 6/2/1 đều sinh SVG hợp lệ, không có `NaN`; kiểm tra sáu nội dung tem riêng biệt không bị gộp; mẫu gạch giá lớn sinh vector bát giác.
- Đã kết xuất ảnh A4 6 tem bằng Inkscape để đối chiếu hình học. Đây là kết xuất ngoài ứng dụng, không thay cho kiểm thử Chrome hoặc xác nhận in từ Companion.
- **Kiểm thử trình duyệt vẫn bị chặn:** Chromium kết thúc trước khi khởi chạy trang vì môi trường báo `socket() failed: Operation not permitted` và `ptrace: Operation not permitted`. Chưa xác minh nút PNG/PDF trong ứng dụng, hộp thoại in Chrome hay máy in vật lý. Candidate vẫn chưa sẵn sàng triển khai.

## 10. Cập nhật cache và gói review

- Đã đổi query string của riêng `modules/mwgx/style.css`, `print_engine.js`, `print_studio.js` sang `3.6.0-preview-ui12`; service worker dùng cache `companion-mwg-v3.6.0-preview-ui12` và precache đúng ba bundle này. Các bundle không liên quan giữ nguyên.
- Bản restore gồm cả `index.html` và `sw.js` trước khi đổi cache, ngoài ba file Print Studio gốc.
- Gói candidate đã kiểm tra lại CRC, 169 đường dẫn và byte-for-byte với thư mục source. Cú pháp JS toàn bộ source đạt; kiểm tra sinh SVG cho 23 mẫu × 3 cỡ A4 đạt.
- PR nháp chỉ để review mã; chưa merge/deploy. Kiểm thử trực tiếp trong Chrome và in máy thật còn là cổng bắt buộc trước triển khai.
