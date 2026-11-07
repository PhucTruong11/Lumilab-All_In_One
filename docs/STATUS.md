# Trạng thái repo B

Mốc hiện tại: **M01 — khung ứng dụng local**. M00 đã có README và hướng dẫn làm việc. M01 ở nhánh `chore/m01-local-base`, theo Issue #2 và PR #3; chờ review trước khi merge.

| Thành phần | Trạng thái |
| --- | --- |
| Web | React/TypeScript shell, hiển thị health API |
| API | FastAPI `/health` |
| CI | Workflow check/build web, Ruff/pytest API; xem PR #3 để biết kết quả CI mới nhất |
| Contracts / lab engine | Chỉ có cấu trúc thư mục, chưa có module |
| Knowledge / golden / E2E / Docker | Chỉ có cấu trúc thư mục |
| Phiên / RAG / Lumi / live AI | Chưa triển khai |

## Kiểm tra local M01

- `npm ci`: đạt.
- `npm run check:web`: đạt.
- `npm run build:web`: đạt.
- `.\.venv\Scripts\python.exe -m ruff check apps/api`: đạt.
- `.\.venv\Scripts\python.exe -m pytest apps/api/tests`: 1 passed, 1 warning từ Starlette TestClient.
- Smoke test: web HTTP 200, proxy `/api/health` trả `{"status":"ok"}`. Chrome headless: tiêu đề hiện, API sẵn sàng, 0 lỗi JavaScript.

## Việc tiếp theo

M02: contract tối thiểu và mock có nhãn cho một lab. M03: con lắc client cùng model, điều khiển và test. Chỉ đánh dấu mốc hoàn thành sau khi kiểm tại repo B.
