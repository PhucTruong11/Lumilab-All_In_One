# DAT-01 · Hồ sơ 36 thẻ học liệu

Đạt phụ trách bàn giao corpus `authored-labs-draft-v3` trên nhánh `feature/dataset`. Hồ sơ bao phủ 36 thẻ, gồm 26 thẻ nháp đã biên tập, 5 thẻ đã duyệt cần bản thay thế và 5 thẻ đã duyệt tiếp tục dùng bản hiện hành. Từng thẻ lưu văn bản, dẫn chiếu, giả thiết và phạm vi mô hình trong [corpus](../retrieval/documents.json) hoặc [bản đề nghị duyệt lại](dat-01-reapproval-candidates.json). Các nguồn ngoài được dùng để đối chiếu. Xem [đối chiếu trang SGK](sgk-page-verification.md) và [phiếu DAT-01 ban đầu](dat-01-corpus-review.md).

## 26 thẻ đã cập nhật trong corpus

| ID | Nội dung đã biên tập và căn cứ đối chiếu |
| --- | --- |
| `pendulum-overview` | NIST DLMF §22.19 và The Physics Classroom. Nêu công thức góc nhỏ, mô hình góc lớn, trạng thái đứng yên ở 0° và cách sửa chiều dài ngoài miền 0,3–2 m. Đối chiếu cấu hình và `server-readings.json` mục /0–/1. |
| `chemistry-overview` | OpenStax Chemistry 2e §14.7, ví dụ 14.21 và Hóa học 11 CTST tr. 15–18. Phân biệt điểm tương đương và đổi màu. Đối chiếu mốc 25 mL, pH 7, phần màu bằng 0 và miền nhập 0–50 mL. |
| `circuit-overview` | OpenStax University Physics Vol. 2 §10.4 và KHTN 8 CTST tr. 109–110. Giải thích dòng mạch kín, cách mắc đồng hồ và khác biệt giữa mạch hở 0 A với ô trống do mắc sai. |
| `mechanics-overview` | OpenStax University Physics Vol. 1 §5.3 và Vật lí 10 KNTT tr. 63. Hợp lực có dấu và gia tốc cùng chiều; ở hợp lực bằng 0, vật giữ vận tốc ban đầu. |
| `spring-overview` | OpenStax University Physics Vol. 1 §15.1 và Vật lí 11 KNTT tr. 20–21. Ghi công thức, đơn vị, ảnh hưởng riêng của m và k, bảo toàn cơ năng và ca đứng yên. |
| `electrochemistry-overview` | OpenStax Chemistry 2e §17.3 và bảng thế khử của University of Texas at Austin. Làm rõ quy ước dấu của vôn kế, điện cực giống nhau và số đọc bị khóa khi bỏ cầu muối. |
| `atomic-overview` | OpenStax Chemistry 2e §2.3 và IUPAC Mass number. Phân biệt số khối và điện tích, ghi giới hạn số hạt và ý nghĩa hình lớp electron. |
| `parallel-circuit-overview` | OpenStax University Physics Vol. 2 §10.2 và KHTN 9 KNTT tr. 60–63. So hai kiểu mắc ở cùng nguồn dương, cùng hai điện trở và mạch kín. Đối chiếu ba ca đầu trong `additional-labs.json`. |
| `capacitor-overview` | OpenStax University Physics Vol. 2 §10.5 và All About Circuits. Đổi µF sang F, tính τ và đối chiếu mốc 63,2%/36,8% tại t = τ. Ghi điều kiện khởi tạo hai chế độ. |
| `precipitation-overview` | OpenStax Chemistry 2e §4.2/§4.4 và KHTN 8 CTST tr. 61–62. Viết cách đổi mL sang L, xét chất giới hạn và tính khối lượng AgCl. Đối chiếu ca có đủ hai dung dịch và ca một thể tích bằng 0. |
| `gas-reaction-overview` | OpenStax Chemistry 2e §4.2/§4.4/§9.2 và UW–Madison The Visible Mole. Ghi tỉ lượng, chất giới hạn và thể tích mol CO₂ khí khô lý tưởng ở 298,15 K và 1 atm. |
| `mechanics-thcs-foundation` | TeachEngineering Powerful Pulleys và UW–Madison Pulleys. Giữ ID, chuyển phạm vi truy xuất sang `pulley`. So sánh lực, quãng đường và công ở ca một nhánh và hai nhánh. |
| `circuit-thcs-foundation` | KHTN 9 CTST tr. 41–42 và OpenStax Physics §19.1 hỗ trợ Ohm. KHTN 8 CTST tr. 109–110 hỗ trợ số đo. Ghi cách giữ nguồn và mạch kín khi thay điện trở chính. |
| `precipitation-thcs-foundation` | OpenStax Chemistry 2e §4.2 và RSC Tests for anions. Bổ sung phương trình ion rút gọn và cách quan sát trên lab. Màu trắng trên màn hình là hiện tượng mô phỏng. |
| `gas-reaction-thcs-foundation` | OpenStax Chemistry 2e §4.2, UW–Madison The Visible Mole và RSC Tests for anions. Cặp hóa chất của lab và phép nhận biết CO₂ bằng nước vôi được ghi ở hai phạm vi riêng. |
| `ctst-net-force` | Vật lí 10 CTST tr. 58–61 và OpenStax Physics §4.3. Giữ ví dụ 6 N, 3 kg và chỉ rõ giá trị nhập là hợp lực. Backend cho 2 m/s². |
| `ctst-pulley-context` | Vật lí 10 CTST tr. 58–61 và OpenStax Physics §4.3. Hệ xe–vật treo là bài mở rộng; công thức suy từ phương trình của hai vật. Màn Newton chỉ nhập hợp lực đã biết. |
| `ctst-parallel-branches` | KHTN 9 CTST tr. 47–49 và OpenStax College Physics 2e §21.1. Dùng chế độ song song và công tắc đóng để kiểm ví dụ 8 V, 40 Ω mỗi nhánh. |
| `ctst-silver-chloride` | KHTN 8 CTST tr. 61–62 và OpenStax Chemistry 2e §4.2. Ghi giữ lượng AgNO₃ cố định khi tăng NaCl đã dư. Kết luận thuộc giả thiết phản ứng hoàn toàn. |
| `ctst-carbonate-gas` | KHTN 8 CTST tr. 61–62 hỗ trợ nguyên lý. UW–Madison hỗ trợ đúng cặp HCl–NaHCO₃. Ghi điều kiện khí khô lý tưởng khi dùng PV = nRT. |
| `spring-damped-overview` | OpenStax University Physics Vol. 1 §15.5 và Vật lí 11 KNTT tr. 24–25. Tách ca đứng yên, không cản và còn dao động có cản. Đối chiếu `curriculum-labs.json` /0–/3. |
| `inclined-plane-overview` | OpenStax University Physics Vol. 1 §6.2 và Vật lí 10 KNTT tr. 72–73. Ghi điều kiện nghỉ, trượt và μₖ = 0,8 μₛ riêng của mô hình. Đối chiếu `curriculum-labs.json` /4–/7. |
| `pulley-overview` | OpenStax Physics §9.3, hình 9.11 và Vật lí 10 KNTT tr. 71 về lực căng. Ghi khối lượng cả cụm nâng, nhánh đỡ thẳng đứng và công nâng đều. |
| `alkali-water-overview` | OpenStax Chemistry 2e §18.1 cho phản ứng nhóm 1, RSC Flame colours cho Na⁺ vàng và K⁺ tím nhạt. Tách hai chế độ và đối chiếu `curriculum-labs.json` /11–/14. |
| `copper-nitric-overview` | OpenStax Chemistry 2e §18.7 và hình 18.36, đối chiếu với Purdue University cho cả hai kịch bản. Ghi phương trình cân bằng và vai trò oxygen. Đối chiếu `curriculum-labs.json` /16–/18. |
| `chlorine-bleach-overview` | OpenStax Chemistry 2e §18.11 về HOCl và RSC Reactions of chlorine with water or halide ions về giấy ẩm. Giấy khô là ca đối chứng riêng của lab. Đối chiếu `curriculum-labs.json` /19–/21. |

