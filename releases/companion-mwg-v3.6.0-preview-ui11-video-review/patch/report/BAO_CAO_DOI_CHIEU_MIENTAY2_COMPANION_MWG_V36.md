# Báo cáo đối chiếu video Miền Tây 2 và Companion MWG

**Ngày phân tích:** 18/11/2026  
**Video:** MIỀN TÂY 2 - Google Chrome 2026-11-18 15-49-42.mp4  
**Thời lượng:** 257,634 giây (xấp xỉ 4 phút 18 giây); video 1920 × 1020. `ffprobe` báo tốc độ khung danh nghĩa 60 fps, nhưng luồng giải mã có 7.431 khung hình trong 257,634 giây, tương đương trung bình khoảng 28,84 khung/giây.  
**Phạm vi mã đã tiếp cận:** bản UI11 Preview được giải nén tại companion_mwgx_source/, không phải working tree Git đang đồng bộ với Production.

## 1. Cách rà soát video

Đã giải mã đủ 7.431 khung hình. Sau storyboard 1 ảnh/giây, em quét khác biệt hình ảnh trên toàn bộ khung đã giải mã ở bản thu nhỏ 640 × 340; ngưỡng thay đổi là 6% điểm ảnh và gom được 87 trạng thái hình ảnh đáng kể. Em đã rà 8 contact sheet chứa đủ 87 trạng thái, rồi trích 28 khung đại diện ở độ phân giải gốc để xác nhận số tem/tờ và biểu mẫu. Đây là quét chuyển trạng thái hình ảnh, không phải nhật ký đầy đủ từng cú nhấp, phím bấm hoặc từng ký tự nhập; thao tác nhanh/không làm đổi nhiều điểm ảnh có thể không được phát hiện.

## 2. Công cụ và thao tác quan sát được

Trang chủ cho thấy **5 nhóm**: Sticker, Pop-up, Bán hàng, Công việc và Trang trí. Trong video, thao tác cụ thể được ghi nhận ở Sticker, Pop-up và Công việc/Bảng tên. Hai thẻ Bán hàng và Trang trí chỉ xuất hiện trên trang chủ, chưa có thao tác để kết luận chức năng.

