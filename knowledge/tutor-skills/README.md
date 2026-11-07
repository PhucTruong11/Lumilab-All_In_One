# Skill runtime của Lumi

Ba draft dưới đây chưa được backend tải hoặc gọi model. T4 triển khai allowlisted router theo mode; chỉ nạp skill phù hợp cùng owned server facts và evidence được duyệt. Coding tools không tự truyền skill vào Gemini API.

Skill không có quyền thực thi shell. Bộ eval cần kiểm hint không lộ đáp án sớm, số liệu không bị sửa, source IDs có thật, unknown evidence bị từ chối, prompt injection không đổi policy. Version skill/prompt phải vào cache key và tutor event. Xem `docs/DEPLOYMENT.md` trước bật provider.