## 5 bản đề nghị thay thẻ đã duyệt

[Bản đề nghị duyệt lại](dat-01-reapproval-candidates.json) chứa đầy đủ năm bản ghi thay thế, với cùng ID và nhãn draft. File này nằm ngoài đường dẫn đọc corpus của ứng dụng. Người duyệt có thể so từng ID với bản hiện hành và xác nhận đúng văn bản dự kiến áp dụng.

| ID | Nội dung thay thế |
| --- | --- |
| `pendulum-thcs-foundation` | Thay PDF thiếu thông tin ấn bản bằng Vật lí 11 KNTT, Bài 5, tr. 22–23. Làm rõ điều kiện giữ nguyên L, g và góc thả. |
| `chemistry-thcs-foundation` | Thay danh mục thực hành RSC bằng Hóa học 11 CTST, Bài 2, tr. 17–18. Ghi so số mol và trường hợp hai nồng độ khác nhau. |
| `ctst-meter-wiring` | Dẫn OpenStax University Physics Vol. 2 §10.4 cho cách mắc hai dụng cụ và thêm cách xử lý số đọc trong lab. |
| `ctst-source-voltage` | Viết lại thẻ về nguồn thật khi phát điện. Bàn mạch dùng nguồn lý tưởng, vôn kế đo R chính. Phép suy r cần số đo hai cực của nguồn thật. |
| `ctst-ph-indicator` | Giữ OpenStax §14.2 cho pH, thêm §14.7 cho phenolphthalein. Ghi khoảng chuyển màu riêng của lab. |

