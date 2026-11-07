# DAT-01 · Phiếu rà soát corpus LumiLab

Đối chiếu `knowledge/retrieval/documents.json` và đặc tả lab tại `main@6cdff4ce018582e6df1752183a2fc5036165cbdb`. Corpus `authored-nine-labs-draft-v1` có 36 mục do nhóm biên soạn, gồm 10 mục `reviewed` theo metadata hiện có và 26 mục `draft`. Phiếu này ghi điểm cần duyệt theo ID để người phụ trách xác nhận từng mục. Kết quả lint kiểm tra cấu trúc, nguồn và một số bất biến của mô hình.

Checkout `feature/dataset@2f4393a` có cùng mã revision corpus nhưng cả 36 mục đều là `draft`. Bảng bên dưới là phần chờ duyệt trên `main`. Trước khi áp dụng kết quả duyệt lên branch làm việc, đối chiếu các thay đổi duyệt đã có trên `main` theo ID, nội dung và metadata.

## 12 mục cần thêm nguồn độc lập

Các mục dưới đây có nhiều nhất một đơn vị xuất bản trong `references`. Tài liệu của cùng một đơn vị được tính là một nguồn độc lập. Trang SGK ghi bên dưới dựa trên đối chiếu trang in trong `knowledge/reviews/sgk-page-verification.md`. Cột cuối xác định phần nguồn có thể hỗ trợ hoặc phần cần tìm thêm.

