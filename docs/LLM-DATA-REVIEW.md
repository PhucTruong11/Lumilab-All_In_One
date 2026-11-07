# LLM gateway và dữ liệu Tutor

Hướng dẫn cho B dựa trên [tài liệu gateway và dữ liệu ở A](https://github.com/PhucTruong11/lumilab/blob/f5f233f8dc2ee21934e6b77c740e7959fecb102a/docs/LLM-DATA-REVIEW.md), đối chiếu với gateway và cấu hình hiện có trong B.

[Kiến trúc LLM/Tutor](ARCHITECTURE.md) · [Baseline benchmark trên B](BENCHMARK-AND-DATA.md) · [Benchmark model thật](LIVE-LLM-EVALUATION.md)

Hướng dẫn cấu hình, fallback, guard, ngân sách và xử lý lỗi hiện hành của B ở [runbook LLM](LLM-RUNBOOK.md). [Sổ chuyển giao](MIGRATION-LEDGER.md) tách lịch sử A, thay đổi B và bằng chứng kiểm thực.

- Runtime dùng gateway, provider adapters, bộ đếm ngân sách và kiểm đầu vào. LLM mặc định tắt, event cap bằng `0`. Các route/provider được khai báo tại `knowledge/pipeline/providers.json`. Credential thuộc cấu hình riêng của API server. [Cấu hình mẫu](../.env.example)
- Khi chạy live, API yêu cầu PostgreSQL cho ngân sách, event cap dương, route phù hợp nhóm người dùng và cấu hình provider hợp lệ. Gateway kiểm nguồn đã duyệt và quyền gửi dữ liệu tới provider trước khi gọi. Trường hợp không đủ điều kiện dùng đường fallback/template theo contract. [Gateway](../apps/api/src/lumilab_api/llm_gateway.py)
- `progressive-hint`, `experiment-guide` và `grounded-feedback` là các skill Tutor thuộc repo. Gateway chọn skill từ danh sách cho phép. Engine và Verify cung cấp số đo và trạng thái khoa học. [Tutor skills](../knowledge/tutor-skills/README.md)
- Các tài liệu ở A ghi lại thiết kế và kết quả thử tại thời điểm đó. Khi cần cấu hình live ở B, kiểm điều kiện tài khoản, model, quota và quyền dữ liệu trên môi trường đích. [Gemini fallback](https://github.com/PhucTruong11/lumilab/blob/f5f233f8dc2ee21934e6b77c740e7959fecb102a/docs/GEMINI-FALLBACK.md) · [Groq fallback](https://github.com/PhucTruong11/lumilab/blob/f5f233f8dc2ee21934e6b77c740e7959fecb102a/docs/GROQ-FALLBACK.md)