## 5 thẻ đã duyệt tiếp tục dùng

| ID | Nội dung đối chiếu |
| --- | --- |
| `ctst-period-measure` | SGV Vật lí 11 CTST tr. 16–17 và NIST DLMF §22.19. Đếm số chu kỳ đầy đủ qua cùng mốc, cùng chiều, rồi chia tổng thời gian. |
| `ctst-pendulum-limits` | SGV Vật lí 11 CTST tr. 14–17, 20–21 và NIST DLMF §22.19. Giữ g và góc thả khi so chiều dài. Công thức góc nhỏ và miền mô phỏng có điều kiện riêng. |
| `ctst-ohm-graph` | KHTN 9 CTST tr. 41–42 và OpenStax Physics §19.1. Trục đứng I, trục ngang U thì độ dốc là 1/R. Ca 8 V, 40 Ω cho 0,2 A khi chỉ có tải chính và mạch kín. |
| `ctst-neutralization` | KHTN 8 CTST tr. 49 và OpenStax Chemistry 2e §4.2. Phân biệt điều kiện số mol phản ứng bằng nhau với điều kiện thể tích bằng nhau. |
| `ctst-titration-direction` | Hóa học 11 CTST tr. 15–18 và OpenStax Chemistry 2e §14.7. Giữ chiều thêm bazơ vào axit của mô hình và mốc tương đương 25 mL. |

## Nghiệm thu và bàn giao

Kiểm offline trên nền checkout `2d6d68c` và các thay đổi dataset trong working tree. Container chạy tắt mạng.

