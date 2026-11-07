# Điều khiển bàn thực hành

## Phạm vi

9 bài hiện hành, 12 chế độ dùng runtime đang có. Phần lớn thao tác mới nằm ở web; riêng mạch nối tiếp mở rộng contract và phép tính đồng bộ ở engine/API. Nguồn học liệu và phạm vi Tutor không đổi. Bản nháp vẫn là bản nháp.

- **Cấu hình thử nhanh & Câu hỏi khám phá:** ba mẫu cho mỗi chế độ (`TN 1..3`, tổng 36 mẫu) kèm **Câu hỏi khám phá** gợi mở quan sát khi chọn mẫu và thanh tiến độ thực hành 3 bước (`1. Thiết lập → 2. Thao tác → 3. Ghi sổ (n)`). Mỗi mẫu bắt đầu từ defaults của engine rồi áp dụng các tham số ghi trong mẫu, đưa thời gian về 0 và giữ nguyên sổ đo/ghi chú. Mẫu Hóa đưa quan sát về trạng thái chưa mở.
- **Nhập chính xác:** thanh kéo và ô số dùng cùng trạng thái engine. Enter hoặc rời ô để áp dụng; Escape hủy giá trị đang nhập. Số ngoài giới hạn, ô trống và số hạt lẻ bị từ chối, giữ giá trị mô hình trước đó. Đơn vị và giới hạn hiển thị cạnh điều khiển.
- **Thời gian:** con lắc, lò xo, lò xo có cản, xe Newton, mặt phẳng nghiêng và RC có tốc độ 0,25× / 0,5× / 1× / 2×. Nút **Tiến 0,1 s** chạy một bước rồi dừng. **Về t = 0** giữ thông số và sổ đo. Tốc độ chỉ đổi tốc độ quan sát; thời gian lưu vẫn là giây mô phỏng. Rời tab trình duyệt tự tạm dừng như trước.
- **Tập trung & Trực quan hóa:** chế độ **Tập trung** ẩn đồ thị phụ, sổ đo, quản lý phiên và khối máy chủ; giữ bàn và thông số. **Hiện đầy đủ** khôi phục các khối cùng trạng thái. Các bàn cơ học có nút bật/tắt lớp vectơ lực, vận tốc và thanh cơ năng; dòng mới nhất trong sổ đo được tô nổi để dễ đối chiếu. Mobile thu gọn mẫu ban đầu để ưu tiên bàn và tôn trọng `prefers-reduced-motion`.

## Thao tác trực tiếp

| Bàn | Chuột / cảm ứng | Bàn phím |
| --- | --- | --- |
| Con lắc | Kéo quả nặng để đổi dây/góc | Chọn canvas; trái/phải đổi góc, lên/xuống đổi dây |
| Lò xo | Kéo vật, thêm quả cân; bật/tắt vectơ `Fđh, v` & cơ năng | Trái/phải chỉnh li độ thả; các thao tác đã có giữ nguyên |
| Lò xo tắt dần | Kéo khối nặng gắn pít-tông giảm chấn để đặt li độ thả | Chọn khối nặng; trái/phải chỉnh li độ `±0,02 m` |
| Newton | Kéo xe, mũi tên lực, quả cân; xem mốc quãng đường theo giây | Trái/phải chỉnh lực; Enter thêm quả cân |
| Mặt phẳng nghiêng | Kéo tay nắm tròn ở đầu dốc; bật/tắt phân tích lực `P, N, P∥, Fms` | Lên/xuống chỉnh từng độ |
| Ròng rọc & Pa-lăng | Kéo khối tải, lực kế hoặc đoạn dây treo lên/xuống; độ cao và số đo đổi ngay trong lúc kéo (1 / 2 / 4 nhánh dây) | Chọn tải hoặc lực kế; lên/xuống chỉnh `0,05 m` |
| Mạch điện / Mạng R / RC | Lắp nhiều bóng/điện trở cùng loại vào 3 ô mạch nối tiếp; kéo vật đã lắp sang ô khác hoặc vào khay tháo; kéo `R₁` hoán đổi `R₂`; thả tụ phụ `+100 µF` | Chọn vật bằng Enter rồi chọn ô, hoặc chỉnh từng ô bằng select; đóng/mở khóa K trực tiếp |
| Na/K với nước & ngọn lửa | Chạm lọ mẫu `Na/K`, chạm kẹp thả vào chậu nước hoặc đưa dây Pt vào ngọn lửa | Tab đến dụng cụ trên bàn, dùng Enter/Space |
| Cu–HNO₃ | Chạm lọ `HNO₃` loãng/đặc, chạm nút bông ở miệng ống để thử tiếp xúc `O₂` | Tab đến lọ/nút bông hoặc nút mở quan sát, dùng Enter/Space |
| Clo tẩy màu | Chạm khóa phễu nhỏ giọt `HCl` để điều chế `Cl₂`, chạm bình thử để đổi giấy khô/ẩm | Tab đến khóa phễu hoặc bình thử, dùng Enter/Space |

