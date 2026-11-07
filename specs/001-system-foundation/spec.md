# LumiLab: specification hệ thống

## Mục tiêu

Học sinh chọn môn/chương/bài, xem kiến thức, dự đoán rồi thao tác trong lab. Engine chạy cục bộ để tương tác không phụ thuộc LLM. Khi xác nhận lượt thử, backend kiểm chứng và lưu kết quả. Lumi gợi ý/giải thích từ đúng lượt thử và học liệu đã duyệt. Giáo viên và học sinh dùng không gian học tập để soạn hoạt động và quiz.

## Phạm vi và ưu tiên

**P0 trong sprint 20h**, dựa trên demo sẵn có: một luồng hoàn chỉnh cho con lắc phi tuyến và chuẩn độ HCl–NaOH 1:1, 25°C; cấu hình versioned, backend verifier, phiên ẩn danh có token, PostgreSQL, hint/explanation có evidence, kiểm quota, test và đường online/local. Bảo toàn mạch điện demo nhưng chưa tuyên bố backend verified. Canvas cho cảnh phù hợp; SVG/renderers cũ được tái sử dụng, không ép viết lại để đủ tên công nghệ.

**P1 sau khi core đạt gate:** RAG sentence-transformers + Chroma, Q&A/feedback, provider thứ hai có cấu hình ngân sách, thêm cặp hóa chất, điện có server verification, workflow quiz/soạn bài nối backend, dashboard và backup tự động. Các mục này vẫn thuộc hệ thống mục tiêu, không bị loại khỏi sản phẩm.

**P2:** catalog lớn, nhiều instance/cache phân tán, tài khoản giáo viên, đánh giá hiệu quả lớp học và chấm điểm chính thức sau khi đủ kiểm chứng.

## Yêu cầu chức năng

- Catalog có version và giới hạn; chưa hỗ trợ phải thể hiện đúng trạng thái.
- Lab lifecycle: load, set parameter, run/pause/reset, snapshot; số đo và đồ thị từ pure functions.
- Schema/Pydantic xác minh input; physics invariants và 5 lớp chemistry theo `docs/VERIFICATION.md`.
- Run đã lưu chứa server_result, verification, phiên bản và evidence. Client_result chỉ để đối chiếu.
- Tutor: P0 hint nhiều mức và explanation; P1 feedback/Q&A. AI không thay đổi số đo hoặc trạng thái verifier.
- Schema validation và semantic validation cho AI; thiếu căn cứ → template hoặc insufficient evidence. RAG sources không tự trở thành dữ liệu chuẩn nếu chưa review.
- PostgreSQL lưu sessions, runs, verification, tutor/feedback và quota. Memory cache không thay dữ liệu bền.
- JSON logs: request_id, latency, errors, model/token khi có; không chứa secret/nội dung học sinh thô.
- OpenAPI, Docker, CI lint/test/build; deployment có rollback và bản local.

## Acceptance chính

1. Nhập sai số/đơn vị → lỗi có request_id; điều kiện ngoài catalog → UNSUPPORTED, không bịa hiện tượng.
2. Hai engine FE/Python dùng cùng golden vectors. Góc 0 đứng yên, góc lớn phi tuyến; pH tại tương đương 7 trong mô hình 25°C.
3. Giả client_result không đổi kết quả chuẩn; sai token không đọc/ghi run của phiên khác; idempotency tránh lưu trùng.
4. Quota 0, 429, timeout, nguồn giả hoặc con số AI sai → không vượt cap, không làm hỏng lab, có nguồn phản hồi rõ.
5. Restart API không mất run và budget. RAG tắt vẫn học được theo curated lookup; không gọi lookup là RAG vector đã triển khai.
6. Chỉ công bố URL và test sau khi thật sự chạy; dữ liệu học tập/SGK phải có nguồn và quyền sử dụng phù hợp.