| Mốc video (xấp xỉ) | Chức năng / thao tác quan sát | Điều video chứng minh |
|---|---|---|
| Mốc video (xấp xỉ) | Công cụ / thao tác | Điều khung hình chứng minh |
|---|---|---|
| 00:00–00:05 | Trang chủ | Có 5 thẻ: Sticker, Pop-up, Bán hàng, Công việc, Trang trí. Hai thẻ Bán hàng và Trang trí chỉ xuất hiện ở trang chủ; chưa thấy mở. |
| 00:05.7–01:33 | Sticker → **ĐIỀN THÔNG TIN**, **GIÁ CHÉO** | “Điền thông tin” có 5 mẫu (phần trăm giảm, hai mẫu gạch giá, phiếu mua hàng, “GIÁ RẺ QUÁ / VERY GOOD!”); thẻ có ô ghi chú và ba lựa chọn cỡ nhỏ 6, vừa 2, lớn 1. “Giá chéo” có 5 thẻ (3 gạch giá, 2 giá giảm), gồm mẫu chữ nhật và mẫu viền dạng vé. Chọn thẻ mở trang in/xem trước. |
| 01:34–02:02 | Sticker → **TRẢ CHẬM** | Có 3 mẫu. Các hộp thoại Print cho thấy A4: Mẫu 1 xếp 6 × 5 = 30 tem/tờ (01:42.8); Mẫu 2 xếp 4 × 6 = 24 tem/tờ (01:52.5); Mẫu 2 – CE xếp 3 × 5 = 15 tem/tờ (02:00.1). Đây là số tem nhìn thấy trên đúng các trang in mẫu trong video, không khẳng định mọi loại giấy/cấu hình đều như vậy. |
| 02:03–02:22 | Sticker → **BẢO HIỂM**, **KHÁC** | Thư viện thấy 7 mẫu bảo hiểm (rơi vỡ, bảo hành mở rộng, tặng bảo hành 1/2 năm, 1 đổi 1 và biến thể) và 3 thẻ nhóm Khác. Trang A4 của mẫu bảo hiểm đang xem thể hiện 4 × 3 = 12 tem/tờ (02:05.4); mẫu “TRỢ GIÁ 0 TRIỆU” thể hiện 2 × 3 = 6 tem/tờ (02:22.9). |
| 02:26.5–03:44.8 | **POPUP** | Thư viện có bộ chọn tiêu đề, tìm/lọc, 6 danh mục ICT / Máy Lạnh / TV & Tủ Lạnh / Lọc Nước / Máy Giặt / Gia Dụng và 3 nhóm Giảm giá / Trả chậm / Dịch vụ. Mẫu giảm giá “GIÁ RẺ QUÁ!!” được xem trên A4 với 2 × 2 = 4 mẫu/tờ (02:31.7). Mẫu trả chậm có trang A4 3 × 2 = 6 mẫu/tờ (03:07.5); form cho thấy “TRẢ CHẬM 0%”, “TRẢ TRƯỚC CHỈ”, giá làm hồ sơ/tháng/ngày/chênh lệch. Nhóm dịch vụ có mẫu Máy lọc nước và TV & Tủ lạnh; trang in có bảng hạng mục và giá, cùng nội dung “SÁNG MUA CHIỀU UP / TRẢ CHẬM 0% – TRẢ TRƯỚC 0Đ” (03:37.7). Không đủ khung để xác nhận công thức/điều kiện nghiệp vụ hoặc mọi biến thể. |
| 03:51.2–04:16.7 | **Công việc** → **BẢNG TÊN**, **BIÊN BẢN & KHÁC** | Bảng tên có thẻ **MẪU CŨ (LỚN)** và **MẪU MỚI (NHỎ)**. Print xem trước A4 có 6 thẻ (2 × 3), từng thẻ có logo và vùng TÊN/BỘ PHẬN (03:56.2–04:04.9). “Biên bản & Khác” hiện một mẫu biên bản và hai mẫu Sticker máy; video mở trang in Sticker máy Mẫu 1 nhưng không đủ cảnh để xác minh nhập liệu/lưu và cách dùng các mẫu này. |

**Luồng in quan sát được:** nút **In Ngay** mở hộp thoại Chrome; nhiều ảnh xác nhận giấy A4, 1 trang trên mỗi tờ, bố cục dọc. Bảng **HƯỚNG DẪN IN** ghi chọn A4/A5 tùy mẫu, lề Không, bật đồ họa nền. Tuy vậy, các hộp thoại Print chụp được ở một số mẫu đang hiển thị lề **Default**; video không chứng minh người dùng đã đổi thành “Không” trước khi in. Không có bằng chứng trang giấy đã được in thật hoặc đo sai số bằng thước.

## 3. Đối chiếu với bản Companion MWG hiện có trong workspace

