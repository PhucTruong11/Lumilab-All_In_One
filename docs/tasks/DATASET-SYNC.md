# DATASET-SYNC — Kiểm kê và bàn giao dữ liệu LumiLab

Báo cáo này ghi lại lượt đồng bộ dữ liệu gốc. Phạm vi hiện tại và các bài được bổ sung sau lượt đồng bộ nằm trong [bàn giao 9 bài](NINE-LABS.md).

Phụ trách: Đạt (dataset), Codex thực hiện trên `feature/dataset`. Phạm vi đã nhận: `apps/web/src/data/`, các nơi đọc học liệu trong `apps/web/src/components/`, kiểm tra dữ liệu/UI, tài liệu dataset. Giữ nguyên engine, Verify, backend retrieval, corpus và các bộ đánh giá của repo đích.

Nguồn kiểm kê: checkout `lumilab` tại `67712a7a6e6de24fd64e9a9b9cdbf2c80aff2475`. Đích: checkout `Lumilab-All_In_One` tại `1f43bba`, gồm dữ liệu local có sẵn. Trạng thái học liệu: nháp.

## Đối chiếu trước khi sửa

| Loại | Nguồn | Đích trước đồng bộ | Cần làm |
| --- | --- | --- | --- |
| Bài học React | 11 bộ nội dung, 9 được đăng ký và 2 nằm trong mã nhưng chưa mở | Giống nguồn: 9/11 trong thư viện | Mở đúng chương cho pin điện hóa và cấu tạo nguyên tử; hợp nhất dữ liệu bài vào JSON |
| Bài demo cũ | Con lắc đơn, mạch điện và chuẩn độ | Toàn bộ trường của cả 3 bài đã có nguyên văn, gồm 3 bài tính và 12 câu trắc nghiệm | Dùng lại; không nhân bản |
| Lộ trình chương demo | 12 chương, 36 bước, 36 tiêu chí tự kiểm | Thư viện chỉ có 6 chương có bài; chưa có dữ liệu lộ trình | Chuyển theo thứ tự và mã nguồn; giữ 2 chương Hóa bổ sung của đích |
| Kịch bản và câu hỏi trong mô phỏng demo | 3 kịch bản, 6 câu chọn đáp án theo ngữ cảnh | Có luồng dự đoán/giải thích dạng ghi chú, chưa có đúng kịch bản/câu hỏi gốc | Chuyển vào học liệu theo đúng lab, tách khỏi quiz; không thêm lời giải |
| Cấu hình và kiểm thử khoa học | 11 model (9 hiện hành, 2 lưu trữ), 2 cấu hình catalog API nháp, 52 ca golden | Đủ cùng ID và nội dung gốc; 3 model có thêm bảng hằng số nội bộ ở đích | Giữ nguyên; catalog API nháp và danh mục bài học web phục vụ hai mục đích riêng |
| Học liệu truy xuất | 11 thẻ tổng quan, 2 mục curated, 11 hồ sơ provenance và 3 nguồn registry | 30 thẻ gồm 11 thẻ gốc có metadata trích dẫn bổ sung; dữ liệu curated và provenance đã có | Giữ phần mở rộng của đích và nhãn nháp; không nhân đôi dữ liệu |
| Bộ đánh giá và pipeline | Golden, fixture kiểm tra API/UI | Ngoài dữ liệu dùng chung, đích có thêm pipeline, bộ eval và pilot con lắc | Giữ nguyên. Ca kiểm thử và rubric chấm hệ thống không được tính là bài tập học sinh |

Kiểm kê thêm: `dist/library.js`, `dist/teacher-tools.js` và `dist/roadmap.js` dùng lại bài, câu hỏi và lộ trình; các đoạn trợ giúp theo kịch bản không phải bộ bài tập độc lập. CSV/XLSX dưới `docs/` là bảng công nghệ và kế hoạch dự án. Kết quả tính trong mô phỏng, bản ghi lưu trên trình duyệt và output tạo khi chạy không phải dữ liệu học tập gốc để nhập.

## Phần nguồn còn thiếu

- Sóng, Nhiệt học và khí lí tưởng, Vật lí hạt nhân, Phản ứng và cân bằng, Hóa học hữu cơ, Liên kết hóa học: nguồn có lộ trình và tiêu chí tự kiểm nhưng chưa có bài hoàn chỉnh, bài tập chấm điểm hoặc mô phỏng riêng.
- Phạm vi 9 lab đề xuất trong [DATASET.md](../DATASET.md) là danh mục biên soạn riêng. Nguồn chưa có bài tập hoặc mô phỏng riêng cho pa-lăng, mặt phẳng nghiêng có ma sát, lò xo tắt dần, Na/K với nước, Cu + HNO₃ sinh NO/NO₂ và tính tẩy màu của clo. Không dùng bài Newton một chiều, lò xo lý tưởng hay lab Hóa khác để thay thế.
- Sáu câu trong kịch bản cũ có chỉ số đáp án, không có trường lời giải riêng. Phần chuẩn độ ghi rõ bộ HCl–NaOH mặc định của kịch bản gốc; các biến thể sinh khi đổi dung dịch thuộc logic mô phỏng cũ.

## Dữ liệu đã đồng bộ

Từ **11 bài có nội dung** ở nguồn, đích đã có **9 bài dùng được và 2 bài nằm trong mã**. Sau đồng bộ, thư viện dùng cả **11 bài** (6 Vật lí, 5 Hóa học), với **11 bài tính có gợi ý, đáp án và lời giải** và **21 câu trắc nghiệm có đáp án và giải thích**. Cả 11 bản ghi được chuẩn hóa vào cùng file JSON, giữ thứ tự 9 bài cũ rồi nối 2 bài mới mở.

