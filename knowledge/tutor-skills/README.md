# Skill runtime của Lumi

Gateway chọn skill trong danh sách cố định: `progressive-hint`, `experiment-guide`, `grounded-feedback` và `direct-answer`. Chế độ hỏi đáp live cho thử nghiệm người lớn có thể trả lời kiến thức phổ thông khi không có đoạn học liệu phù hợp; câu trả lời không có citation là nội dung AI chưa kiểm duyệt. Các chế độ hướng dẫn thí nghiệm vẫn yêu cầu học liệu đã duyệt. Cấu hình mặc định dùng đường template với live tắt.

Kiểm hint, số đo, source IDs, bằng chứng thiếu và prompt injection khi thay đổi skill. Xem [luồng RAG/Tutor](../../docs/DATA-RAG-TUTOR.md) và [điều kiện LLM](../../docs/LLM-DATA-REVIEW.md).