| Tiêu chí | Website trong video | Bản UI11 Preview được kiểm tra | Khác biệt / trạng thái | Cần xử lý |
|---|---|---|---|---|
| Giao diện | Thư viện thẻ theo nhóm Sticker; POPUP có danh mục hàng và nhóm Giảm giá/Trả chậm/Dịch vụ; Công việc có trang Bảng tên | Print Studio có các tab POPUP A4, POPUP A5, Giờ vàng, POPUP A7, Sticker, Phiếu bán hàng, Lịch sử | **KHÁC BIỆT**: thiếu cách điều hướng thư viện POPUP theo ngành hàng và Công việc/Bảng tên | Thiết kế, kiểm tra và tích hợp riêng các màn hình còn thiếu vào nhánh an toàn |
| Chức năng | 5 nhóm Sticker; 6 danh mục POPUP × 3 nhóm con; Bảng tên; trang chủ còn Bán hàng/Trang trí chưa thao tác | Có POPUP theo khổ giấy, Giờ vàng, A7, Sticker, phiếu bán hàng và lịch sử | **CÒN THIẾU**: POPUP danh mục, mẫu dịch vụ/trả chậm thực tế, Bảng tên; Bán hàng/Trang trí **CHƯA XÁC MINH** | Chỉ bổ sung hành vi có thể đối chiếu bằng đủ biểu mẫu/video và mã nguồn |
| Kích thước | Sticker Điền thông tin có cỡ 6/2/1; popup có hướng dẫn A4/A5; Bảng tên xem trước A4; hộp thoại Print đã thấy khổ A4 và lề Default ở một mẫu | Có bố cục sticker 6/2/1, A4/A5/A7 và các mẫu riêng | **KHÁC BIỆT / CHƯA XÁC MINH**: cỡ A4/A5/A7 trong app không đồng nghĩa với kích thước các mẫu trên video; mật độ đã thấy được xác nhận 30/24/15 cho ba mẫu Trả chậm; kích thước thực và các cấu hình khác chưa xác minh | Đối chiếu từng mẫu bằng ảnh in đủ trang và kích thước chuẩn, không suy ra từ ảnh màn hình |
| Font chữ | Chữ tiêu đề và số dùng nét đậm/hẹp; ảnh mẫu xem trước bị giới hạn bởi độ phân giải màn hình | Engine nhúng Open Sans ExtraBold và Open Sans Condensed Bold | **CHƯA XÁC MINH**: chưa xác định font gốc từ website và chưa xem render trong Chrome sau sửa | So ảnh xuất từ Chrome ở cùng kích thước; không khẳng định đã giống font 100% |
| Màu sắc | Nhiều mẫu sticker đen trắng; thẻ thư viện xanh/đen; hướng dẫn in nằm bên phải trang in | Sticker mới đang dùng vector đen/trắng; giao diện studio theo phong cách Companion | **KHÁC BIỆT**: không cùng bố cục thư viện/trang in; không phải mọi màu/mẫu đã được kiểm chứng | Bám từng mẫu; không tự thay bố cục |
| Hình ảnh | Có logo “GIÁ RẺ QUÁ / VERY GOOD!”, huy hiệu và nhiều hình viền | Logo GIÁ RẺ QUÁ đang được nhúng dưới dạng ảnh raster; khung/đường nét còn lại vẽ vector | **CHƯA XÁC MINH** chất lượng khi xuất bằng trình duyệt và khi in; logo không phải vector | Kiểm tra xuất Chrome 450 DPI và kích thước thực trước khi xác nhận đạt |
| Mẫu in | Sticker có 5 nhóm; POPUP có nhiều mẫu theo ngành hàng; Bảng tên 6 thẻ/tờ trong khung in được thấy | Đã bổ sung vector cho 23 mẫu Sticker, nhưng chưa có POPUP theo danh mục video và Bảng tên | **CÒN THIẾU** các họ mẫu POPUP/Bảng tên; các SVG Sticker mới là bản dựng theo ảnh tham khảo, chưa đối chiếu từng kích thước với bản gốc | Chưa thể gọi là tương đương 100% |
| PNG/PDF | Video chỉ chứng minh gọi hộp thoại in của trình duyệt; không thấy tải PNG/PDF | Có nút PNG 450 DPI và in trình duyệt; PDF có thể chọn trong hộp thoại in của Chrome | **CHƯA XÁC MINH** luồng PNG của app, PDF của Chrome và in thật; video không chứng minh nút xuất PNG riêng | Phải chạy trong Chrome thật và so file/tờ in; không dùng kết xuất thay thế để kết luận |
| Thao tác | Chọn thẻ/mẫu, điền ghi chú, chọn cỡ ở nhóm đầu, mở Print và chỉnh lề/đồ họa nền | Có form theo mẫu, xem trước vector, các nút In/PNG/lưu nháp; dữ liệu sticker tách theo loại và thứ tự | **MỘT PHẦN ĐÃ CÓ**; luồng popup và công việc chưa khớp. Video không chứng minh mọi sticker cho phép sửa từng ô riêng | Kiểm tra tương tác trình duyệt và từng form sau khi tích hợp |

