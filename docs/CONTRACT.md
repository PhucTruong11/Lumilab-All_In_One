# Contract đang dùng ở B

OpenAPI của API chạy tại `http://127.0.0.1:8002/docs`. TypeScript contract: `packages/contracts/src/index.ts`; JSON Schema: `packages/contracts/schemas/`. Runtime lab và defaults: `packages/lab-engine/labs/`.

- `GET /health`: process liveness. `GET /ready`: DB + catalog, trả 503 khi DB chưa sẵn sàng.
- `GET /api/v1/runtime-labs`: 12 mô hình thuộc 9 bài hiện hành. Tham số `include_archived=true` thêm 5 mô hình tương thích.
- `GET /api/v1/labs` và `GET /api/v1/labs/{lab_id}`: catalog cấu hình P0. Danh mục 9 bài trên web và các chế độ dùng catalog runtime riêng.
- `POST /api/v1/verification/labs/{lab_id}`: body gồm `model_version`, `dataset_version`, `parameters`, `elapsed_s`. Server tính lại; kết quả hợp lệ vẫn là preview/`INSUFFICIENT_DATA` vì chưa có duyệt khoa học.
- `POST /api/v1/sessions`, `POST/GET /api/v1/sessions/{session_id}/runs`: cần PostgreSQL và Bearer token phiên; server kiểm ownership và tính lại trước khi lưu.
- `POST /api/v1/retrieval/query`: lọc theo lab, level, review và cách truy xuất; nguồn draft có nhãn.
- `POST /api/v1/sessions/{session_id}/tutor`: đọc run thuộc phiên. Mặc định phản hồi template, không gọi AI live.

Lỗi HTTP có `{error:{code,message},request_id}`. Không coi thiếu DB/index là đầu vào khoa học sai. Đổi field chung phải sửa schema, producer, consumer và test cùng lúc.
