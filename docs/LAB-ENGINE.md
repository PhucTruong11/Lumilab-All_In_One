# Lab engine và điểm nối với UI/Verify

Chuyển và điều chỉnh từ [LAB-ENGINE.md của repo A](https://github.com/PhucTruong11/lumilab/blob/f5f233f8dc2ee21934e6b77c740e7959fecb102a/docs/LAB-ENGINE.md). [Catalog runtime B](../packages/lab-engine/labs/catalog.json) có 9 model hiện hành và 2 model lưu trữ. [Kế hoạch theo dataset](tasks/DATASET-VERIFY-UI-PLAN.md) ghi bài nào có thể dùng runtime hiện tại và bài nào cần mở rộng.

## Dữ liệu đi từ engine tới Verify

1. **Cấu hình lab** khai báo `model_version`, `dataset_version`, `defaults`, schema tham số, giả thiết và nguồn trong `packages/lab-engine/labs/<id>/lab.json`. Mỗi ID được đăng ký cùng model thực thi.
2. **Engine TypeScript** nhận lệnh như `setParameters`, `run`, `step` và `pause`. Host cấp đồng hồ. `snapshot()` trả trạng thái để web hiển thị thông số, số đo, thời điểm và các dòng đã ghi. Mỗi lần đổi tham số, engine tính lại và trở về thời điểm 0. [Runtime](../packages/lab-engine/src/runtime.ts)
3. **Web** đọc snapshot lúc người dùng bấm **Tính lại trên máy chủ**, rồi gửi `parameters`, `elapsed_s`, `model_version` và `dataset_version` đến route Verify theo `lab_id`. Kết quả gắn với lượt đã gửi. Khi người dùng đổi thông số hoặc thời gian, panel hiển thị kết quả thuộc lượt trước. [Panel preview](../apps/web/src/components/LabServerPreview.tsx)
4. **API** kiểm cấu hình và phiên bản, tính lại bằng Python và chạy các bước kiểm khoa học. Hợp đồng hiện cho preview và trạng thái thiếu bằng chứng đã duyệt. [Contract](CONTRACT.md) · [Các bước Verify](VERIFY-STAGES.md)

## Phiên và mở rộng mô hình

- `serialize()` lưu đầu vào, thời điểm, ghi chú và thiết lập trình bày. `restore()` kiểm schema, ID và phiên bản rồi tính lại các dòng đo. Kiểm lại import, export và khả năng đọc phiên cũ khi đổi schema hoặc phiên bản mô hình.
- Với bài mới hoặc chế độ mới, chốt mã kiến thức và ID runtime, tham số, đơn vị, điều kiện đầu, giả thiết và ca chuẩn. Đăng ký model TypeScript và Python cùng cấu hình, rồi nối điều khiển và số đo trên web. Chỉ công bố chế độ khi có implementation.
- Chạy `npm run test:unit` cho engine và golden. Dùng pytest kiểm recompute và các bước Verify. Dùng Playwright cho thao tác, snapshot cũ, lỗi mạng và trình bày trạng thái. [Golden fixtures](../tests/golden/README.md) · [Cách chạy kiểm Verify](VERIFICATION.md#kiểm-verify-trong-b)