## 4. Thay đổi đã thực hiện trong bản Preview cục bộ

Phần dựng mẫu sửa 3 file Print Studio; thêm 2 thay đổi cache có phạm vi hẹp để tải đúng ba file đó:

- modules/mwgx/print_studio.js: thêm 5 tab nhóm Sticker và 23 loại mẫu (5/5/3/7/3); giữ riêng dữ liệu theo mẫu và theo vị trí sticker; khi chuyển mẫu không lấy nhầm nội dung mẫu khác.
- modules/mwgx/print_engine.js: thêm renderer vector cho các họ gạch giá, trả chậm, bảo hiểm và nhóm khác; căn đường gạch giá cũ theo tâm ký tự bằng đường cơ sở và cỡ chữ; cắt phần trang trí đỉnh sticker theo đường viền trong để không tràn khỏi viền kép.
- modules/mwgx/style.css: bổ sung kiểu cho tab nhóm và tiêu đề nhóm con.

> Những mẫu mới là dựng lại từ ảnh màn hình nén trong video; đây chưa phải bản xác minh pixel-perfect. Cụm POPUP theo 6 danh mục và Bảng tên chưa được triển khai trong lượt này vì mã UI11 hiện có không chứa các luồng đó và video không cho thấy đầy đủ mọi mẫu/trường để tạo hành vi thật mà không suy đoán.

## 5. Kiểm thử đã chạy và giới hạn

- node --check đạt cho print_studio.js và print_engine.js.
- Harness JavaScript kiểm tra 5 nhóm, đủ 23 loại tạo SVG, khổ A4 6/2/1 và dữ liệu riêng giữa các mẫu: **đạt**.
- Kết xuất SVG bằng Inkscape thành PNG 3720 × 5262 px (450 DPI) và PDF một trang A4 210 × 297 mm: **đạt ở bộ kết xuất vector ngoài ứng dụng**. Ảnh sau sửa cho thấy đường viền ngoài không còn bị phần trang trí đỉnh sticker che lấn. Đây không phải nút PNG/PDF của Companion.
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

- Đối chiếu riêng hai mẫu nhìn thấy trong video: khung 00:19 là mẫu phần trăm 6 tem/tờ; khung 01:03 là “GẠCH GIÁ – LỚN”, một tem bát giác lớn có mào đen/ngôi sao, “GIẢM SỐC”, tên sản phẩm, giá cũ bị gạch giữa dòng, giá mới, thanh thời gian và ngày áp dụng. Hình “GIÁ RẺ QUÁ / VERY GOOD!” là một mẫu khác, có logo riêng, dòng “GIẢM CÒN” và một giá bán.
- `markHexSticker()` giữ renderer riêng cho nhóm phần trăm/gạch giá lớn; biến thể gạch giá lớn thứ ba mặc định dùng tiêu đề “GIẢM SỐC” và ghi chú “THỜI GIAN ÁP DỤNG”. Đường gạch giá cũ nằm qua thân chữ với nét 0,65 mm.
- Mẫu “GIÁ RẺ QUÁ / VERY GOOD!” tiếp tục dùng renderer/logo riêng, không thay bằng mẫu phần trăm. Cạnh trong được đặt 1 mm và nét viền ngoài 0,6 mm; ở mẫu gạch giá, viền trong cũng 1 mm. Đây là kích thước SVG theo đơn vị mm, chưa xác nhận sai số trên giấy thật.
- Các giá trị tiếp tục lấy từ `items[index]`, nên sáu tem là sáu bộ nội dung độc lập. Cỡ hiển thị của tem 6/tờ và 1/tờ dựa trên bố cục A4 trong video, chưa đo từ bản in gốc.
- Sau lượt chỉnh lại: toàn bộ JavaScript UI11 qua `node --check`; harness dựng **69 SVG (23 loại × 3 cỡ A4 6/2/1)**, không có `NaN`, sai số tem hoặc khung SVG hỏng. Harness xác nhận tiêu đề/ghi chú của mẫu gạch giá lớn, nét viền trong 1 mm, gạch giá cũ 0,65 mm và sáu tên tem riêng; đổi qua mẫu khác rồi quay lại vẫn giữ dữ liệu.
- Inkscape chỉ dùng để xuất ảnh vector đối chiếu, không thay cho kiểm thử Chrome/PNG/PDF của app. **Kiểm thử trình duyệt vẫn bị môi trường chặn** (`socket() failed: Operation not permitted`, `ptrace: Operation not permitted`); chưa xác minh hộp thoại in Chrome hoặc máy in vật lý. Candidate chưa sẵn sàng triển khai.

