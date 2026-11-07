# Kế hoạch Verify và UI/UX theo dataset LumiLab

Dựa trên [DATASET.md v0.4](../DATASET.md) và [catalog runtime hiện tại](../../packages/lab-engine/labs/catalog.json). Đây là backlog đề xuất. Mã kiến thức trong dataset là mã nội dung. ID runtime dùng để chạy mô hình và gọi Verify. Chốt ánh xạ hai mã trước khi nối giao diện và API.

Khi triển khai, đối chiếu giả thiết và số đo trong [phạm vi khoa học của runtime](../../SCIENCE.md) và luồng snapshot trong [hướng dẫn lab engine](../LAB-ENGINE.md).

## Công việc theo từng bài

| Mã kiến thức | Runtime hiện tại | Verify và engine | UI/UX |
| --- | --- | --- | --- |
| `VL-CONLAC-01` | `pendulum` | Pilot. Chốt miền góc nhỏ và sai số cho mục tiêu SGK. Thêm ca chiều dài gấp 4, cùng `g` và góc thả. Ghi rõ phạm vi bằng chứng cho mô hình AGM hiện tại và cho xấp xỉ góc nhỏ. | Giữ canvas. Cho đổi chiều dài và góc thả. Hiện chu kỳ, năng lượng và điều kiện của công thức. Cho so sánh hai lượt với cùng `g` và góc thả. |
| `VL-LOXO-01` | `spring` có mô hình không cản | Giữ ca cơ năng và chu kỳ khi tắt cản. Chốt mô hình cản, miền còn dao động và ca các đỉnh biên độ giảm dần. Thêm engine và phép tính lại tương ứng. | Thêm chế độ có/không cản và đồ thị li độ theo thời gian. Cho so hai đường biên độ. Hiện điều khiển cản khi chế độ đó có runtime. |
| `VL-MATPHANGNGHIENG-01` | `mechanics` hiện mô phỏng lực tổng hợp không đổi trên một chiều | Thêm mô hình mặt nghiêng. Chốt quy ước chiều lực, điều kiện chuyển đứng yên/trượt và ca không ma sát `a = g sin α`. Kiểm ngưỡng ma sát nghỉ. | Vẽ mặt dốc, sơ đồ lực và mũi tên gia tốc. Cho đổi góc, khối lượng và hệ số ma sát. Hiện trạng thái đứng yên/trượt và đơn vị. |
| `VL-RONGROC-01` | Cần runtime mới | Giới hạn cấu hình mẫu ở ròng rọc cố định và pa-lăng có hai nhánh đỡ thẳng đứng. Kiểm số nhánh, trọng lượng cụm tải, lực kéo và quãng dây kéo với giả thiết đã chốt. | Cho chuyển hai cấu hình. Làm nổi các nhánh đỡ, ghi lực kéo, đoạn dây kéo và độ cao nâng. |
| `VL-DIEN-01` | `parallel-circuit` phù hợp mạch hai tải | Tái dùng kiểm Ohm và dòng nhánh. Bổ sung hoặc đối chiếu fixture hai điện trở bằng nhau ở cả nối tiếp và song song, cùng phiên bản dataset. | Dùng chung một màn hình chuyển nối tiếp/song song. Hiện sơ đồ hai tải, `R_tđ`, dòng tổng, dòng nhánh và điện áp tại đúng vị trí. |
| `VL-RC-01` | `capacitor` | Đối chiếu điều kiện đầu của hai mode với dataset. Kiểm quy đổi µF → F, `t = 0`, mốc `t = τ` và thời gian của snapshot. | Tách nạp/xả, hiện điều kiện đầu và đánh dấu `τ` trên đồ thị điện áp theo thời gian. Ghi rõ đơn vị của `R`, `C` và `t`. |
| `HH-KIEM-01` | Cần runtime mới | Định nghĩa kịch bản định tính Na/K trong catalog, kiểm phương trình và sản phẩm. Kiểm mapping màu ion ở kịch bản thử ngọn lửa riêng. | Hai chế độ độc lập **Phản ứng với nước** và **Nhận biết ion**. Hiện hiện tượng và tên màu bằng chữ. |
| `HH-HNO3-01` | Cần runtime mới | Chốt hai kịch bản của Cu. Kiểm sản phẩm khí ban đầu và trạng thái quan sát sau khi tiếp xúc không khí theo từng kịch bản. | Hai lựa chọn định tính **Loãng** và **Đặc**. Hiện dòng thời gian **Mới sinh** và **Sau khi tiếp xúc không khí** để học sinh phân biệt khí với màu quan sát được. |
| `HH-CHLORINE-01` | Cần runtime mới | Chốt ca đối chứng giấy khô/ẩm, điều kiện so sánh và vai trò của nước. Kiểm phương trình trong phạm vi catalog. | Đặt hai mẫu khô/ẩm cạnh nhau, có nhãn và giải thích vai trò của nước. Phần điều chế chỉ minh họa nguyên lí ở mức phương trình. |

