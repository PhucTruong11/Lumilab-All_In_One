# Plan cho 5 thành viên, sprint 20 giờ

H0 là lúc team bắt đầu. Đây là dự kiến có điều kiện: tái sử dụng demo; 20 giờ không đủ hoàn thành toàn bộ catalog và RAG vận hành thật. 5 × 20 = 100 giờ-người phân bổ, đã gồm review/tích hợp và 10 giờ-người buffer cuối.

| Phase | Giờ | Đầu ra / gate | Khi không đạt |
| --- | --- | --- | --- |
| PH0 | H0–H1 | Đọc rules, phân công, chốt contract và scope; T5 xác minh host/quota | Oracle không có VM sẵn → đường dự phòng; AI chưa xác minh → cap 0 |
| PH1 | H1–H4 | T1 workspace, T2 config/engine, T3 DB/session, T4 KB/templates/mock, T5 CI/deploy skeleton | H4 React port chưa kịp → nối API từ demo cũ, không rewrite 3 lab |
| PH2 | H4–H8 | Hai model/verifier, lưu trusted run, template bám evidence; H6 một lab end-to-end | H8 ưu tiên một luồng đúng; lab thứ hai chưa đạt phải ghi trạng thái |
| PH3 | H8–H12 | Hint/explanation, cache, durable quota, một provider nếu đủ điều kiện | Live AI fail → template có nhãn; không thêm provider để né quota |
| PH4 | H12–H16 | Regression, ownership/security, lỗi host/API, E2E; RAG P1 tối đa 90 phút nếu core xanh và RAM đủ | H13.5 chưa retrieval đúng → RAG tắt; tập trung ổn định |
| PH5 | H16–H18 | Freeze tính năng, release candidate, backup/restore, diễn tập online/local | Chuyển bản ổn đã biết; không sửa contract tùy tiện |
| PH6 | H18–H20 | Buffer lỗi P0 và thuyết trình; khóa phiên bản | Không thêm tính năng |

## Lát cắt kỹ thuật

1. Nền repo đã có skeleton nhưng không thay thế gate DB/session/deploy ở H4.
2. Contracts/config/golden → deterministic engines → verifier → DB runs → grounded tutor → optional RAG.
3. T1/T2/T3/T4 làm song song theo contract đã chốt; T5 tích hợp và test từ sớm. Shared files/lockfile được điều phối qua T5.
4. Mỗi gate cần chạy lệnh, ảnh/trace hoặc DB evidence, không lấy câu “AI bảo đã xong” làm nghiệm thu.

## Sau sprint

- S1: corpus có quyền sử dụng, embedding revision, idempotent ingestion, Chroma persist/rebuild, retrieval eval và citations.
- S2: hoàn thiện quiz/soạn hoạt động, feedback/Q&A, mạch điện kiểm chứng; thử trên điện thoại mục tiêu.
- S3: đối chiếu SGK theo bộ sách và giáo viên duyệt; pilot đo hiểu khái niệm/vận dụng. Không tuyên bố hiệu quả trước dữ liệu.

Các quyết định host ở `docs/DEPLOYMENT.md`; kiến trúc ở `docs/ARCHITECTURE.md`; task chi tiết ở `tasks.md`.