## 10. Cập nhật cache và gói review

- Đổi query string riêng cho `modules/mwgx/style.css`, `print_engine.js`, `print_studio.js` sang `3.6.0-preview-ui13`; service worker dùng cache `companion-mwg-v3.6.0-preview-ui13` và precache đúng ba bundle này. Các bundle không liên quan giữ nguyên.
- Bản restore gồm cả `index.html` và `sw.js` trước khi đổi cache, ngoài ba file Print Studio gốc.
- Sau chỉnh sửa, candidate có 169 đường dẫn và đúng 5 nội dung khác gói UI11 gốc; ZIP CRC đạt, checksum manifest đạt, các file bên trong khớp source và năm bản rollback khớp byte với đúng gói nguồn ban đầu.
- Candidate SHA-256 sau lượt này: `90f7f4745cb32e35da0935666ac5702a968d2e2dcf00eda82e07a69dd7941507`. PNG 450 DPI được xuất bằng Inkscape; kiểm thử PNG/PDF riêng của ứng dụng vẫn chưa thể chạy vì Chromium bị chặn.
- PR nháp chỉ để review mã; chưa merge/deploy. Kiểm thử trực tiếp trong Chrome và in máy thật còn là cổng bắt buộc trước triển khai.

## 11. Rà lại cảnh POPUP và Công việc bằng khung hình gốc

> Ghi chú sau khi trích các khung đại diện 02:26.5–03:44.8 và 03:51.2–04:16.7 ở độ phân giải gốc. Các nội dung dưới đây là những gì nhìn thấy được; số lượng đầy đủ của thư viện không được suy ra từ phần cuộn hiện trên màn hình.

### POPUP — 02:26.5–03:44.8

