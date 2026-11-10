# Vận hành Gemini/Groq và Lumi Tutor

Đối chiếu code B ngày **07/11/2026**. Dùng cùng [kiến trúc](ARCHITECTURE.md), [quyền dữ liệu](LLM-DATA-REVIEW.md) và [kết quả/preflight](LIVE-LLM-EVALUATION.md). Đây là hướng dẫn vận hành; cấu hình mặc định tiếp tục trả template, không gọi model.

## 1. Cấu hình đúng môi trường

Python chạy từ root đọc `.env`; biến môi trường process được ưu tiên. Chỉ tạo `.env` từ [mẫu](../.env.example) nếu file chưa có, giữ key server-side và không ghi key vào log/PR. Khởi động lại API sau khi đổi cấu hình, registry hoặc metadata. `LUMILAB_LLM_MODEL` không thay lựa chọn route: gateway chọn từ [providers.json](../knowledge/pipeline/providers.json).

Compose mặc định chỉ truyền DB URL và các cờ tắt AI/RAG; `--env-file` phục vụ nội suy, không tự đưa mọi biến/key trong file vào container. [Profile live local](../docker/compose.live.yml) truyền riêng hai key server, đặt audience `adults` và giữ cap sự kiện 20 đã ghi trong PostgreSQL; chỉ dùng để thử nghiệm bởi người lớn trên máy local. Đường dẫn artifact trong container là `/workspace/retrieval-index/index.json`; Python trực tiếp mặc định dùng `.local/retrieval/index.json`. Profile Chroma HTTP chưa tự nối với `PersistentClient` của API. [Runbook RAG](DATA-RAG-TUTOR.md)

| Biến `LUMILAB_…` | Mặc định trong Settings | Ý nghĩa |
| --- | --- | --- |
| `LLM_ENABLED`, `LLM_EVENT_CAP` | `false`, `0` | Không cho gọi live khi chưa có ngân sách. Event cap cấu hình tối đa 200 lần thử, gồm lượt lỗi và retry. |
| `LLM_LOCAL_UNLIMITED` | `false` | Opt-in cho `ENV=development`: bỏ trần số lượt sự kiện/phiên/ngày/phút của ứng dụng, vẫn ghi bộ đếm PostgreSQL, giữ trần chi phí, quota provider/token và deadline/retry. Cấu hình này bị từ chối ở production. |
| `LLM_AUDIENCE` | `under18` | Phải đúng đối tượng thực. Gemini bị chặn cứng ở `under18`; Groq cần `minors_approved` sau khi team duyệt ứng dụng, profile thử local đặt `adults`. |
| `GEMINI_API_KEY`, `GROQ_API_KEY` | Không có | Credential server; các model cùng provider dùng key tương ứng. |
| `LLM_ALLOW_MODEL_FALLBACK`, `LLM_ALLOW_PROVIDER_FALLBACK` | `false`, `false` | Cho chuyển model cùng provider hoặc chuyển provider theo route đã đủ điều kiện. |
| `LLM_TIMEOUT_SECONDS`, `LLM_TOTAL_TIMEOUT_SECONDS` | `8`, `18` | Deadline mỗi chat transport và deadline chung cho guard/chat. |
| `LLM_MAX_ATTEMPTS`, `LLM_MAX_OUTPUT_TOKENS` | `4`, `384` | Tổng lượt chat, gồm lượt sửa output; giới hạn output mỗi lượt. |
| `LLM_SESSION_RPM`, `LLM_SESSION_DAILY` | `4`, `10` | Trần provider attempts theo phiên/phút và phiên/ngày UTC. Profile local người lớn dùng 30 lần thử/phiên/ngày, gồm retry. |
| `LLM_EVENT_ID`, `LLM_RESERVED_DEMO`, `LLM_DEMO_MODE` | `sgu-hackathon-2026`, `5`, `false` | Ngân sách sự kiện dùng bền qua các phiên; lượt thường giữ lại phần demo. |
| `LLM_DAILY_MICROUSD` | `0` | Trần chi phí dự trữ mỗi ngày, đơn vị một phần triệu USD. Giá route bằng 0 vẫn chịu các trần lượt/token. |
| `GROQ_SHARED_TPM`, `GROQ_SHARED_TPD` | `8000`, `200000` | Trần token chung do ứng dụng đặt, không cộng hạn mức từng model. |
| `PROMPT_GUARD_ENABLED` | `false` | Classifier Groq tùy chọn; luật local luôn chạy. |
| `PROMPT_GUARD_MAX_SEGMENTS`, `PROMPT_GUARD_TIMEOUT_SECONDS`, `PROMPT_GUARD_THRESHOLD` | `4`, `2`, `0.5` | Số đoạn tối đa, timeout mỗi guard call và ngưỡng chặn. |
| `GROQ_MODEL_MANIFEST` | `.local/groq-models.json` | Metadata model gắn với fingerprint key, hiệu lực 24 giờ. |
| `LLM_CACHE_TTL_SECONDS` | `600` | Cache theo phiên/context/route; không dùng cache khi remote guard bật. |