## Giới hạn cần biết

Lực cản của **con lắc** là minh họa giao diện cũ, chưa có trong engine/API. Web ghi rõ phạm vi và khóa nút ghi số đo khi đang minh họa có cản. Tính lại trên máy chủ vẫn dùng con lắc lý tưởng. Lò xo tắt dần là một runtime riêng đã có, không dùng công thức minh họa con lắc này.

Tốc độ phát, chế độ tập trung và các nút bật/tắt vectơ/cơ năng là tùy chọn xem trên giao diện, không nằm trong dữ liệu tự lưu. Số đo và tham số được tự lưu trên trình duyệt; thanh quản lý phiên và các nút lưu/nhập/xuất/khôi phục đã bỏ khỏi giao diện. Dữ liệu đã lưu vẫn dùng schema hiện tại. Chưa bổ sung cấu hình ngoài phạm vi mô hình như thay g, nhiệt độ, nồng độ/khối lượng trong các lab Hóa định tính.

Mạch nối tiếp dùng `ideal-series-circuit-ts-v2`: ngoài điện trở phụ 20 Ω và bóng 10 Ω có điện trở 10 Ω, cho phép lặp bóng/điện trở trong ba ô, tối đa một công tắc. `bulbPower_W` là tổng công suất trên các bóng. Dữ liệu mạch v1 hợp lệ đã lưu trên trình duyệt được khôi phục, tính lại và tự lưu thành v2. API chỉ trả preview/draft; mô hình chưa có mạch phân nhánh hoặc lắp dây tùy ý. Xem [đặc tả thao tác](../specs/007-tactile-labs/spec.md).

## Kiểm tại B

Ngày 07/11/2026, bản mạch v2 được kiểm trên Chrome desktop và viewport 390×844:

- `npm run check:web`, `npm run build:web`: đạt (0 lỗi TypeScript, 0 cảnh báo ESLint).
- `npm run test:unit`: 12 tệp / 114 ca đạt, gồm mô hình mạch v2, phiên v1 và 36 cấu hình mẫu.
- Ruff đạt; pytest API trên PostgreSQL test riêng **650 đạt, 2 skip** thư viện tùy chọn (1 cảnh báo Starlette); vector hai bóng và điện trở 10 Ω khớp server.
- **52/52 E2E đạt** trên web dev + API/DB test riêng; **7/7 E2E mạch/Hóa và mobile đạt** trên cặp image Docker web/API qua Nginx. Web `5175`, API `8002`, DB `15434` healthy; runtime catalog qua proxy báo mạch v2. Container/volume PostgreSQL giữ nguyên.
- Ở mobile 390 px, không tràn ngang; SVG bàn mạch bắt đầu ở y≈487 px sau khi đưa bàn lên trước công cụ phụ (trước đó y≈772 px). Kéo thả, bàn phím, lắp hai bóng, tháo một bóng, nhập phiên v1 và xuất v2 đã qua E2E.
- Bản local chưa commit dùng `git_sha=unknown`; đây không phải release bundle. Xem cấu hình mẫu tại `apps/web/src/data/labExperiments.ts`, kiểm tại `tests/e2e/experiment-controls.spec.ts` và `tests/e2e/circuit-kit.spec.ts`.

Đây là bằng chứng local; chưa phải CI hoặc duyệt khoa học. Không gọi provider khi kiểm.