| ID | Nguồn đang dẫn | Điểm cần duyệt |
| --- | --- | --- |
| `pendulum-overview` | NIST DLMF §22.19 và §19.8 | SGK Vật lí 11 KNTT, Bài 5, tr. 22–23 hỗ trợ miền góc nhỏ. Kiểm riêng tính chu kỳ phi tuyến và trạng thái đứng yên ở 0° theo đặc tả lab. [SGK tr. 22–23](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=23) |
| `chemistry-overview` | OpenStax Chemistry 2e §14.7, ví dụ 14.21 | SGK Hóa học 11 CTST, Bài 2, tr. 15–18 hỗ trợ pH, chỉ thị và nguyên tắc chuẩn độ. Kiểm riêng điều kiện 25°C, nồng độ, chiều thêm chất của ví dụ lab và sự khác nhau giữa điểm tương đương với điểm kết thúc. [SGK tr. 15–16](https://taphuan.nxbgd.vn/tap-huan/doc-sach/shs-hoa-hoc-11.4537016533#page=17) · [SGK tr. 17–18](https://taphuan.nxbgd.vn/tap-huan/doc-sach/shs-hoa-hoc-11.4537016533#page=19) · [OpenStax §14.7](https://openstax.org/books/chemistry-2e/pages/14-7-acid-base-titrations) |
| `circuit-overview` | OpenStax University Physics Vol. 2 §10.2 và §10.4 | Cần nguồn độc lập cho cách mắc đồng hồ. Quy tắc khóa số đo khi mắc sai là hành vi của lab, đối chiếu riêng với model. |
| `mechanics-overview` | OpenStax University Physics Vol. 1 §5.3 | Đối chiếu nguồn Newton II và điều kiện hợp lực bằng 0. Có thể bắt đầu từ dẫn chiếu SGK Vật lí 10 CTST đã lưu ở `ctst-net-force`, xác nhận trang in trước khi dùng. |
| `spring-overview` | OpenStax University Physics Vol. 1 §15.1 | Tìm nguồn độc lập cho quan hệ giữa chu kỳ, khối lượng và độ cứng. Tách giả thiết bảo toàn cơ năng của lò xo lý tưởng khỏi bài có cản. |
| `electrochemistry-overview` | OpenStax Chemistry 2e §17.3 | Cần nguồn độc lập cho bảng thế khử chuẩn Zn/Cu/Ag. Đối chiếu quy ước điện áp phải trừ trái với đầu ra của lab. |
| `atomic-overview` | OpenStax Chemistry 2e §2.3 | Cần nguồn độc lập cho số proton, số khối và điện tích ion. Kiểm giới hạn minh họa lớp electron. |
| `parallel-circuit-overview` | OpenStax University Physics Vol. 2 §10.2 | SGK KHTN 9 KNTT, Bài 12, tr. 61–63 là ứng viên cho quy tắc dòng điện và hiệu điện thế. Kiểm điều kiện nguồn giữ nguyên khi đổi kiểu mắc. [SGK tr. 61](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-khoa-hoc-tu-nhien-9.4700446949#page=61) · [SGK tr. 62–63](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-khoa-hoc-tu-nhien-9.4700446949#page=63) · [OpenStax §10.2](https://openstax.org/books/university-physics-volume-2/pages/10-2-resistors-in-series-and-parallel) |
| `capacitor-overview` | OpenStax University Physics Vol. 2 §10.5 và §8.3 | SGK Vật lí 11 KNTT, Bài 21, tr. 84–85 hỗ trợ điện dung, nạp và phóng. Cần thêm nguồn độc lập cho hàm mũ theo thời gian và các mốc 63,2%/36,8%. [SGK tr. 84–85](https://taphuan.nxbgd.vn/tap-huan/doc-sach/sgk-vat-li-11.4701093133#page=85) |
| `precipitation-overview` | OpenStax Chemistry 2e §4.2 và §4.4 | SGK KHTN 8 CTST, Bài 13, tr. 61–62 hỗ trợ hiện tượng AgCl trắng. Kiểm riêng khối lượng mol, nồng độ cố định và giả thiết phản ứng hoàn toàn theo mô hình. [SGK tr. 61–62](https://taphuan.nxbgd.vn/tap-huan/doc-sach/shs-khoa-hoc-tu-nhien-8.4539229607#page=63) |
| `gas-reaction-overview` | OpenStax Chemistry 2e §4.2, §4.4 và §9.2 | SGK KHTN 8 CTST tr. 61 dùng Na₂CO₃. Cần dẫn nguồn đúng cặp HCl/NaHCO₃ và ghi điều kiện 25°C, 1 atm của phép tính thể tích. [SGK tr. 61–62](https://taphuan.nxbgd.vn/tap-huan/doc-sach/shs-khoa-hoc-tu-nhien-8.4539229607#page=63) |
| `circuit-thcs-foundation` | OpenStax University Physics Vol. 2 §10.2 và §10.4 | Đối chiếu nguồn THCS cho định luật Ohm ở nhiệt độ không đổi và cách mắc ampe kế. Tìm đúng bài định luật Ohm, tách khỏi bài mắc song song. |

## 14 mục có từ hai đơn vị dẫn chiếu, chờ duyệt nội dung

| ID | Điểm cần duyệt |
| --- | --- |
| `mechanics-thcs-foundation` | Nội dung ròng rọc đang gắn `mechanics`. Xác nhận giữ vai trò học liệu mở rộng hay chuyển sang `pulley`; kiểm điều kiện dây lý tưởng và nâng đều. |
| `precipitation-thcs-foundation` | OpenStax và RSC. Kiểm cách diễn đạt ion, kết tủa trắng và phạm vi suy luận từ màu minh họa. |
| `gas-reaction-thcs-foundation` | OpenStax và RSC. Kiểm dẫn chiếu RSC cho nhận biết CO₂ và phân biệt bọt khí với phép xác định loại khí. |
| `ctst-net-force` | Xác nhận trang in Vật lí 10 CTST, bài Newton II. Kiểm quy ước chiều dương và bộ tham số của bài tập tự soạn 3 kg, 6 N. |
| `ctst-pulley-context` | Dẫn chiếu Vật lí 10 CTST và OpenStax. Giữ giới hạn đã nêu trong thẻ: hệ xe và vật treo là phần mở rộng lý thuyết; lab Newton nhận lực đầu vào độc lập. |
| `ctst-parallel-branches` | Xác nhận trang in KHTN 9 CTST. Ca 8 V, hai điện trở 40 Ω nằm trong miền lab; khi thử dùng `parallel` và đóng công tắc. |
| `ctst-silver-chloride` | KHTN 8 CTST tr. 61 có đúng cặp AgNO₃ và NaCl. Kiểm điều kiện bài tập chất giới hạn và phạm vi minh họa AgCl. |
| `ctst-carbonate-gas` | KHTN 8 CTST tr. 61 hỗ trợ hiện tượng. Thẻ đã phân biệt Na₂CO₃ trong SGK với NaHCO₃ trong lab. Đối chiếu thêm nguồn cho phương trình cụ thể và phép tính lượng khí. |
| `spring-damped-overview` | Kiểm OpenStax §15.5 và SGK Vật lí 11 KNTT. Miền ζ từ 0 đến 0,9 thuộc đặc tả lab; ghi chu kỳ trong điều kiện vật còn dao động. |
| `inclined-plane-overview` | Kiểm OpenStax §6.2 và SGK Vật lí 10 KNTT về ma sát. Giữ hệ số 0,8 và ngưỡng trượt theo đúng đặc tả, kiểm ca sát ngưỡng. |
| `pulley-overview` | SGK Vật lí 10 KNTT tr. 70–71 hỗ trợ lực căng. Đối chiếu OpenStax Physics §9.3 cho lợi về lực, đồng thời kiểm đúng số nhánh đỡ và điều kiện nâng đều. |
| `alkali-water-overview` | Model lưu trữ. Duyệt riêng phản ứng với nước và màu nhận biết ion theo OpenStax và SGK Hóa học 12 KNTT, giữ phạm vi mô phỏng định tính. |
| `copper-nitric-overview` | Model lưu trữ. Xác nhận nguồn nào hỗ trợ từng kịch bản Cu với HNO₃ và quá trình NO chuyển thành NO₂. |
| `chlorine-bleach-overview` | Model lưu trữ. Xác nhận phạm vi bán phản ứng, cân bằng clo trong nước và giả thiết của đối chứng giấy màu khô/ẩm. |

## Nghiệm thu và bàn giao

- `python -m lumilab_api.data_cli lint --include-drafts` thoát 0 với 12 cảnh báo nguồn độc lập. `python -m lumilab_api.data_cli lint` thoát 1, ghi 26 mục cần duyệt và 12 cảnh báo nguồn. `python -m lumilab_api.data_cli build --output /tmp/dat-01/index.json` thoát 0, tạo chỉ mục 10 đoạn từ các mục đã duyệt.
- Đạt chuyển bảng theo ID cho người duyệt Vật lí/Hóa học. Với mỗi mục, ghi kết luận, nguồn và trang hoặc section thực sự hỗ trợ, điều kiện áp dụng, kết quả đối chiếu model, tên người duyệt và ngày. Chuyển các đề nghị đổi ID lab hoặc nguồn cho người phụ trách corpus và pipeline. Các lần rà soát kỹ thuật này giữ trạng thái học thuật hiện có.
- Registry `mvp-draft-2026-11-05` cấp quyền `send_llm` cho nội dung nhóm tự biên soạn. Hai mục OpenStax trong registry còn `pending`, và SGK ở bảng trên dùng để đối chiếu. Quyết định học thuật và quyền đưa văn bản vào index hoặc gửi nhà cung cấp là hai bước duyệt riêng.

## TUT-01 · Biên bản kiểm tra offline

Chạy từ root repo với API đã cài. Thay `<SHA>` bằng commit đang kiểm tra.

```text
python scripts/tut01_offline.py --baseline-sha <SHA> --output knowledge/evaluation/results/tut-01-offline.json
```

Kết quả tại `6cdff4c` lưu trong `knowledge/evaluation/results/tut-01-offline.json`. Cả hai chế độ đều đạt 66/66 ca về mã fallback, phạm vi pilot, nguồn và ID trích dẫn. Trong 17 ca pilot, corpus có bản nháp tìm được nguồn cho 15 ca. Corpus chỉ gồm mục đã duyệt tìm được nguồn cho 12 ca. 49 ca còn lại trả `MVP_SCOPE_ONLY` ở cả hai chế độ.

| Pilot thiếu nguồn với corpus đã duyệt | Kết quả khi cho phép bản nháp |
| --- | --- |
| `VL-CONLAC-01-T-3` | Vẫn `NO_RELEVANT_SOURCE` cho câu hỏi nhập chiều dài 0 m. Đối chiếu miền chiều dài trong `pendulum/lab.json` và phần học liệu mô tả giá trị đầu vào. |
| `VL-DIEN-01-T-2` | Vẫn `NO_RELEVANT_SOURCE` cho câu hỏi xử lý cảnh báo mắc đồng hồ. Kiểm từ khóa và học liệu hướng dẫn trình tự sửa lỗi. |
| `VL-DIEN-01-T-1`, `VL-DIEN-01-T-3`, `VL-DIEN-01-T-5` | Có kết quả truy xuất cho cách mắc ampe kế và phân biệt ô trống với 0 A. Đọc các đoạn trả về và chuyển phần phù hợp vào vòng duyệt DAT-01. |

Trên `feature/dataset@2f4393a`, bộ `nine-lab-learning-draft-01` đạt 54/54 kiểm tra ở mỗi chế độ. Trong 11 ca pilot, chế độ có bản nháp tìm được nguồn cho 9 ca. Chế độ chỉ mục đã duyệt có 0 đoạn nên 11 ca đều trả `NO_RELEVANT_SOURCE`. 43 ca còn lại trả `MVP_SCOPE_ONLY`. Hai kết quả đo trên hai bộ đầu vào, hash và revision của bản `main` được ghi trong biên bản JSON.

Lượt kiểm tra dùng index hash local, request schema và gateway thật, chạy trực tiếp qua Python. Chấm nội dung theo rubric, thử provider live và kiểm route HTTP với phiên PostgreSQL vẫn chờ. Khi có tuyến model được duyệt, hạn mức được xác nhận và nguồn phù hợp, nhóm Tutor chạy tập pilot, đối chiếu từng câu với rubric và ghi biên bản riêng.