Các giá trị khác và giới hạn validation ở [settings.py](../apps/api/src/lumilab_api/settings.py). Hạn mức registry là cấu hình local, không chứng minh quota tài khoản còn lại.

## 2. Điều kiện trước live

API chỉ khởi động live khi có DB URL, event cap dương và ít nhất một chat route được phép. Route cần `enabled`, `account_verified`, `policy_verified`, `quota_verified`; `free_only` loại route có giá khai báo khác 0. Trước khi gọi còn cần key hợp lệ, PostgreSQL thực sự truy cập được, học liệu `reviewed`, provenance và quyền `send_llm`. Có key không tự đáp ứng các điều kiện này.

Chế độ `qa` hỗ trợ mọi runtime đã triển khai trong catalog (14 hiện hành, 3 lưu trữ). Câu hỏi không xác định được lab gửi `lab_id=null`, không đính kèm run/RAG của bài khác, và có thể nhận giải thích kiến thức phổ thông từ model. Các mode `hint`, `explanation`, `feedback` vẫn chỉ mở ở ba pilot `pendulum`, `circuit`, `chemistry` và cần nguồn được duyệt, có quyền gửi provider. `tutor_pilot` trong `/api/v1/system` chỉ phạm vi thực hành này, không phải phạm vi QA.

API vẫn kiểm token/hạn phiên và quyền `run_id`; không nhận facts, preview hoặc đường dẫn skill do client gán. QA cho phép chữ số trong công thức, phương trình và hằng số có đơn vị/điều kiện; lời giải thích là AI chưa kiểm duyệt, không phải số đo hay chứng nhận đúng khoa học. Số đo vẫn do engine/API tính và hiển thị riêng. Bộ kiểm output giữ schema chặt, ID citation hợp lệ và chặn tự nhận `VERIFIED`/đã duyệt; không tự chứng minh được tính đúng của mọi câu văn. Các mode hướng dẫn thực hành vẫn chặn số do model phát sinh. Output hợp lệ là `DRAFT_GUIDANCE`. Prompt version `lumi-seven-blocks-v7-all-labs-qa` tách cache khỏi câu trả lời cũ.

