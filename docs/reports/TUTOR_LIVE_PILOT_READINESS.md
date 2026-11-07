# PHASE D — Tutor Live Pilot Readiness

**Trạng thái: BLOCKED (giữ nguyên theo chỉ đạo).** Chưa chạy provider live. Tài liệu này là phần chuẩn bị: checklist duyệt nguồn, danh sách nguồn cần xác nhận, quy trình xin quyền và lệnh pilot dự thảo.

## 1. Điều kiện tiên quyết — trạng thái hiện tại
| Điều kiện | Trạng thái |
|---|---|
| Có ≥ 1 nguồn được duyệt khoa học (reviewed) | ❌ Corpus 30/30 draft |
| Nguồn có quyền `send_llm` | ❌ 0/30 (kể cả 4 thẻ con lắc: `lumilab-authored` chỉ có `convert, index`) |
| Nguồn độc lập thứ hai cho các thẻ | ❌ 12 cảnh báo `SECOND_INDEPENDENT_SOURCE_PENDING` ở lint |
| API key + trần ngân sách do chủ dự án cấp | ❌ Chưa cấp |
| Route/model được chỉ định cho pilot | ❌ Chưa chỉ định (settings hiện ghi `gemini-3.5-flash-lite` nhưng đó là mặc định cấu hình, không phải chỉ định pilot) |

## 2. Checklist duyệt nguồn (cho nhóm dự án/giáo viên)
Với mỗi tài liệu muốn đưa vào pilot:
1. **Duyệt khoa học (science review):** người duyệt có tên thật ký vào metadata (`reviewed_by`, ngày) — quy định trong `knowledge/AGENTS.md`: không được ghi danh tính/ngày giả; draft không dùng để tuyên bố VERIFIED.
2. **Duyệt bản quyền (rights review):** xác nhận quyền sử dụng; riêng bản ghi SGK `CONLAC-CHUKY-01` (NXB Giáo dục, trích đoạn ngắn, `educational_reference_only`, còn `pending`) cần quyết định rõ: tài liệu **reference-only không được gửi ra provider** — chỉ dùng đối chiếu nội bộ.
3. **Cấp quyền sử dụng:** bổ sung `send_llm` vào `allowed_uses` của source trong registry đối với các nguồn tự biên soạn (`lumilab-authored`) sau khi đã duyệt 1–2.
4. **Nguồn thứ hai:** bổ sung nguồn độc lập đối chiếu cho các thẻ đang có cảnh báo lint (danh sách ở mục 3).
5. **Build lại corpus/artifact:** `data_cli lint` sạch cảnh báo tương ứng, `build` (không `--include-drafts` cho production) và kiểm chứng `include_drafts=false` truy hồi được các chunk đã duyệt.

## 3. Nguồn cần xác nhận trước tiên (phạm vi pilot con lắc)
- 4 thẻ corpus con lắc: `pendulum-overview`, `pendulum-thcs-foundation`, `ctst-period-measure`, `ctst-pendulum-limits` (đều `lumilab-authored`, draft) — cần duyệt khoa học + cấp `send_llm`.
- Bản ghi dataset `CONLAC-CHUKY-01` (SGK Vật lí 11 NXB + OpenStax §15.4): giữ reference-only; dùng làm căn cứ đối chiếu khi duyệt 4 thẻ trên.
- 12 thẻ toàn corpus đang thiếu nguồn độc lập thứ hai (theo lint) — chỉ xử lý các thẻ thuộc phạm vi pilot trước.

## 4. Lệnh pilot dự thảo (chỉ chạy khi đủ điều kiện ở mục 1)
```powershell
# Môi trường kiểm thử riêng, KHÔNG phải production:
$env:LUMILAB_LLM_ENABLED = "true"
$env:LUMILAB_LLM_EVENT_CAP = "<chủ dự án cấp>"        # số sự kiện tối đa cho pilot
$env:LUMILAB_LLM_DAILY_BUDGET_USD = "<chủ dự án cấp>" # trần chi phí ngày
$env:LUMILAB_LLM_ROUTE = "<route/model được chỉ định>"
# Chạy lại đúng bộ câu hỏi + rubric của Giai đoạn A (scripts/tutor_pilot_mock.py)
# với provider thật trên môi trường kiểm thử; đối chiếu citation/guard/budget.
```
Giới hạn chi phí: ngân sách do chủ dự án đặt trong cấu hình trên; Gateway đã có sẵn cơ chế đếm sự kiện + trần ngày + fallback template khi vượt — pilot không được nới các cổng này.

## 5. Những việc bị cấm trong giai đoạn này (đang tuân thủ)
Không giả chữ ký/ngày duyệt; không nâng draft → reviewed; không bật LLM production; không gọi provider trả phí; không gửi tài liệu reference-only ra ngoài.
