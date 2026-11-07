# Contract đang dùng ở B

OpenAPI của API chạy tại `http://127.0.0.1:8002/docs`. TypeScript contract: `packages/contracts/src/index.ts`; JSON Schema: `packages/contracts/schemas/`. Runtime lab và defaults: `packages/lab-engine/labs/`.

- `GET /api/v1/system`: metadata public chỉ đọc, schema `system-info-1.0`: Git SHA, mapping bài/mode/pilot, model/dataset revision từng runtime, corpus/registry revision và index fingerprint đã nạp. Không có credential hoặc provider call. Web build có `/build-info.json` (`web-build-1.0`). [Schema system](../packages/contracts/schemas/system-info.schema.json) · [Schema mapping](../packages/contracts/schemas/practice-map.schema.json) · [Cách kiểm phiên bản](DOCKER-RELEASE.md)

- `GET /health`: process liveness. `GET /ready`: DB + catalog, trả 503 khi DB chưa sẵn sàng.
- `GET /api/v1/runtime-labs`: 12 mô hình thuộc 9 bài hiện hành. Tham số `include_archived=true` thêm 5 mô hình tương thích.
- `GET /api/v1/labs` và `GET /api/v1/labs/{lab_id}`: catalog cấu hình P0. Danh mục 9 bài trên web và các chế độ dùng catalog runtime riêng.
- `POST /api/v1/verification/labs/{lab_id}`: body gồm `model_version`, `dataset_version`, `parameters`, `elapsed_s`. Server tính lại; kết quả hợp lệ vẫn là preview/`INSUFFICIENT_DATA` vì chưa có duyệt khoa học.
- Runtime `circuit` dùng `ideal-series-circuit-ts-v2`: `slots` có đúng ba ô, mỗi ô nhận `extraResistor` (20 Ω), `resistor10` (10 Ω), `bulb` (10 Ω), `switchInstalled` hoặc `null`. Bóng/điện trở được lặp; công tắc tối đa một. `bulbPower_W` là tổng công suất các bóng. Tệp phiên trình duyệt mạch v1 hợp lệ có thể nhập và xuất lại thành v2; API yêu cầu version v2 cho lượt mới.
- `POST /api/v1/sessions`, `POST/GET /api/v1/sessions/{session_id}/runs`: cần PostgreSQL và Bearer token phiên; server kiểm ownership và tính lại trước khi lưu.
- `POST /api/v1/retrieval/query`: lọc theo lab, level, review và cách truy xuất; nguồn draft có nhãn.
- `POST /api/v1/sessions/{session_id}/tutor`: đọc run thuộc phiên. Mặc định phản hồi template, không gọi AI live.

Lỗi HTTP có `{error:{code,message},request_id}`. Không coi thiếu DB/index là đầu vào khoa học sai. Đổi field chung phải sửa schema, producer, consumer và test cùng lúc.