Điều khoản [Gemini API](https://ai.google.dev/gemini-api/terms) cấm dùng API trong ứng dụng hướng tới hoặc có khả năng được người dưới 18 tuổi truy cập. [Groq Services Agreement](https://console.groq.com/docs/legal/services-agreement) yêu cầu người dùng dịch vụ từ 18 tuổi và nêu rõ trách nhiệm của khách hàng nếu ứng dụng có người dùng chưa đủ tuổi thành niên. Vì vậy registry hiện chưa đánh dấu Groq được phép cho audience `under18`; nhóm cần chốt điều kiện sử dụng, dữ liệu và biện pháp bảo vệ trước khi đổi cờ `minors_approved`. Không đổi audience thành `adults` cho một triển khai dành cho học sinh.

Với Groq chat được bật, startup kiểm manifest local mới và đúng key/model. Lệnh dưới **gọi GET metadata Groq**, không sinh nội dung; chạy tường minh khi cần kiểm key, không thêm vào CI/health:

```powershell
.\.venv\Scripts\python.exe -m lumilab_api.provider_check --output .local/groq-models.json
```

Kết quả cần `status=CHECKED` và model dự định dùng có trong danh sách. Lệnh này không kiểm quota còn lại hoặc quyền gửi dataset. Hiện CLI này chỉ kiểm Groq; kết quả Gemini đã kiểm trước đây nằm trong báo cáo preflight, không có lệnh Gemini metadata riêng ở đây.

## 3. Fallback, guard và ngân sách

Khi tất cả chat route liên quan đủ điều kiện, thứ tự priority là Gemini Lite → Gemini backup → Groq Qwen → Groq OSS-120B → Groq OSS-20B (chỉ mode `hint`). Mistral/local/OpenRouter có trong registry nhưng vẫn disabled, không thuộc chuỗi đã nghiệm thu. Hai cờ fallback mặc định tắt: chỉ route đầu được chọn. Chỉ bật model fallback giữ trong provider đầu; bật provider fallback mới cho phép đi qua provider khác. Các gate audience/quyền vẫn áp dụng.

- Timeout/network và HTTP `408/429/500/502/503/504` có thể chuyển route tiếp theo trong giới hạn. Không retry transport cùng model. Lỗi key/quyền, `404`, redirect hoặc JSON transport sai dừng bằng fallback cấu hình/phản hồi.
- Output sai schema/citation/claim chỉ được sửa tối đa một lần trên toàn yêu cầu; lần sửa chiếm một trong tối đa bốn chat attempts. Không đảm bảo thử hết các model.
- Luật local xét câu hỏi, history và đoạn nguồn trước cache/network. Remote Prompt Guard chỉ xét câu hỏi hiện tại đã redact, tối đa bốn đoạn với hai worker. Kết quả vượt ngưỡng chặn. Lỗi guard xuống `REMOTE_UNAVAILABLE`, vẫn giữ luật local và kiểm output; không đồng nghĩa nội dung đã an toàn.
- Deadline chung bắt đầu trước dựng prompt. Timeout chat/guard giảm theo thời gian còn lại. Socket/DB và thread có thể thêm độ trễ, nên 18 giây không phải cam kết wall-clock tuyệt đối. Client Tutor hiện chờ 20 giây.
- Mỗi guard/chat call reserve nguyên tử qua PostgreSQL trước network. Timeout, lỗi và repair vẫn tính lượt; guard và chat dùng chung event/session budget. Trần lý thuyết là bốn guard + bốn chat calls, nhưng cap phiên/phút mặc định có thể dừng sớm hơn.
- Bốn bảng giữ lịch sử và giới hạn: `llm_budget_counters`, `llm_attempts`, `llm_token_budgets`, `llm_provider_headers`. Token reserve dùng ước lượng bảo thủ bytes + output; usage thực được ghi riêng. Groq ghi các quota header trong allowlist và thời gian chờ; DB lỗi thì không cấp thêm reservation.

Dùng chung key với A hoặc nhiều DB đòi hỏi đối chiếu usage chung; PostgreSQL B không tự biết lượt bên ngoài nó. Không reset counter, đổi event ID hoặc khôi phục snapshot cũ để lấy lại quota.

## 4. Kiểm offline và đọc lỗi

Từ root với API dev đã cài theo [README](../README.md):

```powershell
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_data_rag_gateway.py apps/api/tests/test_model_fallback.py apps/api/tests/test_groq_fallback.py apps/api/tests/test_groq_http.py apps/api/tests/test_input_guard.py apps/api/tests/test_injection_context.py apps/api/tests/test_benchmark_preflight.py apps/api/tests/test_live_system_eval.py -q
.\.venv\Scripts\python.exe -m lumilab_api.guard_evaluation --output .local/evaluation/injection-local.json
Invoke-RestMethod http://127.0.0.1:8002/api/v1/tutor/status
```

Pytest dùng provider giả/HTTP transport giả; guard evaluation dùng luật local. Endpoint status chỉ đọc cấu hình và trạng thái index, không gọi model hoặc xác nhận quota.

| Dấu hiệu | Kiểm tiếp theo |
| --- | --- |
| Startup `Live LLM disabled…` | Kiểm DB URL, event cap và route.allowed theo audience. Trở lại live off/cap 0 khi cấu hình chưa đủ. |
| `Groq server key required` / `Fresh Groq metadata check required` | Kiểm secret server, manifest, thời gian UTC và model; chạy metadata tường minh nếu cần. |
| HTTP `401` / `404` / `503` ở Tutor | Kiểm token/hạn phiên; lab/run thuộc phiên; DB tương ứng. Dùng `request_id`, không ghi token hoặc raw câu hỏi vào log. |
| `NEEDS_SOURCE` / `NO_RELEVANT_SOURCE` | Kiểm artifact, lab/level và câu hỏi; bàn giao cho owner RAG, không hạ ngưỡng để vượt preflight. |
| `MVP_SCOPE_ONLY`, `LIVE_DISABLED`, `NO_APPROVED_PROVIDER` | Kiểm mode thực hành/pilot ID, cấu hình đang được process/container dùng và route được phép. QA không bị giới hạn ba pilot. |
| `REVIEWED_SOURCES_REQUIRED`, `SOURCE_PROVIDER_USE_NOT_APPROVED` | Chờ review/provenance/quyền nguồn đúng revision; không tự điền người duyệt. |
| `LIVE_BUDGET_DISABLED`, `ATTEMPT_CAP_EXCEEDED`, `DAILY_COST_CAP_EXCEEDED` | Kiểm event/session/day budget, phần demo và usage A/B; dừng khi hết lượt. |
| `MODEL_RATE_LIMIT_EXCEEDED`, `MODEL_TOKEN_LIMIT_EXCEEDED`, `PROVIDER_TOKEN_LIMIT_EXCEEDED`, `PROVIDER_HEADER_LIMIT_EXCEEDED` | Kiểm quota model/chung/header và cửa sổ UTC. Chỉ route khác đã được cấp quyền mới có thể được thử. |
| `BUDGET_STORAGE_UNAVAILABLE` | Khôi phục kết nối/schema PostgreSQL; giữ reservation đã có. |
| `BLOCKED` / `INPUT_INJECTION_DETECTED` | Xem nhãn `input_guard`; tái hiện bằng fixture đã loại dữ liệu riêng để owner kiểm false positive. |
| `REQUEST_DEADLINE`, `CONTEXT_LIMIT`, `OUTPUT_VALIDATION_FAILED`, `PROVIDER_UNAVAILABLE`, `PROVIDER_CONFIGURATION_OR_RESPONSE_ERROR` | Ghi request ID, model, attempts/guard_attempts và latency; đối chiếu transport/citation/độ dài. Không tự tăng cap/timeout để thử vô hạn. |

`degraded_reason` thuộc `answer`, tách khỏi lỗi HTTP. `attempts` gồm guard + chat, `guard_attempts` là phần guard. Cache hit trả attempts/token/latency bằng 0 cho lượt hiện tại. Kiểm output là lớp kỹ thuật, không chứng minh mọi giải thích đúng khoa học.

## 5. Khi RAG/Dataset bàn giao

Khóa revision corpus/registry/model và hash bộ câu hỏi; xác nhận quyền gửi, quota đúng ngày UTC và ngân sách sự kiện còn lại. Chạy [benchmark preflight](LIVE-LLM-EVALUATION.md) trước; chỉ dùng `--execute` trong lượt thực sự được cấp khi hết blocking reasons. Benchmark runner có receipt riêng, không chứng minh Tutor web đã sẵn sàng live. Khi có sự cố, tắt live/cap 0, khởi động lại API và kiểm status/template; giữ audit/reservation để đối chiếu.
