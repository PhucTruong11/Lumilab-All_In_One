# Cache Correctness Report — Lumilab-All_In_One (PHASE VII, Stage 2)

**Đối tượng:** `Gateway.cache` trong `apps/api/src/lumilab_api/llm_gateway.py` @ baseline `1f43bbae`.
**Kết luận:** Cache đã đúng trên mọi chiều được kiểm tra. **Không sửa production code.** Bổ sung 13 test chuyên biệt tại `apps/api/tests/test_cache_correctness.py` — **13/13 pass** (cộng với test cache sẵn có `test_gateway_validated_response_cache_and_session_isolation` trong `test_data_rag_gateway.py`).

## 1. Cache key gồm những gì (đọc trực tiếp source)

`cache_key = sha256(json([session_id, PROMPT_VERSION, skill_revision, registry.revision, [route.model_dump() …], messages]))`

| Chiều yêu cầu | Trong key? | Cơ chế |
|---|---|---|
| Session isolation | ✅ | `session_id` là phần tử đầu tiên của key |
| Model/provider thực tế | ✅ | Toàn bộ `Route` (gồm `provider`, `model`, role, priority…) được dump vào key; thứ tự route sau sort quyết định danh sách |
| Temperature | ⚪ Không áp dụng | `Route` không có trường temperature (`extra="forbid"`, xác nhận bằng test `test_route_has_no_temperature_parameter`); temperature là hằng số phía provider, không phải input runtime → không thể gây lẫn cache |
| System prompt fingerprint | ✅ | System prompt được lắp từ skill files; `skill_revision` (hash nội dung skill) nằm trong key |
| Prompt version | ✅ | `PROMPT_VERSION = "lumi-seven-blocks-v4-context-guard"` |
| Subject (lab/topic) | ✅ | Qua `messages` — prompt chứa task (lab_id, question, mode) |
| RAG context hash | ✅ | Qua `messages` — prompt nhúng toàn văn các đoạn nguồn đã truy hồi; đổi nguồn ⇒ đổi key (test riêng) |
| History | ✅ | Qua `messages` (test riêng) |
| Phiên bản corpus/quyền nguồn | ✅ | `registry.revision` trong key |

## 2. Thứ tự guard/cache và chính sách ghi (đọc trực tiếp source)

1. Chặn injection cục bộ (`local_attack`) chạy **trước** mọi thứ → BLOCKED, không chạm cache/provider.
2. Kiểm tra scope, nguồn rỗng, `llm_enabled`, **review status + quyền gửi provider của từng nguồn** — đều trước cache.
3. Đọc cache: chỉ khi `prompt_guard_enabled=False`. **Guard bật ⇒ bỏ qua cache read** (bypass policy được giữ nguyên).
4. Remote prompt guard chạy sau cache read; kết quả BLOCKED không bao giờ được ghi cache.
5. Chỉ ghi cache **sau** `validate_output` thành công và budget `finish(outcome="accepted")`. Provider error, budget denied, validation failure, fallback lỗi → trả template, **không ghi cache** (có test cho từng trường hợp).
6. Cấu trúc giữ nguyên theo yêu cầu: in-memory `OrderedDict`, **LRU 128**, **TTL 600s** (settings `llm_cache_ttl_seconds`), khóa `Lock` khi đọc/ghi.

## 3. Test đã bổ sung (13) và kết quả

| Test | Chiều kiểm chứng | Kết quả |
|---|---|---|
| test_cache_miss_when_question_changes | Đổi câu hỏi → miss | ✅ |
| test_cache_miss_when_history_changes | Đổi history → miss | ✅ |
| test_cache_miss_when_model_changes | Đổi model → miss | ✅ |
| test_cache_key_includes_routes_so_provider_change_misses | Đổi provider → miss | ✅ |
| test_cache_miss_when_rag_context_changes | Đổi nguồn RAG → miss | ✅ |
| test_cache_ttl_expiry | Hit ở 599s, miss ở 601s (đồng hồ giả lập) | ✅ |
| test_cache_lru_capacity_and_eviction_order | Đủ 128 mục; chạm mục cũ nhất → mục kề cũ nhất bị eviction trước | ✅ |
| test_prompt_guard_enabled_bypasses_cache_read | Guard bật → hai lần gọi đều qua provider | ✅ |
| test_provider_failure_is_not_cached | Lỗi provider lần 1 không cache; lần 2 llm; lần 3 cache | ✅ |
| test_budget_denied_is_not_cached | Budget denied không cache; mở budget → llm → cache | ✅ |
| test_output_validation_failure_is_not_cached | Output sai validation không cache | ✅ |
| test_injection_blocked_request_never_reaches_cache_or_provider | BLOCKED hai lần, provider 0 lần gọi, cache rỗng | ✅ |
| test_route_has_no_temperature_parameter | Temperature không phải biến runtime | ✅ |

Lệnh chạy: `python -m pytest apps/api/tests/test_cache_correctness.py -q` → **13 passed**.
Ghi chú trung thực: các fixture "reviewed" trong test là biến đổi trong bộ nhớ trên object tải từ corpus (theo đúng mẫu fixture sẵn có của repo, có ghi rõ trong docstring) — không ghi xuống đĩa, không phải bằng chứng duyệt thật.
