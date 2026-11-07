# RAG-01 — Scope Alignment: học liệu ↔ runtime lab

**Repository:** `PhucTruong11/Lumilab-All_In_One` @ `main`, baseline `1f43bbae`.

## 1. Mapping VL-CONLAC-01 → pendulum: XÁC MINH từ ba nguồn độc lập trong repo

| Nguồn bằng chứng | Nội dung |
|---|---|
| `docs/DATASET.md` §1 (bản 0.4, trạng thái draft) | "Con lắc đơn — `VL-CONLAC-01`": kiến thức chu kỳ/góc nhỏ/năng lượng; SGK Vật lí 11 (KNTT) Bài 1 tr. 6–7, Bài 5 tr. 22–23; OpenStax UP1 §15.4. Mọi nguồn ở trạng thái `reference-only`, quyền đưa vào corpus = `pending` |
| `knowledge/pendulum.draft.json` | Một bản ghi dataset độc lập `CONLAC-CHUKY-01` mang `knowledge_id: "VL-CONLAC-01"`, `sources`: NXB-VL11 (Bài 2, mục I, trang in 10) + OS-UP1 (§15.4); `science_review: draft`, `rights_review: pending`, `reviewed_by: null` |
| Runtime catalog `packages/lab-engine/labs/catalog.json` | `"active": [..., "pendulum", ...]` — `pendulum` là 1 trong 9 lab đang hoạt động; thư mục `packages/lab-engine/labs/pendulum/lab.json` tồn tại |

**Kết luận mapping:** `VL-CONLAC-01` (định danh học liệu trong DATASET) ↔ lab runtime `pendulum` ↔ `lab_id="pendulum"` trong corpus retrieval. ✔

## 2. Hai dòng nội dung con lắc KHÁC NHAU — không được gộp

| Dòng nội dung | Vị trí | Nguồn gốc | Trạng thái | Đã vào retrieval corpus? |
|---|---|---|---|---|
| (a) Bản ghi dataset `CONLAC-CHUKY-01` | `knowledge/pendulum.draft.json` | SGK Vật lí 11 (NXB-VL11) + OpenStax, `reference-only` | science_review=draft, rights_review=pending | **Chưa** — file staging độc lập, không nằm trong `documents.json` |
| (b) 4 thẻ học liệu tự biên soạn | `knowledge/retrieval/documents.json` | `lumilab-authored` (dự án tự viết) | review_status=draft, curriculum_status=pending | **Rồi** — là toàn bộ nội dung con lắc mà retrieval hiện truy hồi |

Hai dòng này có provenance hoàn toàn riêng; báo cáo này giữ nguyên sự tách biệt đó. Việc (a) chưa được ingest là đúng quy tắc quyền: nguồn SGK đang `reference-only`/`pending`.

## 3. Bảng chunk con lắc trong corpus (artifact build `--include-drafts`, 30 chunks tổng)

| Chunk ID | Source | Book | Grade | Topic | Runtime Lab | Citation Purpose | Review Status |
|---|---|---|---|---|---|---|---|
| pendulum-overview:0 | lumilab-authored | LumiLab học liệu tự biên soạn | THPT | Khối lượng và chu kỳ con lắc | pendulum | convert, index (KHÔNG gồm send_llm) | draft |
| pendulum-thcs-foundation:0 | lumilab-authored | LumiLab học liệu tự biên soạn | THCS | Quan sát chu kỳ con lắc (nền tảng) | pendulum | convert, index | draft |
| ctst-period-measure:0 | lumilab-authored | LumiLab — học liệu tự biên soạn (CTST) | THPT | Đọc chu kỳ từ nhiều dao động | pendulum | convert, index | draft |
| ctst-pendulum-limits:0 | lumilab-authored | LumiLab — học liệu tự biên soạn (CTST) | THPT | Đổi một yếu tố, giới hạn góc nhỏ | pendulum | convert, index | draft |

Môn học của cả 4 chunk: Vật lí (suy ra từ lab pendulum + provenance). Ngôn ngữ: `vi` (provenance.source_language). Mỗi document là một đoạn văn duy nhất → đúng 1 chunk/document.

## 4. Kiểm chứng hành vi lọc (chạy thật, không suy đoán)

- Bộ test sẵn có của repo (`test_data_rag_gateway.py`) đã xác minh và đạt: truy vấn hybrid với `lab_id=pendulum` chỉ trả chunk thuộc pendulum; đổi `level=THCS` chỉ trả tài liệu THCS; `include_drafts=False` hoặc `commercial=True` → **0 hits** (đúng kỳ vọng khi mọi chunk đều draft). Toàn bộ 508 test backend đạt tại baseline, gồm các test này.
- Đánh giá mở rộng ở RAG-03 (paraphrase/wrong-lab/out-of-scope) tiếp tục kiểm tra tiêu chí "không trả chunk của lab khác vì từ khóa tương tự" bằng Correct Refusal Rate và danh sách wrong-lab cụ thể.

## 5. Quan sát phụ (không sửa trong task này)

Corpus chứa tài liệu cho cả 2 lab đã lưu trữ (`electrochemistry`, `atomic`) dù catalog chỉ kích hoạt 9 lab — retrieval vẫn lọc theo `lab_id` được yêu cầu nên không gây rò rỉ chéo khi truy vấn đúng lab; nên rà soát ở đợt dọn corpus sau.

**Acceptance RAG-01:** Mapping ✔ · Lọc đúng lab/bậc học ✔ (test sẵn có + RAG-03) · Truy ngược được nguồn gốc từng chunk ✔ (bảng §3) · Provenance của hai dòng nội dung giữ riêng ✔ · Không gộp nguồn ✔.
