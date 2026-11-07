# LumiLab — Dataset cho 9 bài lab

**Cập nhật 07/11/2026 · Bản 0.4 · Trạng thái `draft` · Phụ trách biên soạn: Đạt**

Tài liệu này chốt danh mục **6 bài Vật lí và 3 bài Hóa học vô cơ** để biên soạn học liệu tiếng Việt, thiết kế dữ liệu mô phỏng và viết bộ câu hỏi đánh giá. Đây là phạm vi dataset dự kiến, chưa xác nhận các lab đã triển khai. Ba bài Hóa chỉ dùng trong mô phỏng ảo.

Các trang SGK dưới đây là **số trang in trên sách**. Mã bản điện tử nằm trong đường dẫn của Nhà xuất bản Giáo dục Việt Nam (NXBGDVN). Các SGK THPT được dẫn theo bộ *Kết nối tri thức với cuộc sống*; Khoa học tự nhiên 9 là nguồn bổ trợ THCS. Mục OpenStax dẫn thẳng đến phần dùng để đối chiếu. Các nguồn được ghi ở trạng thái `reference-only`; quyền đưa nội dung nguồn vào corpus là `pending`.

## Vật lí — 6 bài

### 1. Con lắc đơn — `VL-CONLAC-01`

- **Kiến thức:** Vị trí cân bằng, biên độ, chu kỳ và sự chuyển hóa giữa động năng và thế năng trọng trường. Với dây nhẹ không dãn, vật coi như chất điểm, bỏ qua cản và góc lệch nhỏ: `T ≈ 2π√(L/g)`. Lấy mốc thế năng ở vị trí thấp nhất: `U = mgL(1 − cos θ)`.
- **Mô phỏng và ca kiểm:** Thay chiều dài `L` (m) và góc thả (°); quan sát chu kỳ (s) và năng lượng (J). Trong miền góc nhỏ, khi tăng `L` gấp 4 ở cùng `g`, chu kỳ dự kiến tăng gấp 2. Chốt giới hạn góc và sai số trước khi duyệt fixture.
- **SGK:** Vật lí 11, [Bài 1, tr. 6–7, Hình 1.1](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=7); [Bài 5, tr. 22–23, năng lượng và công thức chu kỳ (5.8)](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=23).
- **OpenStax:** *University Physics Volume 1*, [§15.4 Pendulums](https://openstax.org/books/university-physics-volume-1/pages/15-4-pendulums), điều kiện góc nhỏ và chu kỳ.

### 2. Con lắc lò xo — `VL-LOXO-01`

- **Kiến thức:** Lực đàn hồi trong miền tuyến tính, độ cứng `k` (N/m), khối lượng `m` (kg) và sự chuyển hóa năng lượng. Với lò xo lý tưởng, không tắt dần: `T = 2π√(m/k)`. Với lực cản tỉ lệ vận tốc, biên độ giảm theo thời gian trong miền còn dao động; cơ năng không bảo toàn.
- **Mô phỏng và ca kiểm:** Thay `m`, `k` và hệ số cản; quan sát li độ (m) và biên độ theo thời gian (s). Khi tắt cản, tăng `m` gấp 4 ở cùng `k` thì chu kỳ tăng gấp 2. Với cản dương trong miền còn dao động, các đỉnh biên độ liên tiếp phải giảm.
- **SGK:** Vật lí 11, [Bài 5, tr. 20–21, công thức chu kỳ (5.5)](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=21); [Bài 6, tr. 24–25, hiện tượng tắt dần](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=25).
- **OpenStax:** *University Physics Volume 1*, [§15.1 Simple Harmonic Motion](https://openstax.org/books/university-physics-volume-1/pages/15-1-simple-harmonic-motion) và [§15.5 Damped Oscillations](https://openstax.org/books/university-physics-volume-1/pages/15-5-damped-oscillations). Lấy mô hình cản tuyến tính từ §15.5.

### 3. Định luật II Newton và mặt phẳng nghiêng — `VL-MATPHANGNGHIENG-01`

- **Kiến thức:** Vẽ sơ đồ lực, áp dụng `ΣF = ma`, chiếu trọng lực theo phương dọc và vuông góc mặt nghiêng. Ma sát nghỉ thay đổi đến ngưỡng `μₛN`; khi vật trượt, ma sát trượt chống lại chuyển động tương đối.
- **Mô phỏng và ca kiểm:** Thay góc nghiêng, khối lượng (kg) và hệ số ma sát; quan sát lực (N), trạng thái đứng yên/trượt và gia tốc (m/s²). Với một vật trên mặt nghiêng cố định, không ma sát, không có lực kéo, gia tốc dọc dốc là `g sin α` hướng xuống dốc.
- **SGK:** Vật lí 10, [Bài 15, tr. 63, định luật II Newton](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-10.4700746482#page=63); [Bài 18, tr. 72–73, ma sát nghỉ và ma sát trượt](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-10.4700746482#page=73).
- **OpenStax:** *University Physics Volume 1*, [§5.3 Newton’s Second Law](https://openstax.org/books/university-physics-volume-1/pages/5-3-newtons-second-law), [§5.6 Common Forces](https://openstax.org/books/university-physics-volume-1/pages/5-6-common-forces) và [§6.2 Friction](https://openstax.org/books/university-physics-volume-1/pages/6-2-friction), dùng để đối chiếu sơ đồ lực trên dốc.

### 4. Hệ ròng rọc và pa-lăng — `VL-RONGROC-01`

- **Kiến thức:** Lực căng dây, cân bằng lực và lợi về lực. Với dây nhẹ, ròng rọc lý tưởng, tải đứng yên hoặc đi đều và `n` nhánh dây thẳng đứng đỡ cụm tải, lực kéo là `F = W/n`. Để nâng tải một đoạn `h`, phải kéo dây đoạn `nh`. Tính `W` theo trọng lượng toàn bộ cụm được nâng; có thể bỏ qua khối lượng ròng rọc động nếu mô hình nêu rõ giả thiết đó.
- **Mô phỏng và ca kiểm:** So sánh ròng rọc cố định và pa-lăng lý tưởng; đọc lực kéo (N), chiều dài dây kéo và độ cao nâng (m). Một ròng rọc cố định đơn lẻ đổi hướng kéo nhưng không lợi về lực. Hai nhánh đỡ thẳng đứng cho `F = W/2`.
- **SGK:** Vật lí 10, [Bài 17, tr. 69–71, lực căng dây; Hình 17.8 tr. 71](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-10.4700746482#page=71). Dùng làm nền về lực căng và ròng rọc cố định.
- **OpenStax:** *Physics*, [§9.3 Simple Machines, Hình 9.11](https://openstax.org/books/physics/pages/9-3-simple-machines), nguồn cho phần mở rộng pa-lăng và lợi về lực.

### 5. Định luật Ohm: mạch nối tiếp và song song — `VL-DIEN-01`

- **Kiến thức:** Với điện trở thuần không đổi, `U = IR`. Nối tiếp: dòng điện qua các điện trở bằng nhau, `R_tđ = R₁ + R₂`. Song song: điện áp hai đầu các nhánh bằng nhau, `1/R_tđ = 1/R₁ + 1/R₂`, dòng mạch chính bằng tổng dòng nhánh.
- **Mô phỏng và ca kiểm:** Đổi cách mắc hai điện trở dương và điện áp nguồn một chiều lý tưởng; đọc V, A, Ω. Hai điện trở bằng nhau, mỗi chiếc `R`, có `R_tđ = 2R` khi nối tiếp và `R_tđ = R/2` khi song song.
- **SGK:** Vật lí 11, [Bài 23, tr. 96–97, định luật Ohm](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=97). Khoa học tự nhiên 9, Bài 12, [nối tiếp, tr. 60–61](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-khoa-hoc-tu-nhien-9.4700446949#page=61) và [song song, tr. 61–63](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-khoa-hoc-tu-nhien-9.4700446949#page=63).
- **OpenStax:** *University Physics Volume 2*, [§9.4 Ohm’s Law](https://openstax.org/books/university-physics-volume-2/pages/9-4-ohms-law) và [§10.2 Resistors in Series and Parallel](https://openstax.org/books/university-physics-volume-2/pages/10-2-resistors-in-series-and-parallel).

### 6. Quá trình nạp và xả tụ điện (mạch RC) — `VL-RC-01`

- **Kiến thức:** Điện dung `C = Q/U`, điện áp trên tụ thay đổi theo thời gian, hằng số thời gian `τ = RC` (s). Hai ca chuẩn: tụ ban đầu chưa tích điện nạp qua một điện trở với nguồn một chiều không đổi; tụ có điện áp ban đầu khác 0 xả qua một điện trở khi đã tách nguồn. Giả thiết linh kiện lý tưởng, `R > 0`, `C > 0`.
- **Mô phỏng và ca kiểm:** Thay `R` (Ω), `C` (F), quan sát đồ thị điện áp (V) theo thời gian. Sau một `τ`, ca nạp đạt khoảng 63,2% điện áp nguồn, ca xả còn khoảng 36,8% điện áp ban đầu. Ghi điều kiện ban đầu riêng cho từng ca.
- **SGK:** Vật lí 11, [Bài 21, tr. 84–85, điện dung, điện tích và đơn vị](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=85), dùng làm nền về tụ điện.
- **OpenStax:** *University Physics Volume 2*, [§8.1 Capacitors and Capacitance](https://openstax.org/books/university-physics-volume-2/pages/8-1-capacitors-and-capacitance) và [§10.5 RC Circuits](https://openstax.org/books/university-physics-volume-2/pages/10-5-rc-circuits). Quy luật nạp/xả là phần mở rộng đối chiếu theo §10.5.

## Hóa học vô cơ — 3 bài

### 1. Kim loại kiềm tác dụng với nước và màu ngọn lửa — `HH-KIEM-01`

- **Kiến thức:** Na và K phản ứng với nước tạo hydroxide và hydrogen: `2M + 2H₂O → 2MOH + H₂`, với `M` là Na hoặc K. Màu nhận biết của ion trong phép thử ngọn lửa là một quan sát riêng: Na⁺ cho màu vàng, K⁺ cho màu tím nhạt.
- **Mô phỏng và ca kiểm:** Tách chế độ quan sát phản ứng với nước (bọt khí, môi trường kiềm, mức độ phản ứng theo mô hình định tính) và chế độ nhận diện màu ngọn lửa của ion. Câu đánh giá cần phân biệt màu nhận biết ion với hiện tượng có thể thấy trong phản ứng kim loại–nước.
- **SGK:** Hóa học 12, Bài 24 *Nguyên tố nhóm IA*, [tr. 110–111, Bảng 24.3, kim loại kiềm tác dụng với nước](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-hoa-hoc-12.4701708102#page=111); [tr. 112, Hình 24.3, màu ngọn lửa của ion](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-hoa-hoc-12.4701708102#page=113).
- **OpenStax:** *Chemistry 2e*, [§18.1 Periodicity](https://openstax.org/books/chemistry-2e/pages/18-1-periodicity), đối chiếu phản ứng của kim loại nhóm 1 với nước. Dùng Hình 24.3 của SGK cho màu của từng ion.

### 2. Kim loại tác dụng với axit nitric: NO và NO₂ — `HH-HNO3-01`

- **Kiến thức:** HNO₃ là chất oxi hóa mạnh. Giới hạn mô phỏng ở hai trường hợp đại diện của đồng: axit loãng cho NO là sản phẩm khí chính trong mô hình; axit đặc cho NO₂ là sản phẩm khí chính. NO ban đầu không màu và có thể bị oxi hóa thành NO₂ màu nâu đỏ khi gặp oxygen trong không khí. Sản phẩm thực tế phụ thuộc vào kim loại và điều kiện; không suy rộng hai ca đồng cho mọi kim loại.
- **Mô phỏng và ca kiểm:** Hai kịch bản định tính có sẵn. Ca NO phân biệt màu khí lúc mới sinh với màu có thể thấy sau khi tiếp xúc không khí. Câu đánh giá yêu cầu giải thích vì sao có thể thấy khí nâu đỏ dù sản phẩm khí ban đầu trong mô hình là NO.
- **SGK:** Hóa học 11, [Bài 6, tr. 40, tính oxi hóa của nitric acid](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-hoa-hoc-11.4701111834#page=41), dùng làm nền về HNO₃.
- **OpenStax:** *Chemistry 2e*, [§18.9 Occurrence, Preparation, and Compounds of Oxygen](https://openstax.org/books/chemistry-2e/pages/18-9-occurrence-preparation-and-compounds-of-oxygen), nguồn cho hai ca đại diện của Cu. Đối chiếu tính chất khí với NIOSH: [NO](https://www.cdc.gov/niosh/npg/npgd0448.html) và [NO₂](https://www.cdc.gov/niosh/npg/npgd0454.html).

### 3. Điều chế và tính tẩy màu của khí clo — `HH-CHLORINE-01`

- **Kiến thức:** Phần điều chế minh họa nguyên lí oxi hóa ion chloride thành Cl₂ ở mức phương trình. Trong môi trường có nước, cân bằng `Cl₂ + H₂O ⇌ HCl + HOCl` viết theo cách biểu diễn phân tử trong SGK. HOCl có tính oxi hóa, làm mất màu chất màu trong thí nghiệm minh họa.
- **Mô phỏng và ca kiểm:** So sánh giấy màu ẩm với đối chứng giấy màu khô trong điều kiện khô của mô hình. Kết quả cần thể hiện giấy ẩm mất màu rõ hơn và giải thích vai trò của nước; giới hạn kết luận trong ca đối chứng đã mô tả.
- **SGK:** Hóa học 10, Bài 21 *Nhóm halogen*, [tr. 109, Hình 21.6, giấy màu khô và ẩm](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-hoa-hoc-10.4700854983#page=109); [tr. 111, mục Điều chế chlorine](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-hoa-hoc-10.4700854983#page=111).
- **OpenStax:** *Chemistry 2e*, [§18.11 Occurrence, Preparation, and Properties of Halogens](https://openstax.org/books/chemistry-2e/pages/18-11-occurrence-preparation-and-properties-of-halogens), đối chiếu HOCl và tính tẩy màu. Tham chiếu an toàn: [NIOSH — Chlorine](https://www.cdc.gov/niosh/npg/npgd0115.html).

## Trạng thái và bàn giao dataset

- **Đã lập hồ sơ:** Cả 9 bài có mã, kiến thức, giả thiết hoặc điều kiện quan sát, ca kiểm dự kiến, trang SGK và mục OpenStax. Có bản nháp cho con lắc đơn: [học liệu](../knowledge/pendulum.draft.json) và [câu hỏi mẫu](../tests/pendulum-dataset.sample.json). Các ca kiểm trong sổ là tiêu chí để biên soạn, chưa phải kết quả kiểm thử.
- **Đạt biên soạn:** Viết nội dung tiếng Việt cho từng mã, ghi phiên bản, nguồn và vị trí, phạm vi áp dụng, dữ liệu hoặc hiện tượng dự kiến. Mỗi bài có câu dự đoán, câu đọc kết quả, câu giải thích, đáp án và rubric. Trong ba bài Hóa, giữ phần hiển thị ở mức kịch bản ảo, phương trình và hiện tượng; không đưa quy trình thực hành tạo khí hoặc thử phản ứng ngoài mô phỏng.
- **Quyền sử dụng:** Tra cứu nguồn qua các liên kết. Ghi căn cứ sử dụng riêng cho từng nguồn và loại nội dung trước khi đưa vào kho dùng chung. [Cổng NXBGDVN](https://taphuan.nxbgd.vn/tap-huan?grade=11) nêu phạm vi sử dụng cho dạy và học; rà soát điều khoản của từng sách OpenStax cho mục đích nhập liệu. Khi chưa rõ quyền, chỉ giữ dẫn chiếu; không nhập bản chụp, hình hoặc trích đoạn sách vào corpus.
- **Review và tích hợp:** Nam rà công thức, đơn vị, điều kiện, phương trình và ca chuẩn; ghi người duyệt, ngày và bản sửa. Đạt ghi rõ nội dung có căn cứ SGK và nội dung mở rộng. Khoa chỉ lập chỉ mục RAG cho nội dung đã được duyệt và có căn cứ sử dụng. Đ.Phúc dùng câu hỏi và rubric để kiểm tra AI Tutor. Kết quả thí nghiệm lấy từ bộ mô phỏng và bộ kiểm tra khoa học.