| Kiểm tra | Kết quả |
| --- | --- |
| `python -m lumilab_api.data_cli lint --include-drafts` | Thoát 0 và không có cảnh báo. Lint strict ghi 26 mục `ACADEMIC_REVIEW_REQUIRED`. |
| `python -m lumilab_api.data_cli build` và `build --include-drafts` | 10 đoạn đã duyệt và 36 đoạn khi bật bản nháp. Thử thay năm bản ghi bằng bản đề nghị trong bản sao kiểm thử vẫn tạo được 36 đoạn. |
| Đối chiếu cấu hình và đọc lại engine API | 36 ID duy nhất, 26 thẻ nháp đã sửa, 10 bản đã duyệt khớp bản gốc. Đối chiếu các số đọc và kịch bản đại diện của đủ 17 model ID trong corpus. |
| Kiểm phạm vi truy xuất | 4/4 ca pa-lăng tìm được thẻ sau khi đồng bộ trường `lab_id` trong ba bộ đánh giá. Văn bản câu hỏi và ID giữ nguyên. Ca `dev-wronglab-03` từ chối đúng nên được bỏ khỏi danh sách lỗi truy xuất đã biết. |
| `python scripts/tut01_offline.py --baseline-sha 2d6d68cab3d15e4339c71ff0aa40c24a7691b337 --output /audit/tut01.json` | Hai chế độ đạt 66/66 kiểm tra kỹ thuật. Pilot có bản nháp tìm được nguồn 17/17, chế độ chỉ reviewed 12/17. Số lượt gọi LLM live bằng 0. |
| `python -m pytest -p no:cacheprovider apps/api/tests` | 749 đạt, 12 bỏ qua, 1 cảnh báo tương thích Starlette/httpx. Các bài kiểm tra PostgreSQL và một số phụ thuộc tùy chọn nằm trong số bỏ qua. |

Corpus v3 và bản đề nghị duyệt lại dùng schema hiện hành. Đợt này đo tính tương thích, số đọc và truy xuất. Kết quả chấm rubric cho phản hồi LLM live và kiểm thử trình duyệt E2E vẫn cần lượt kiểm riêng.

Người duyệt chuyên môn đối chiếu 26 thẻ nháp và năm bản đề nghị. Với mỗi ID, ghi kết luận, section hoặc trang hỗ trợ, điều kiện mô hình, tên người duyệt và ngày. Chỉ áp dụng bản thay thế tương ứng sau khi duyệt đúng văn bản của revision này. Hiện ứng dụng lập chỉ mục chính thức từ 10 bản đã duyệt hiện hành. Quyền sử dụng tư liệu bên ngoài thuộc DAT-02. Nếu cần quay lại revision trước, khôi phục riêng ba tệp của lượt này từ bản `authored-labs-draft-v2` đã bàn giao, giữ các thay đổi dataset và activity từ lượt trước.

## Xác nhận kiểm tra kỹ thuật · 08/11/2026

**Người thực hiện: Codex (trợ lý AI), vai trò Data QA.** Biên bản ghi kết quả kiểm tra kỹ thuật trên đúng hai tệp dưới đây. Xác nhận học thuật của giáo viên là một bước riêng.

| Tệp đối chiếu | SHA-256 |
| --- | --- |
| `knowledge/retrieval/documents.json` · `authored-labs-draft-v3` | `fb357d4ff25e544969f040ffb82edeafe0e0f79fa5daa81a634fb95063063a03` |
| `dat-01-reapproval-candidates.json` · `authored-labs-v3-reapproval-draft-01` | `5c00e95d0ed59d68f5524040efc81443c261d7242550994b533fbd8a88457417` |

- Đã đối chiếu 36 ID với hồ sơ từng thẻ ở trên. Cả 26 thẻ nháp qua kiểm tra cấu trúc và tham chiếu mô hình. Năm thẻ đã duyệt tiếp tục dùng bản hiện hành. Năm thẻ đã duyệt có đề nghị thay thế được thử riêng trên bản sao chỉ mục.
- Chạy lại `python -m lumilab_api.data_cli lint --include-drafts` cho kết quả 0 cảnh báo. Đối chiếu số đọc đại diện của 17 mô hình đều khớp. Kiểm RAG/Tutor tập trung bằng pytest đạt 68, bỏ qua 2 ca phụ thuộc tùy chọn.
- Tutor offline đạt 66/66 kiểm tra kỹ thuật ở cả hai chế độ. Chỉ mục chỉ dùng thẻ đã duyệt vẫn có 10 thẻ. Các kết quả trên dùng mô hình và truy xuất offline.
- Cổng `reviewed` yêu cầu họ tên và ngày duyệt thật của giáo viên. Khi có xác nhận, ghi từng ID và quyết định đối với phiên bản có hash ở bảng. Duyệt 26 thẻ nháp làm tăng số thẻ đã duyệt; duyệt 5 bản thay thế cập nhật nội dung của các ID hiện có.
