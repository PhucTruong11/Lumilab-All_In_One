# DAT-03 — Xác minh dẫn chiếu SGK

Đối chiếu ngày **08/11/2026** trên trình đọc của Nhà xuất bản Giáo dục Việt Nam. Phạm vi là 14 mục `type: textbook` trong dataset `eleven-lab-learning-draft-01` tại `main` commit `8f18b0415fabcf881ed27e563bfaf9dcfaa31f4a`. Đây là bản ghi đối chiếu trang in và nội dung dẫn chiếu. Duyệt học thuật và quyền sử dụng có trạng thái riêng. [Dataset đối chiếu](https://github.com/PhucTruong11/Lumilab-All_In_One/blob/8f18b04/knowledge/learning/nine-labs/learning-dataset.json)

Đã mở và đọc các trang liên quan của cả 14 mục. Có **10 mục khớp dẫn chiếu**, **3 mục cần thêm liên kết để mở đủ khoảng trang** và **1 mục chỉ hỗ trợ nguyên lý chung**. Số sau `#page=` là vị trí trên trình đọc và có thể khác số in. Bảng ghi cả hai khi cần.

## Ấn bản số đã đọc

Nhà xuất bản của cả năm sách là **Nhà xuất bản Giáo dục Việt Nam**. Mã trình đọc định danh bản số đã đối chiếu. Năm in và số lần tái bản chưa được xác nhận từ trang xuất bản trong lượt này.

| Mã sách dùng trong bảng | Sách | Lớp | Bộ sách | Mã trình đọc |
| --- | --- | ---: | --- | --- |
| VL11 | Vật lí 11 | 11 | Kết nối tri thức với cuộc sống | `sgk-vat-li-11.4701093133` |
| VL10 | Vật lí 10 | 10 | Kết nối tri thức với cuộc sống | `sgk-vat-li-10.4700746482` |
| KHTN9 | Khoa học tự nhiên 9 | 9 | Kết nối tri thức với cuộc sống | `sgk-khoa-hoc-tu-nhien-9.4700446949` |
| HH11 | Hóa học 11 | 11 | Chân trời sáng tạo | `shs-hoa-hoc-11.4537016533` |
| KHTN8 | Khoa học tự nhiên 8 | 8 | Chân trời sáng tạo | `shs-khoa-hoc-tu-nhien-8.4539229607` |

## Kết quả theo từng mục nguồn

Tiền tố của `source_id` là `practice_id` trong dataset. Nội dung trong bảng diễn giải phần sách hỗ trợ cho bài Lab.

| Source ID | Sách và trang in đã đọc | Kết quả và phạm vi hỗ trợ | Liên kết trình đọc |
| --- | --- | --- | --- |
| `VL-CONLAC-01-SRC-SGK-1` | VL11, Bài 1, tr. 6–7 | **Khớp.** Hình 1.1 ở tr. 6 minh họa con lắc đơn và con lắc lò xo. Tr. 7 trình bày đồ thị và phương trình dao động điều hòa. | [Trang 6–7, vị trí 7](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=7) |
| `VL-CONLAC-01-SRC-SGK-2` | VL11, Bài 5, tr. 22–23 | **Khớp.** Tr. 22 có thế năng và công thức chu kỳ (5.8). Tr. 23 tóm tắt chu kỳ con lắc đơn trong giới hạn góc nhỏ đến 10°. | [Trang 22–23, vị trí 23](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=23) |
| `VL-LOXO-01-SRC-SGK-1` | VL11, Bài 5, tr. 20–21 | **Khớp.** Tr. 21 có hệ thức chu kỳ con lắc lò xo theo khối lượng và độ cứng, công thức (5.5). | [Trang 20–21, vị trí 21](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=21) |
| `VL-LOXO-01-SRC-SGK-2` | VL11, Bài 6, tr. 24–25 | **Khớp.** Hỗ trợ hiện tượng biên độ giảm theo thời gian và cơ năng hao hụt. Phương trình lực cản nhớt của mô phỏng cần nguồn riêng. | [Trang 24–25, vị trí 25](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=25) |
| `VL-MATPHANGNGHIENG-01-SRC-SGK-1` | VL10, Bài 15, tr. 63 | **Khớp.** Công thức (15.1) liên hệ gia tốc với hợp lực và khối lượng. | [Trang 63, vị trí 63](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-10.4700746482#page=63) |
| `VL-MATPHANGNGHIENG-01-SRC-SGK-2` | VL10, Bài 18, tr. 72–73 | **Khớp.** Tr. 72 giới thiệu ma sát nghỉ. Tr. 73 phân biệt trạng thái bắt đầu trượt và ma sát trượt. | [Trang 72–73, vị trí 73](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-10.4700746482#page=73) |
| `VL-RONGROC-01-SRC-SGK-1` | VL10, Bài 17, tr. 69–71 | **Cần thêm liên kết.** Tr. 69 trình bày trọng lực. Tr. 70–71 hỗ trợ lực căng và Hình 17.8 minh họa dây qua ròng rọc. Quy tắc cho pa-lăng nhiều nhánh cần nguồn bổ sung. Liên kết hiện tại mở tr. 70–71, nên thêm vị trí 69 nếu giữ khoảng tr. 69–71. | [Trang 69, vị trí 69](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-10.4700746482#page=69) · [Trang 70–71, vị trí 71](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-10.4700746482#page=71) |
| `VL-DIEN-01-SRC-SGK-1` | VL11, Bài 23, tr. 96–97 | **Khớp.** Tr. 96 trình bày điện trở và đặc tuyến. Tr. 97 có hệ thức định luật Ohm (23.3). | [Trang 96–97, vị trí 97](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=97) |
| `VL-DIEN-01-SRC-SGK-2` | KHTN9, Bài 12, tr. 60–61 | **Khớp.** Có sơ đồ nối tiếp, điện trở tương đương và đặc điểm cường độ dòng điện. | [Trang 60–61, vị trí 61](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-khoa-hoc-tu-nhien-9.4700446949#page=61) |
| `VL-DIEN-01-SRC-SGK-3` | KHTN9, Bài 12, tr. 61–63 | **Cần thêm liên kết.** Tr. 61 bắt đầu mục mắc song song và có sơ đồ. Tr. 62–63 có công thức và đặc điểm dòng điện. Liên kết hiện tại mở tr. 62–63, nên thêm vị trí 61. | [Trang 61, vị trí 61](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-khoa-hoc-tu-nhien-9.4700446949#page=61) · [Trang 62–63, vị trí 63](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-khoa-hoc-tu-nhien-9.4700446949#page=63) |
| `VL-RC-01-SRC-SGK-1` | VL11, Bài 21, tr. 84–85 | **Khớp.** Hỗ trợ khái niệm nạp, phóng, điện dung và đơn vị. Dùng nguồn chuyên biệt về mạch RC cho hàm theo thời gian và hằng số thời gian. | [Trang 84–85, vị trí 85](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=85) |
| `HH-CHUANDO-01-SRC-SGK-1` | HH11, Bài 2, tr. 15–18 | **Cần thêm liên kết.** Tr. 15–16 trình bày pH và chỉ thị. Tr. 17–18 trình bày nguyên tắc và ví dụ chuẩn độ. Liên kết hiện tại mở tr. 17–18, nên thêm vị trí 17 cho pH và chỉ thị. Ví dụ SGK dùng HCl chuẩn để xác định nồng độ NaOH. Các thông số của mô phỏng lấy từ đặc tả Lab. | [Trang 15–16, vị trí 17](https://taphuan.nxbgd.vn/tap-huan/doc-sach/shs-hoa-hoc-11.4537016533#page=17) · [Trang 17–18, vị trí 19](https://taphuan.nxbgd.vn/tap-huan/doc-sach/shs-hoa-hoc-11.4537016533#page=19) |
| `HH-KETTUA-01-SRC-SGK-1` | KHTN8, Bài 13, tr. 61–62 | **Khớp.** Tr. 61 có ví dụ AgNO₃ và NaCl tạo AgCl. Tr. 62 cho thêm ngữ cảnh phản ứng giữa hai dung dịch muối tạo chất kết tủa. | [Trang 61–62, vị trí 63](https://taphuan.nxbgd.vn/tap-huan/doc-sach/shs-khoa-hoc-tu-nhien-8.4539229607#page=63) |
| `HH-TAOKHI-01-SRC-SGK-1` | KHTN8, Bài 13, tr. 61–62 | **Chỉ hỗ trợ nguyên lý.** Ví dụ trên tr. 61 dùng HCl với Na₂CO₃. Lab dùng HCl với NaHCO₃. Dùng SGK cho hiện tượng acid tác dụng với muối carbonate sinh CO₂. Phương trình của cặp chất trong Lab và cách tính thể tích khí cần dẫn nguồn riêng. | [Trang 61–62, vị trí 63](https://taphuan.nxbgd.vn/tap-huan/doc-sach/shs-khoa-hoc-tu-nhien-8.4539229607#page=63) |

## Bàn giao cập nhật

- Giữ nguyên `source_id` khi cập nhật. Với ba mục cần thêm liên kết, ưu tiên giữ liên kết hiện tại và thêm liên kết cho phần trang bị thiếu. Nếu trường dữ liệu chỉ nhận một URL, đưa vị trí bổ sung vào ghi chú nguồn cho tới khi có cấu trúc hỗ trợ.
- Ghi nguồn SGK bài tạo khí là đối chiếu nguyên lý. Hồ sơ Lab cần một nguồn riêng cho cặp chất HCl–NaHCO₃ và một căn cứ cho mô hình thể tích khí. [Cấu hình Lab tạo khí](https://github.com/PhucTruong11/Lumilab-All_In_One/blob/8f18b04/packages/lab-engine/labs/gas-reaction/lab.json)
- `HH-DIENHOA-01` và `HH-NGUYENTU-01` chưa có mục `type: textbook` trong bản dataset đối chiếu. Hai bài nằm ngoài 14 mục ở bảng và cần một lượt xác định nguồn nếu yêu cầu SGK áp dụng cho mọi bài.
- Duyệt quyền thuộc DAT-02. Chỉ sau khi quyền và phạm vi đã được xác nhận mới cập nhật registry hoặc nhập học liệu cho RAG. Hồ sơ này ghi liên kết và diễn giải ngắn.

