# Phạm vi khoa học của runtime LumiLab B

Tài liệu được chuyển và rút gọn từ [SCIENCE.md của repo A](https://github.com/PhucTruong11/lumilab/blob/f5f233f8dc2ee21934e6b77c740e7959fecb102a/SCIENCE.md), sau đó đối chiếu với cấu hình runtime B. Dùng bảng dưới đây để chọn ca hồi quy và viết chú thích giao diện. Phạm vi bài nhóm đã chọn nằm trong [DATASET.md](docs/DATASET.md).

## Các bài có runtime phù hợp với dataset

| Bài | Giả thiết và giới hạn hiện có | Điểm cần kiểm hoặc hiển thị |
| --- | --- | --- |
| Con lắc đơn `pendulum` | Chất điểm, dây không dãn, bỏ qua ma sát. Runtime dùng mô hình phi tuyến AGM cho góc thả từ 0° đến 90°. | Giữ cùng góc thả khác 0 và cùng `g` khi so chu kỳ theo chiều dài. Phân biệt công thức góc nhỏ trong học liệu với kết quả phi tuyến. Ở góc 0°, vật đứng yên và số đo chu kỳ hiển thị `—`. |
| Mạch Ohm `parallel-circuit` | Hai điện trở thuần, nguồn một chiều lý tưởng, hai cách mắc cố định. | Đối chiếu tổng trở, điện áp và dòng ở đúng vị trí. Mạch hở có dòng bằng 0. Thêm ca hai điện trở bằng nhau khi cần bao phủ tiêu chí của dataset. |
| Mạch RC `capacitor` | Mỗi chế độ bắt đầu lượt mới. Nạp bắt đầu ở 0 V và nối nguồn. Xả bắt đầu ở điện áp đã chọn và tách nguồn. Engine đổi µF sang F. | Đối chiếu `t = 0` và `t = τ` ở mỗi chế độ. Hiện điều kiện đầu, dấu dòng theo quy ước mô hình và đơn vị trên đồ thị. |

Xem giả thiết, phiên bản và đơn vị trong [cấu hình từng lab](packages/lab-engine/labs) và sai số trong [tài liệu các bước Verify](docs/VERIFY-STAGES.md). Dùng [golden fixtures](tests/golden/README.md) để kiểm TypeScript và Python với các giá trị tham chiếu chung.

## Chênh lệch với bài nhóm đã chọn

- `spring` hiện là lò xo ngang lý tưởng thả từ nghỉ, không cản. Giữ ca chu kỳ và cơ năng của phiên bản này. Chế độ có cản cần mô hình, tham số và ca kiểm riêng.
- `mechanics` hiện là chuyển động một chiều với tổng lực không đổi. Bài mặt phẳng nghiêng cần mô hình thành phần lực, ma sát nghỉ và ma sát trượt.
- Các runtime chuẩn độ, kết tủa AgCl và sinh CO₂ vẫn dùng được để kiểm hồi quy. Dataset mới chọn kim loại kiềm, Cu với HNO₃ và clo. Ba bài này cùng ròng rọc cần kịch bản, mô hình và màn hình riêng. [Backlog Verify và UI/UX](docs/tasks/DATASET-VERIFY-UI-PLAN.md)

## Duyệt mô hình và bằng chứng

### Minh họa lực cản trên bàn con lắc

Tùy chọn lực cản của bàn `pendulum` dùng biên độ mũ `A(t) = A₀ exp(−bt/2m)`, với `b` theo N·s/m và `t` theo giây, áp lên quỹ đạo AGM lý tưởng. Đây là minh họa xấp xỉ, chưa giải phương trình con lắc phi tuyến có cản. Chu kỳ trong sổ đo và phép tính lại Python vẫn thuộc `pendulum-agm-v1` không cản. Chế độ minh họa khóa nút ghi số đo trên bàn.

Trạng thái hiển thị dùng chung cho Canvas, số đọc và đồ thị. Cơ năng minh họa lấy từ biên độ còn lại `E(t) = 2mgL sin²(A(t)/2)`, với góc đổi sang radian, thế năng từ góc tức thời, động năng bằng phần còn lại. Thanh năng lượng chuẩn hóa theo năng lượng ban đầu để thể hiện tiêu tán. Khi biên độ cả chu kỳ dưới 0,05° (nửa bước hiển thị 0,1°), giao diện quy về trạng thái nghỉ và tạm dừng đồng hồ. Đây là ngưỡng hiển thị, không khẳng định vật lý dừng chính xác sau thời gian hữu hạn. Các tham số giữ phạm vi của mô hình gốc và hệ số cản UI từ 0,01 đến 0,20 N·s/m. Kiểm hồi quy gồm không dừng tại lần qua cân bằng, năng lượng không âm/giảm dần và bảo toàn mô hình lý tưởng.

Ghi riêng giả thiết mô hình, đơn vị, phạm vi, ca kiểm và vị trí trích dẫn cho từng kết luận. Tính số đo từ engine và kiểm độc lập ở API. Trạng thái hiện tại là `draft`. Verify trả preview cho kết quả phù hợp, với `INSUFFICIENT_DATA / REVIEWED_EVIDENCE_REQUIRED` khi thiếu bằng chứng được duyệt. [Phạm vi Verify](docs/VERIFICATION.md)