Ba bài Hóa dùng kịch bản ảo và mô tả định tính theo dataset. Học liệu dẫn nguồn theo phạm vi `reference-only` hiện tại. Quyền đưa nội dung vào corpus và duyệt khoa học được ghi riêng.

## Backlog giao việc

| Task | Người phụ trách đề xuất | Đầu ra và điều kiện xong |
| --- | --- | --- |
| `DATA-01` · Bàn giao nội dung | Đạt, Nam rà soát | Mỗi mã có phiên bản, mục tiêu học, giả thiết, đơn vị, ca chuẩn, nguồn kèm vị trí trích dẫn và trạng thái duyệt. Tách phần SGK và phần mở rộng. Con lắc có thể bắt đầu từ [thẻ nháp](../../knowledge/pendulum.draft.json) và [bộ câu hỏi mẫu](../../tests/pendulum-dataset.sample.json). |
| `VERIFY-01` · Pilot con lắc | Verify/API và Nam | Ánh xạ `VL-CONLAC-01` ↔ `pendulum`. Dùng hoặc mở rộng golden fixtures với ca đúng, sai phiên bản, đầu vào không hợp lệ, ngoài phạm vi bằng chứng và hồ sơ chưa duyệt. Kiểm miền công thức, sai số và nguồn theo phiên bản. |
| `UI-01` · Mẫu trải nghiệm chung | UI/UX | Thiết kế luồng **Dự đoán → Thao tác → Đọc kết quả → Giải thích** cho con lắc. Mẫu có điều khiển, số đo kèm đơn vị, giả thiết, nguồn và trạng thái Verify. Làm được với fixture API trong lúc backend phát triển. |
| `JOINT-01` · Nối API và UI | Verify/API và UI/UX | Chốt dữ liệu phản hồi và thông điệp cho từng trạng thái. Chạy E2E con lắc trên mobile và desktop, gồm thao tác bàn phím, gửi snapshot, đọc kết quả, đổi tham số và xử lý lỗi. |
| `VERIFY-02` + `UI-02` · Mạch Ohm và RC | Verify/API và UI/UX | Áp dụng mẫu chung cho hai runtime hiện có. Nghiệm thu ca hai điện trở bằng nhau, mốc `τ` và hai điều kiện đầu của RC. |
| `MODEL-01` · Lò xo và mặt nghiêng | Engine và Verify/API, UI/UX nối sau khi chốt schema | Hoàn thành từng mô hình TypeScript/Python, fixture và màn hình theo dòng tương ứng trong bảng. |
| `MODEL-02` · Ròng rọc và ba bài Hóa | Engine, Verify/API và UI/UX | Chốt kịch bản và fixture từng bài trước khi đưa vào catalog. Có thể thiết kế và review giao diện trên dữ liệu mẫu song song. |

## Phần API và UI cần chốt chung

- Giữ `lab_id`, `model_version`, `dataset_version`, `parameters` và `elapsed_s` gắn với lượt đã gửi. Khi thông số hoặc thời điểm thay đổi, UI ghi rõ kết quả đang thuộc lượt trước. API hiện đã trả `status`, `code`, `stage_checks` và `evidence`. Web hiện đọc chủ yếu preview, nên task tích hợp cần mở rộng consumer và rà cách lưu lịch sử preview hiện có. [Contract hiện tại](../CONTRACT.md) · [Thành phần preview](../../apps/web/src/components/LabServerPreview.tsx)
- `INSUFFICIENT_DATA` kèm preview hiện số đo máy chủ và lý do còn thiếu bằng chứng. `INVALID` chỉ rõ đầu vào cần sửa nếu xác định được. `UNSUPPORTED` giải thích giới hạn mô hình. Lỗi mạng hoặc timeout có thông báo và nút thử lại riêng. Thiết kế nhãn `VERIFIED` cho dữ liệu mẫu trước. Trên dữ liệu thật, nhãn chỉ hiện khi API trả trạng thái đó sau khi kiểm phiên bản, phạm vi, bằng chứng đã duyệt và các stage bắt buộc. [Quy tắc Verify](../VERIFICATION.md)
- Nghiệm thu chung cho mỗi lab gồm một ca chuẩn từ dataset, một ca biên hoặc ngoài phạm vi và một luồng UI từ thay thông số đến đọc kết quả. Dùng pytest và Vitest cho mô hình và contract. Dùng Playwright cho tương tác, nhãn trạng thái và lỗi kết nối. [Hướng dẫn golden](../../tests/golden/README.md)
