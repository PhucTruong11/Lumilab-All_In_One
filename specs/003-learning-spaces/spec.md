# Thư viện, Không gian học tập và Lumi

01/11/2026. User yêu cầu khôi phục ba không gian từ demo cũ vào frontend React. Không đổi backend/API contract, không gọi model.

- Thư viện: Vật lí (Dao động; Dòng điện và mạch điện; Chuyển động và lực), Hóa học (Dung dịch và axit–bazơ; Điện hóa; Cấu tạo nguyên tử). Mỗi chương một bài mẫu có kiến thức, công thức, bài tập, ghi chú và lời giải theo yêu cầu. Liên kết con lắc vào React lab; lab khác chưa port được ghi rõ.
- Học tập: hai tab Soạn thực hành/Tạo quiz, preview và chỉnh form, lưu draft local, xuất hoạt động; lọc quiz theo môn/chương, làm thử/chấm theo đáp án mẫu và xuất đề/đáp án riêng. Không tạo câu hỏi vượt số câu sẵn có bằng cách lặp lại.
- Lumi: chat kịch bản dựa trên nguồn đang chọn, không tự nhận live AI; chọn bài, checkbox nguồn, thu/mở panel, cây kiến thức2môn/3chương và gợi ý câu hỏi. Bỏ nguồn bài đang hỏi không được âm thầm dùng nguồn khác. Giữ hội thoại khi đổi navigation.
- Nội dung ba bài cũ được snapshot từ dist/lessons-data.js; ba bài cơ bản bổ sung là bản nháp. Không tuyên bố bám thứ tự SGK hoặc đã được giáo viên duyệt.

Acceptance: desktop/mobile không overflow, thao tác và persistence thật; lỗi storage không báo lưu thành công. Type/lint/build, unit tests, E2E cho3 luồng mới và regression con lắc.
