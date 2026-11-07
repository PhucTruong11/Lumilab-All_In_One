# TUTOR-03 — LLM Pilot Report

## Giai đoạn A — Mock Provider: ✅ PASS

Script `scripts/tutor_pilot_mock.py`, kết quả `knowledge/evaluation/results/tutor_pilot_mock.json`. Cùng bộ 3 câu hỏi con lắc (hint/explanation/qa), cùng ngữ cảnh truy hồi, so sánh template ↔ mock provider qua chính `Gateway` production. **Kết quả mock không được dùng để tuyên bố LLM thật đã hoạt động.**

| Case nghiệm thu | Expected | Actual (đo thật) |
|---|---|---|
| 1. Provider success | Response hợp lệ, citation thuộc nguồn đã cấp, trạng thái guidance | Mock trả `response_source=llm`, `status=DRAFT_GUIDANCE`, citation = chunk nguồn thật, `citation_valid=true` ở cả 3 câu; template cùng câu hỏi trả `template/LIVE_DISABLED` với cùng citation nền |
| 2. Provider error | Fallback template, không giả thành công | `response_source=template`, `degraded_reason=PROVIDER_CONFIGURATION_OR_RESPONSE_ERROR` |
| 3. Budget exhausted | Gateway từ chối gọi provider, fallback template | `response_source=template`, `degraded_reason=LIMIT`, provider không được gọi thêm |
| 4. Source restriction | Chunk draft/không có quyền `send_llm` không rời máy | Nguồn draft thật → `REVIEWED_SOURCES_REQUIRED`; provider factory không được khởi tạo |

Rubric con lắc áp cho mock: câu trả lời mock dẫn dắt theo đúng thao tác thực nghiệm (giữ L và nơi đo, chỉ thay khối lượng), không chèn số đo mới, citation khớp chunk `pendulum-overview:0`.

## Giai đoạn B — Live Provider Pilot: 🔴 BLOCKED (đúng điều kiện)

Chưa chạy, vì **chưa đủ điều kiện tiên quyết** theo Addendum:
- Chưa có nguồn học liệu nào ở trạng thái được phép gửi provider (toàn corpus: `review_status=draft`, `allowed_uses` không gồm `send_llm` — xem RAG-02).
- Chưa có phê duyệt ngân sách/API key từ chủ dự án cho pilot (việc mở khóa PHASE VII không đồng nghĩa cho phép chi phí API).
- Route/model live chưa được chủ dự án chỉ định cho pilot.

Điều kiện để mở Giai đoạn B: (1) ít nhất một nguồn được duyệt + cấp quyền `send_llm` bởi nhóm dự án; (2) chủ dự án cấp key + trần ngân sách + giới hạn request cho môi trường kiểm thử; (3) giữ nguyên fallback template và các cổng guard/budget hiện có. Khi đủ điều kiện, pilot chạy lại đúng bộ câu hỏi và rubric của Giai đoạn A để đối chứng.
