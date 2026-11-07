# Trạng thái repo B

Mốc M02 đang tích hợp trên nhánh `feat/full-web-engine-api` (Issue #5). Web, engine, contracts, API, knowledge draft và bộ test liên quan đã được đưa vào B. Xem Issue #5 và PR của nhánh để biết trạng thái tích hợp mới nhất.

| Thành phần | Trạng thái tại B |
| --- | --- |
| Web | 9 lab hiện hành, bài học, soạn/quiz và Lumi UI; đã build |
| Lab engine | 11 model TypeScript/config gồm 9 hiện hành, 2 lưu trữ; 74 unit test đạt |
| API | FastAPI catalog, tính lại preview, phiên/lượt PostgreSQL, retrieval/Tutor; 508 pytest đạt, 9 skip khi không có DB |
| Knowledge | 30 thẻ draft; data CLI lint/build đạt, 12 warning thiếu nguồn thứ hai |
| E2E | 33 đạt, 3 skip khi không có PostgreSQL |
| Docker Compose | Web, API và PostgreSQL đã build và chạy healthy local; lab engine chạy trong web container/browser |
| CI | Workflow web, API và E2E PostgreSQL đã cấu hình; xem Actions để biết kết quả mới nhất |
| Khoa học/AI | Preview/INSUFFICIENT_DATA; chưa VERIFIED. AI live tắt, budget 0 |

Web chạy local trên 5175, API trên 8002, DB B nếu bật là 15434. Không dùng dữ liệu hay volume repo A. Bạn làm UI/UX có thể bắt đầu tại `apps/web/src/`; giữ hợp đồng với engine và API. Các ca PostgreSQL sẽ được xác nhận bằng CI trước merge.

Kiểm Docker local 07/11/2026: `docker compose config --quiet` và build web/API đạt; `up -d --wait web` cho DB, API, web đều healthy. Web `/`, `/healthz`, proxy `/api/v1/labs` và API `/ready` đều trả HTTP 200. Chrome headless mở con lắc, canvas hiện, đồng hồ tăng khi chạy, không có lỗi JavaScript. Chưa kiểm toàn bộ E2E trên container hoặc triển khai cloud.