- Trang thư viện có bộ chọn **TIÊU ĐỀ POPUP**, ô **Nhập từ khóa**, nút lọc, 6 chip ngành hàng **ICT / Máy Lạnh / TV & Tủ Lạnh / Lọc Nước / Máy Giặt / Gia Dụng** và 3 nhóm **GIẢM GIÁ / TRẢ CHẬM / DỊCH VỤ**.
- Mỗi mẫu là một thẻ gồm hình minh họa sản phẩm, tên kiểu mẫu và một dòng thuộc tính chỉ rõ **GIẤY**, **POPUP** và kiểu nội dung (ví dụ GIÁ GIẢM, GẠCH GIÁ, ƯU ĐÃI, PHẦN TRĂM, TRẢ CHẬM 0%). Các ví dụ đọc được gồm “BÀN TRẢI NGHIỆM”, “LED - GIẢM GIÁ SỐC”, “PHỤ KIỆN”, “MÁY LẠNH”, “MÁY LỌC NƯỚC”.
- Có loại dùng khổ A4/A5, A6, A7, LED và MLN; đây là nhãn xuất hiện trên từng thẻ, không đủ căn cứ khẳng định mọi tổ hợp giấy/POPUP đều có trong thư viện.
- Nhấn thẻ mẫu dẫn tới trang biểu mẫu/xem in riêng, có nút **In Ngay** và bảng **HƯỚNG DẪN IN** bên phải. Hướng dẫn thấy rõ: mở Cài đặt khác; chọn khổ A4/A5 theo mẫu; chọn lề Không; bật Đồ họa nền. Video cho thấy vùng nhập/điều chỉnh dữ liệu trong một số mẫu, nhưng không đủ khung hình để ghi chính xác danh sách trường của từng biến thể.
- Các cảnh “POPUP TRẢ CHẬM” có mẫu ICT và TV & Tủ Lạnh; ảnh in thể hiện một tờ có nhiều ô lặp theo lưới, tiêu đề “TRẢ CHẬM 0%”, vùng “TRẢ TRƯỚC CHỈ”, số tiền và phần tính phí. Không đo được kích thước từng ô từ video nén.
- Mẫu dịch vụ Máy lọc nước và Máy lạnh được hiện riêng; một số thẻ mang nhãn MLN/A4. Các nội dung “SÁNG MUA CHIỀU UP” và “TRẢ CHẬM 0%” có mặt trên biểu mẫu, nhưng không đủ cơ sở để khẳng định toàn bộ công thức tính/điều kiện nghiệp vụ.

### Công việc — Bảng tên và Biên bản & Khác (03:51.2–04:16.7)

- Trang **BẢNG TÊN NHÂN VIÊN** có hai mẫu thẻ tên: **MẪU CŨ (LỚN)** và **MẪU MỚI (NHỎ)**. Các thẻ cho thấy vùng logo, tên và bộ phận.
- Hộp thoại Chrome ở khoảng 03:55–03:58 cho thấy **1 trang giấy**, bản xem in có **6 thẻ tên trên A4, 2 cột × 3 hàng**. Có thao tác mở hộp thoại in; không có bằng chứng về bản giấy đã in.
- Nhóm **BIÊN BẢN & KHÁC** hiển thị ít nhất ba mẫu: **BIÊN BẢN – SỰ CỐ NHẬN HÀNG**, **STICKER MÁY – MẪU 1** và **STICKER MÁY – MẪU 2**. Video chỉ cho thấy thư viện/xem trước của nhóm này; chưa chứng minh thao tác nhập, lưu hoặc in từng mẫu.

### Đối chiếu lại phạm vi UI11

- UI11 có các tab **POPUP A4, POPUP A5, GIỜ VÀNG GIÁ SỐC, POPUP A7, Sticker, Phiếu bán hàng, Lịch sử**. Đây là các form theo khổ/loại chung; không có trang thư viện POPUP theo ngành hàng và không có hai bộ lọc con Giảm giá/Trả chậm/Dịch vụ như video.
- Trong UI11 không tìm thấy trang **Bảng tên**, hai biến thể cỡ lớn/nhỏ, trang **Biên bản & Khác** hoặc các mẫu nêu trên. Các thẻ **Bán hàng** và **Trang trí** chỉ được thấy ở trang chủ của video, nên chức năng bên trong vẫn là **CHƯA XÁC MINH**.
- Do thiếu mẫu nguồn và dữ liệu nghiệp vụ đầy đủ, phần POPUP theo ngành hàng và các mẫu Công việc vẫn được đánh dấu **CÒN THIẾU**; không tạo các nút giả chỉ dẫn về form chưa tồn tại và không gọi bản Sticker hiện tại là bản sao 100% của website.

### Kiểm tra tĩnh bổ sung trên gói review

