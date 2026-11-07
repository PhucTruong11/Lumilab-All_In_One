# Benchmark model thật

Repo B đã có `benchmark_runner.py` để so ba chế độ `no_rag`, `rag` và `rag_tools`, cùng `live_system_eval.py` cho smoke nhiều model. Runtime, runner và dữ liệu benchmark thuộc nhóm 20 file đã đối chiếu theo blob Git với A. [Cách đo ở A](https://github.com/PhucTruong11/lumilab/blob/f5f233f8dc2ee21934e6b77c740e7959fecb102a/docs/LIVE-LLM-EVALUATION.md)

## Smoke local người lớn · 08/11/2026

Profile [`docker/compose.live.yml`](../docker/compose.live.yml) chạy trên `127.0.0.1`, audience `adults`. Endpoint `/api/v1/tutor/status` trả `live_enabled=true`, PostgreSQL giữ cap sự kiện 20 và tối đa 2 lần thử cho mỗi câu. Một câu tự soạn “Mạch điện nối tiếp là sao” gửi qua Tutor API với `include_drafts=false` trả `response_source=llm`, model `gemini-3.5-flash-lite`, `attempts=1`, status `DRAFT_GUIDANCE`, không gắn citation. Bộ đếm sự kiện tăng từ 14 lên 15/20; không reset bộ đếm. Đây là smoke tích hợp một câu, chưa phải benchmark chất lượng hoặc duyệt khoa học. Gemini bị chặn với audience `under18`; Groq chưa được team duyệt cho audience này.

## Kết quả lịch sử của repo A

Đợt 06/11/2026 dùng hai câu khoa học tự soạn, chạy một lượt mỗi chế độ `closed_book` và `server_tools` cho từng model. Các số dưới đây thuộc phép đo của A. [Báo cáo gốc](https://github.com/PhucTruong11/lumilab/blob/f5f233f8dc2ee21934e6b77c740e7959fecb102a/docs/evaluation/LIVE-SYSTEM-2026-11-06.md)

| Model trong báo cáo A | Phản hồi đạt schema và số chuẩn | Độ trễ từng lượt |
| --- | ---: | --- |
| Gemini 3.5 Flash-Lite | 2/2 | 1,767 s và 1,280 s |
| Gemini 3.8 Flash | 0/2 | Timeout 8,188 s và 8,196 s |
| Qwen3.8 27B | 2/2 | 1,100 s và 0,687 s |
| GPT-OSS-120B | 2/2 | 1,127 s và 1,000 s |

Prompt Guard của A có 1 ca phát hiện đúng, 1 ca cho qua đúng, 1 ca chặn nhầm và 1 ca bỏ sót trên 4 câu. Đây là phép đo smoke. Đánh giá chất lượng cần tập câu hỏi độc lập và rubric riêng.

## Preflight trên B

Các lượt preflight và baseline dưới đây dùng corpus trước PR Dataset #13. Main đã nhận corpus `authored-nine-labs-draft-v1` và các runtime mới; cần build lại artifact, kiểm quyền/review và preflight mới trước khi đo live trên dữ liệu đó. Không dùng kết quả retrieval cũ để xác nhận corpus mới. [Bàn giao 9 bài](tasks/NINE-LABS.md) · [Runbook LLM](LLM-RUNBOOK.md)

Lần đầu ngày **07/11/2026**, receipt mẫu chọn `dev-circuit-ohm` và dự kiến 3 lần gọi. Chỉ mục tìm được `circuit-overview:0`. Lúc đó B chưa cấu hình key và DB cho bộ đếm.

Lần kiểm lại cùng ngày dùng key local của A theo yêu cầu. B lưu cấu hình trong `.env` được Git bỏ qua. PostgreSQL của B dùng volume hiện có và đã kiểm đủ bốn bảng ngân sách. Metadata xác nhận Gemini thấy cả hai model đã cấu hình và Groq thấy Qwen cùng GPT-OSS-120B. Phép kiểm metadata xác nhận key và model. Quota cần đối chiếu đúng project hoặc organization. [Gemini Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits) · [Groq Rate Limits](https://console.groq.com/docs/rate-limits)

| Preflight với hồ sơ A | Kết quả | Điều kiện còn thiếu |
| --- | --- | --- |
| Gemini Flash-Lite, `developer-smoke.json` | `NOT_RUN` | Hồ sơ quota hiện tại và ngân sách khả dụng, xác nhận quyền gửi đúng hash bộ câu hỏi, duyệt và cho phép gửi đoạn `circuit-overview:0`. |
| Groq Qwen và GPT-OSS-120B, `mcq-development.json` | `NOT_RUN` cho cả hai | Hai receipt ngày 06/11 khớp hash MCQ và có khai báo quyền gửi bộ câu hỏi. Cần xác nhận quota/ngân sách hiện tại và bổ sung bằng chứng RAG đã duyệt cho ca được chọn. |

Ba báo cáo trong `.local/evaluation/llm-baseline-b/` đều ghi `llm_calls=0`, `metrics=null`. Ứng dụng vẫn ở `live=false`, event cap `0`. Ngân sách local B và quota trên tài khoản provider là hai số khác nhau. Khi dùng chung key với A, tính cả các lượt đã dùng ở A trước khi xác định số lượt còn lại.

### Đối chiếu ảnh quota ngày 07/11/2026

| Nguồn | Giới hạn nhìn thấy | Phạm vi của số liệu |
| --- | --- | --- |
| AI Studio, Free tier, Gemini 3.5 Flash-Lite | 15 RPM, 250.000 TPM, 500 RPD | Mức sử dụng đỉnh trong 28 ngày lần lượt là 1 RPM, 211 TPM và 3 RPD. |
| AI Studio, Free tier, Gemini 3.8 Flash | 5 RPM, 250.000 TPM, 20 RPD | Mức sử dụng đỉnh trong 28 ngày lần lượt là 1 RPM, 397 TPM và 3 RPD. |
| Bảng Free Plan Groq, Qwen3.8 27B và GPT-OSS-120B | 30 RPM, 1.000 RPD, 8.000 TPM, 200.000 TPD cho mỗi dòng | Bảng mô tả giới hạn gói. Ảnh dashboard riêng hiển thị biểu đồ ba ngày của Default Project. |

Các ảnh giúp xác nhận giới hạn hiển thị. Số lượt còn lại tại thời điểm chạy chưa được xác nhận. Audit A ngày 06/11 ghi 14 lượt đã dùng. Theo mức trần 20 và giữ 5 lượt demo ở đợt đó, còn 1 lượt thường tại thời điểm audit, trong khi một ca benchmark cần 3 lượt. Lần đối chiếu này chưa đọc được bộ đếm A hiện tại. B chưa có dòng đếm cho sự kiện đó, nên không thể dùng số liệu B để suy ra ngân sách chung. Quyền gửi benchmark và bằng chứng RAG được kiểm riêng với quota.

Kiểm preflight từ root với artifact đã build theo [runbook RAG](DATA-RAG-TUTOR.md). Dùng receipt mẫu để quan sát các điều kiện còn thiếu.

```powershell
.\.venv\Scripts\python.exe -m lumilab_api.benchmark_runner `
  --dataset knowledge/evaluation/developer-smoke.json `
  --receipt knowledge/evaluation/benchmark-receipt.example.json `
  --limit 1 --output .local/evaluation/llm-baseline-b/live-preflight.json
```

Để đo live tại B, chuẩn bị credential server và PostgreSQL, lưu receipt thật trong `.local/`, xác nhận quota còn lại trong ngày UTC và duyệt đúng hash dataset cùng quyền gửi các đoạn RAG. Chạy preflight lại bằng receipt thật. Sau khi `blocking_reasons` rỗng, dùng `--execute` với tên output khác. Mỗi ca có ba lần thử theo ba chế độ. Runner tính cả lỗi vào ngân sách hiện có và ghi số lượt cùng metrics. [Receipt mẫu Gemini](../knowledge/evaluation/benchmark-receipt.example.json) · [Receipt mẫu Groq](../knowledge/evaluation/groq-receipt.example.json) · [Baseline offline B](BENCHMARK-AND-DATA.md)
