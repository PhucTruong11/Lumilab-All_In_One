# RAG-02 — Chuẩn hóa học liệu Con lắc: ba trục quyền tách biệt

**Nguyên tắc áp dụng:** Không viết lại nội dung khoa học; không nâng `draft` → `reviewed`; không giả chữ ký; không bỏ qua provenance validation. Task này *kiểm chứng và ghi rõ* trạng thái chuẩn hóa hiện tại của từng chunk theo đúng schema của repo, thay vì thay đổi nội dung.

## 1. Ba trục trạng thái/quyền — định nghĩa theo source của repo

| Trục | Trường/nguồn sự thật trong repo | Ý nghĩa |
|---|---|---|
| **A. Scientific Review Status** | `Document.review_status` (`draft`/`cross_checked`/`reviewed`) + `reviewer`/`reviewed_at` + `provenance.academic_review_role` (phải là `teacher` cho thẻ reviewed mới) + `provenance.curriculum_status` | Nội dung khoa học đã được giáo viên duyệt hay chưa. Model tự khóa: `reviewed` thiếu chữ ký/ngày → `ValidationError` |
| **B. Indexing Permission** | `Registry.source(...).permits("index", commercial, include_drafts)` — kết hợp `rights_status` + `allowed_uses` của nguồn, cờ draft và cờ commercial | Chunk có được vào index và được trả về cho một truy vấn cụ thể hay không |
| **C. Provider Submission Permission** | `Registry.source(...).permits("send_llm")`, gateway kiểm tra độc lập cho **từng** hit trước khi gọi provider | Chunk có được gửi ra LLM provider bên ngoài hay không — tách hẳn khỏi quyền index |

Ba trục độc lập trong code thật: một chunk có thể được index (B=Có cho luồng nội bộ) nhưng **không** được gửi provider (C=Không) và chưa được duyệt khoa học (A=draft) — đó chính là trạng thái hiện tại của toàn bộ chunk con lắc.

## 2. Bảng chuẩn hóa theo chunk

| Chunk ID | Nội dung chuẩn hóa | Source | Scientific Review | Index Permission | Provider Permission |
|---|---|---|---|---|---|
| pendulum-overview:0 | Khối lượng không đổi chu kỳ (giữ L, g); điều kiện góc nhỏ | lumilab-authored | draft (curriculum: pending) | Có — nội bộ kèm draft; **Không** ở production (`include_drafts=False` → 0 hits) | **Không** — `allowed_uses=[convert, index]`, thiếu `send_llm` |
| pendulum-thcs-foundation:0 | Quan sát chu kỳ, nền tảng THCS | lumilab-authored | draft (pending) | Có — nội bộ kèm draft, đúng level THCS; Không ở production | **Không** |
| ctst-period-measure:0 | Đo chu kỳ bằng nhiều dao động (T = t/N), giảm sai số | lumilab-authored | draft (pending) | Có — nội bộ kèm draft; Không ở production | **Không** |
| ctst-pendulum-limits:0 | Đổi đúng một yếu tố; giới hạn góc nhỏ của mô hình | lumilab-authored | draft (pending) | Có — nội bộ kèm draft; Không ở production | **Không** |

Bản ghi dataset `CONLAC-CHUKY-01` (VL-CONLAC-01, nguồn SGK NXB-VL11 + OpenStax): Scientific Review = draft; Index Permission = **Không** (chưa ingest vào corpus; nguồn đang `reference-only`, `rights_review=pending`); Provider Permission = **Không**. Giữ nguyên ngoài corpus cho tới khi có quyết định quyền + duyệt của nhóm.

## 3. Đối chiếu nội dung khoa học với runtime/formula trong code (chỉ kiểm tra, không sửa)

- Chu kỳ `T ≈ 2π√(L/g)` trong DATASET.md §1 và bản ghi draft — khớp công thức mô hình con lắc của lab engine (góc nhỏ).
- Điều kiện góc nhỏ được nêu nhất quán ở DATASET, chunk `ctst-pendulum-limits` và giới hạn mô hình của runtime lab.
- Năng lượng `U = mgL(1 − cos θ)` được DATASET ghi với mốc thế năng tại vị trí thấp nhất — là nội dung thuộc phạm vi duyệt của nhóm biên soạn; Muse không tự sửa nội dung này.
- Mọi chunk đều có provenance đầy đủ (source_id, book, chapter, section, license, commit) và qua được validation của `CompiledIndex` khi nạp artifact (content hash + registry identity đều khớp — artifact build và load thành công trong các test).

## 4. Kiểm chứng acceptance (chạy thật tại baseline)

| Tiêu chí | Kết quả |
|---|---|
| Data lint PASS | ✅ `data_cli lint --include-drafts` đạt; 12 warning `SECOND_INDEPENDENT_SOURCE_PENDING` (gồm `pendulum-overview`) — cảnh báo thiếu nguồn độc lập thứ hai, không phải lỗi |
| Data build PASS | ✅ `data_cli build --include-drafts` → 30 chunks, fingerprint `12c66451d323…` |
| Schema metadata hợp lệ | ✅ Corpus qua `Corpus.model_validate` + lint; artifact qua kiểm chứng toàn vẹn của `CompiledIndex` |
| Chunk chưa duyệt không vào production retrieval | ✅ Truy vấn với `include_drafts=False` trả 0 hits (test sẵn có của repo xác nhận cho pendulum) |
| Quyền index và quyền gửi provider kiểm tra độc lập | ✅ Hai lời gọi `permits("index")` / `permits("send_llm")` riêng biệt trong retrieval và gateway; toàn bộ chunk con lắc: index=Có (nội bộ), send_llm=Không |
| Truy ngược về nguồn ban đầu | ✅ Bảng §2 + provenance trong artifact |

**Giới hạn còn lại (cần nhóm dự án, không phải code):** duyệt khoa học bởi giáo viên (trục A), bổ sung nguồn độc lập thứ hai cho `pendulum-overview`, và quyết định quyền đối với nguồn SGK (trục B/C cho bản ghi CONLAC-CHUKY-01). Cho tới khi đó, Tutor production với nguồn con lắc sẽ dừng ở `REVIEWED_SOURCES_REQUIRED` — đúng thiết kế.