| Mã bài | Nội dung | Thay đổi | Số câu quiz |
| --- | --- | --- | ---: |
| `pendulum` | Con lắc đơn | Giữ bài, thêm kịch bản và 2 câu tự kiểm | 4 |
| `circuit` | Mạch điện, định luật Ôm và đồng hồ đo | Giữ bài, thêm kịch bản và 2 câu tự kiểm | 4 |
| `chemistry` | Chuẩn độ axit–bazơ | Giữ bài, thêm kịch bản HCl–NaOH và 2 câu tự kiểm | 4 |
| `mechanics` | Định luật II Newton trong mô hình một chiều | Chuyển bản ghi TypeScript vào JSON | 1 |
| `spring` | Con lắc lò xo ngang lý tưởng | Chuyển bản ghi TypeScript vào JSON | 2 |
| `parallel-circuit` | Hai điện trở nối tiếp/song song | Chuyển bản ghi TypeScript vào JSON | 1 |
| `capacitor` | Mạch RC nạp và xả | Chuyển bản ghi TypeScript vào JSON | 1 |
| `precipitation` | Kết tủa AgCl | Chuyển bản ghi TypeScript vào JSON | 1 |
| `gas-reaction` | Axit–bicarbonat tạo CO₂ | Chuyển bản ghi TypeScript vào JSON | 1 |
| `electrochemistry` | Pin điện hóa | Đưa bài gốc vào chương Điện hóa và quiz; mô phỏng vẫn lưu trữ | 1 |
| `atomic` | Cấu tạo nguyên tử | Đưa bài gốc vào chương Cấu tạo nguyên tử và quiz; mô phỏng vẫn lưu trữ | 1 |

Thư viện hiển thị 14 chương: 12 chương có lộ trình gốc và 2 chương có bài từ bản React (Phản ứng tạo kết tủa, Phản ứng tạo khí). Mỗi lộ trình giữ mục tiêu, 3 chủ đề, 3 bước và tiêu chí tự kiểm. Sáu câu tự kiểm trong kịch bản là dữ liệu bổ sung tách khỏi ngân hàng 21 câu quiz. Không sửa đề, lựa chọn, đáp án, sai số hoặc giải thích gốc.

## Bàn giao và đường dẫn

- `apps/web/src/data/demo-lessons.json`: 11 bài dùng chung cho thư viện, trình soạn hoạt động, quiz và Lumi.
- `apps/web/src/data/legacy-learning.json`: 12 lộ trình và 3 kịch bản cũ, kèm revision nguồn và trạng thái nháp.
- `apps/web/src/data/learning.ts`: ghép môn, chương và bài theo ID; kế thừa thứ tự của nguồn và giữ hai chương thêm của đích.
- `apps/web/src/components/{LessonLibrary,LearningWorkspace,LabSessionTools}.tsx`: tìm kiếm bài/lộ trình, hiển thị đáp án/kịch bản, lọc chương có bài và nối mô phỏng lưu trữ về học liệu.
- `packages/lab-engine/src/catalog-integrity.test.ts`, `tests/e2e/dataset-sync.spec.ts`: kiểm dữ liệu và luồng trên trình duyệt.
- `docs/DATASET.md` và báo cáo này: tách dữ liệu dùng được khỏi danh mục biên soạn.

Không đổi API, schema dùng chung, revision mô hình, cơ sở dữ liệu, corpus, bộ eval, quyền nguồn hoặc trạng thái duyệt. Không gọi AI live. Rollback: hoàn nguyên các thay đổi liệt kê trên theo diff; không có migration. Việc tiếp theo của Đạt/Nam là điền các nội dung còn thiếu bằng nguồn được phép dùng và ghi review thật; chưa gắn nhãn SGK hoặc VERIFIED cho dữ liệu nhập.

## Kết quả kiểm tra

Kiểm trên bản sao của checkout đích với lockfile gốc, Node 24 và Python 3.13:

- Đối chiếu trực tiếp với nội dung nguồn: cả 11 bài, 11 đề tính, 21 câu quiz, 12 lộ trình và 3 kịch bản với 6 câu tự kiểm khớp nội dung và đáp án gốc. Kiểm 56 file JSON dữ liệu, cấu hình và fixture: hợp lệ, không trùng khóa.
- `npm run check:web` và `npm run build:web`: đạt; Vite cảnh báo một bundle vượt 500 kB.
- `npm run test:unit`: 75 đạt. Test catalog xác nhận 11 bài có liên kết tới 11 model, trong đó chỉ 9 model nằm trong danh sách thực hành.
- Playwright trên Chrome local, chạy `dataset-sync.spec.ts`, `expanded-labs.spec.ts`, `local-retrieval.spec.ts`: 9 đạt. Đã kiểm tìm kiếm có/không dấu, lọc và chấm quiz theo chương, lời giải gốc, lộ trình chưa có bài, liên kết mô phỏng hai chiều và truy xuất có nhãn nháp.
- `python -m ruff check apps/api`: đạt. `python -m pytest apps/api/tests -q`: 508 đạt, 9 bỏ qua (PostgreSQL và thư viện tùy chọn), 1 cảnh báo Starlette TestClient.
- `python -m lumilab_api.data_cli lint --include-drafts` và `build --include-drafts`: đạt, 30 đoạn và 12 cảnh báo thiếu nguồn độc lập thứ hai. Lint chế độ nghiêm ngặt trả mã 1 vì corpus hiện có chưa đủ duyệt học thuật/quyền lập chỉ mục. Không đổi các cổng kiểm duyệt.

Trạng thái bàn giao: chờ review học thuật. Các kiểm tra trên xác nhận dữ liệu và luồng ứng dụng; chưa xác nhận căn cứ quyền sử dụng, độ phủ SGK hoặc nội dung chưa có trong nguồn.
