# LumiLab — triển khai 9 bài đã chốt

Phụ trách Đạt, Codex thực hiện trên feature/dataset. Phạm vi engine, API preview, web, học liệu nháp và các ca kiểm thử liên quan.

| Bài trong Phòng thực hành | Mô hình đang mở | Phần triển khai |
| --- | --- | --- |
| Con lắc đơn | `pendulum` | Mô hình phi tuyến, chu kỳ và năng lượng từ bản trước |
| Con lắc lò xo | `spring`, `spring-damped` | Lò xo lý tưởng và trường hợp có lực cản nhớt |
| Newton II và mặt phẳng nghiêng | `mechanics`, `inclined-plane` | Hợp lực một chiều và vật thả từ nghỉ trên dốc có ma sát |
| Ròng rọc và pa-lăng | `pulley` | Ba cấu hình có 1, 2, 4 nhánh đỡ, số đo lực kéo, quãng đường và công |
| Định luật Ohm, mạch nối tiếp và song song | `circuit`, `parallel-circuit` | Bàn đo và mạch hai điện trở trong cùng bài |
| Nạp và xả tụ điện RC | `capacitor` | Hai chế độ nạp/xả của mô hình RC hiện có |
| Na, K tác dụng với nước và màu ngọn lửa | `alkali-water` | Hai chế độ quan sát riêng cho phản ứng với nước và màu của ion |
| Đồng với HNO₃ | `copper-nitric` | Ca NO và NO₂, tùy chọn quan sát NO sau khi tiếp xúc không khí |
| Điều chế clo và tính tẩy màu | `chlorine-bleach` | Bán phản ứng tạo clo, đối chứng khô và giấy màu ẩm |

Phòng thực hành liệt kê 9 bài. API runtime liệt kê 12 mô hình hiện hành. Năm mô hình lưu trữ vẫn mở được từ thư viện, danh sách chuyển bài và liên kết cũ. Các phiên cũ giữ nguyên ID, phiên bản và cách tính. Danh mục học liệu hiện có 17 bản ghi theo mô hình.

Sáu mô hình mới có cấu hình `lab.json`, phép tính TypeScript và Python độc lập, ghi sổ tay và preview máy chủ. Học liệu mới bổ sung 6 hoạt động dự đoán, so sánh và giải thích với tiêu chí tự đánh giá, 6 bài vận dụng có lời giải, 6 câu quiz và 6 thẻ LumiLab tự biên soạn cho truy xuất nháp. Revision mô hình có trong cấu hình của từng lab. Dataset mới dùng `lumilab-nine-draft-v1`, corpus dùng `authored-nine-labs-draft-v1`. Trang SGK, mục OpenStax và phạm vi từng nguồn được ghi tại [DATASET.md](../DATASET.md).

Các quyết định mô hình hóa gồm cản nhớt trong miền còn dao động, dốc dài 5 m với hệ số ma sát trượt bằng 0,8 lần hệ số ma sát nghỉ, và pa-lăng lý tưởng có nhánh đỡ thẳng đứng. Ba bài Hóa dùng kịch bản định tính, biểu diễn màu và phương trình ở mức học liệu ảo. Kết quả máy chủ giữ `INSUFFICIENT_DATA` với preview và `facts` rỗng cho đến khi có duyệt học thuật. Nguồn SGK/OpenStax được dùng để dẫn chiếu. Chỉ thẻ tự biên soạn của dự án vào chỉ mục nháp.

Phụ thuộc bàn giao gồm giáo viên rà phạm vi chương trình, Nam rà mô hình và Khoa tích hợp lại chỉ mục trên môi trường cần dùng. Để tạo lại chỉ mục nháp, chạy `python -m lumilab_api.data_cli build --include-drafts` từ thư mục gốc. Không cần migration. Rollback bằng cách hoàn nguyên diff của nhiệm vụ này và tạo lại chỉ mục từ corpus của phiên bản trước.

## Kết quả kiểm thử

- `npm run check:web` và `npm run build:web` đạt. Vite cảnh báo một bundle lớn hơn 500 kB.
- `npm run test:unit` đạt 95 ca. `python -m pytest apps/api/tests -q` đạt 618 ca, bỏ qua 9 ca cần PostgreSQL hoặc thư viện tùy chọn. Ruff đạt.
- `npm run test:e2e` trên Chrome local đạt 39 ca, bỏ qua 3 ca cần PostgreSQL. Đã đi từ cả 9 thẻ tới bài tập và mô phỏng, kiểm các chế độ mới, lưu sổ tay, kéo thả mạch điện và xem preview máy chủ.
- `data_cli lint --include-drafts` và `data_cli build --include-drafts` đạt. Chỉ mục có 36 đoạn, còn 12 cảnh báo thiếu nguồn độc lập thứ hai ở các thẻ cũ. Đã đối chiếu 11 bản ghi học liệu và 30 thẻ cũ vẫn khớp dữ liệu trước cập nhật.
- 55 tệp JSON trong thư mục dữ liệu và fixture được kiểm tra cú pháp, khóa trùng và giá trị số. Duyệt học thuật vẫn đang chờ.