- Có script tái chạy kiểm tra tĩnh tại `evidence/verify_print_modes_static.cjs`. Chạy bằng `node evidence/verify_print_modes_static.cjs` từ thư mục `review_patch`.
- Script sinh vector và kiểm tra tỷ lệ/đếm mẫu của POPUP A4 (2 mẫu/tờ), POPUP A5 ngang (1 mẫu/tờ), Giờ vàng A4 (1/tờ), POPUP A7 (4/tờ), phiếu bán hàng A4 (2 × 5, 10/tờ), Sticker A4 (6/2/1), cùng 69 trường hợp sticker (23 loại × 3 cỡ).
- Kiểm tra nội dung độc lập tại POPUP A4 (2 ô), POPUP A7 (ô 1 và ô 4), Phiếu bán hàng (ô 1 và ô 10), và ô 1/6 của **cả 23 loại Sticker** đều giữ giá trị riêng sau khi đổi qua lại các mẫu. **Đạt kiểm tra tĩnh**; kết quả này không thay thế trình duyệt hoặc in thực.
- Môi trường vẫn chặn Chromium nên trạng thái tổng thể **CHƯA SẴN SÀNG TRIỂN KHAI** không thay đổi.


## 12. Mở rộng rà soát toàn bộ khung hình — 18/11/2026

- Đã đối chiếu lại thông số video bằng `ffprobe`: thời lượng luồng hình 257,634 giây, kích thước 1920 × 1020, 7.431 khung hình; tốc độ luồng danh nghĩa được báo là 60 fps nhưng trung bình tính từ số khung/thời lượng là khoảng 28,84 fps. Con số 60 fps trong bản báo cáo trước không mô tả đúng tốc độ khung thực tế đã giải mã.
- `video_analysis/review_full_frame_changes.py` giải mã toàn bộ khung hình, thu nhỏ để dò thay đổi điểm ảnh với ngưỡng 6%, rồi gom thành 87 mốc thay đổi hình ảnh. 87 mốc được xếp vào 8 contact sheet và rà bằng mắt; 28 khung gốc đại diện được trích để đọc số lượng bố cục in. Đây không phải bằng chứng đã ghi nhận từng lần rê chuột, từng phím bấm hoặc toàn bộ nội dung từng ô nhập.
- Kiểm tra khung gốc bổ sung xác nhận số tem A4 của ba mẫu **Sticker Trả chậm** là 30 / 24 / 15 (lần lượt 6 × 5, 4 × 6, 3 × 5); mẫu Bảo hiểm đang xem là 12 (4 × 3), mẫu Khác “Trợ giá 0 triệu” là 6 (2 × 3). Những số này cập nhật lại chỗ trước đây báo chỉ thấy 6 cột nhưng chưa đủ căn cứ đếm hàng.
- Cảnh POPUP xác nhận ví dụ in A4: “GIÁ RẺ QUÁ!!” 4 mẫu/tờ (2 × 2); mẫu trả chậm 6 mẫu/tờ (3 × 2); mẫu dịch vụ dùng bảng dịch vụ lớn. Cảnh in Bảng tên xác nhận 6 thẻ/tờ (2 × 3). Chỉ các cấu hình có mặt rõ trong khung hình mới được ghi số lượng.
- Có một điểm cần giữ trạng thái **CHƯA XÁC MINH**: panel hướng dẫn bảo đặt lề “Không”, nhưng ảnh hộp thoại Print mở rộng ở mẫu Sticker hiển thị lựa chọn lề “Default”. Video chỉ xác nhận hộp thoại mở rộng ở mẫu Sticker đang hiển thị “Default”; không thấy rõ thao tác đổi lựa chọn này trước khi bấm In, nên không thể xác nhận lề đã dùng cho bản in cuối.
- Gói review có `report/MIENTAY2_VIDEO_EVENT_INDEX.csv`, liệt kê 87 mốc hình ảnh, khoảng khung và tỷ lệ thay đổi. `events.json`, ảnh mốc và contact sheet độ phân giải cao được giữ trong workspace phân tích; chúng không phải nhật ký con trỏ/phím bấm.
