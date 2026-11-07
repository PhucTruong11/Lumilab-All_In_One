# PHASE VII — Stage 1: Source Re-audit (chỉ phạm vi RAG/cache)

**Repository:** `PhucTruong11/Lumilab-All_In_One`, branch `main`.
**Baseline được chủ dự án chốt:** `1f43bbae7771dea2d7d8f590e1a242d8b3bc6c1e` (Merge PR #8, 2026-11-07T07:50:44Z) — đã resolve SHA đầy đủ và xác nhận thuộc lịch sử `main`.
**HEAD của main tại thời điểm bắt đầu PHASE VII:** `d94d2e59138955a8cec4e5326ec44195b8c9277b` (Merge PR #10 từ `chore/transfer-rag-…`, 08:16:26Z), đi qua commit `2a7c47ca` "chore: transfer RAG guides and project tooling".
**Kiểm tra ảnh hưởng của phần thay đổi sau baseline:** Tải lại 18 file thuộc phạm vi RAG/cache/Docker/corpus tại HEAD hiện tại và so sánh từng byte với bản sao làm việc — **18/18 giống hệt** (llm_gateway, hybrid_retrieval, retrieval, vector_index, bm25_index, settings, evaluation, benchmark_runner, live_system_eval, data_pipeline, main, verifier, compose, api.Dockerfile, documents.json, pyproject, ci.yml, STATUS.md). Kết luận: PR #9/#10 chỉ chạm tài liệu/tooling ngoài phạm vi code RAG/cache → **không cần re-audit mở rộng**; baseline nội dung cho PHASE VII = `1f43bbae` ≡ HEAD hiện tại đối với mọi file trong phạm vi.

## 1. Bản đồ tái sử dụng (đọc trực tiếp source tại baseline)

| Thành phần | File tại baseline | Kết luận audit |
|---|---|---|
| Hybrid retrieval (production) | `apps/api/src/lumilab_api/hybrid_retrieval.py` — `CompiledIndex` | Kiểm chứng toàn vẹn artifact (fingerprint = digest, schema `retrieval-artifact-1.0`, registry hash, content hash từng chunk, provenance khớp registry). Hợp nhất bằng **RRF hạng, k=60**, lấy tối đa **3 hits**; cổng lexical: BM25 ≥ `min_bm25` và coverage ≥ 0.4; cổng vector: cosine ≥ `min_cosine` và coverage > 0 nếu semantic (≥ 0.4 nếu hash). **Không tồn tại trọng số tuyến tính lexical/vector trong production** — hệ quả cho Stage 4 xem §3 |
| Truy hồi lexical/vector/hybrid (API) | `retrieval.py` — `retrieval_router`, `POST /api/v1/retrieval/query` | Contract xác nhận từ source: body `RetrievalQuery{lab_id, query, include_drafts=true, retrieval_method=lexical|vector|hybrid, level, commercial}`; hybrid thiếu index → 503 `LOCAL_INDEX_UNAVAILABLE`; 404 khi lab lạ. Ba chế độ đều có thật |
| BM25 | `bm25_index.py` — `BM25Index.build/.rank/.coverage` | Dùng chung cho gateway evaluation và CompiledIndex; profile từ vựng song ngữ ở `retrieval_terms.PROFILE` |
| Vector | `vector_index.py` — `HashEmbedding` (`token-hash-v1-{dim}`, semantic=False), `SentenceTransformerEmbedding` (semantic=True, hỗ trợ họ e5 qua prefix query/passage), `LocalVectorIndex`, `MemoryVectorStore`, `ChromaVectorStore` | Mặc định của repo là **hash** (không tải model, không gọi ngoài) theo `.env.example`; e5 là tùy chọn có sẵn, không cần viết mới |
| Cache | `llm_gateway.py` — `class Gateway` (L122), `self.cache = OrderedDict()` (L128) | Xem phân tích chi tiết ở Stage 2 (`CACHE_CORRECTNESS_REPORT.md`). Kết luận sớm: không viết lại; chỉ bổ sung test |
| Evaluation | `evaluation.py` — `evaluate_retrieval(index, cases)` | Đã có sẵn khung đánh giá offline theo method (no_rag/bm25/vector/hybrid) với ground truth `relevant_document_ids` — tái sử dụng làm tham chiếu chéo cho Stage 4 |
| Benchmark | `benchmark_runner.py` (preflight/execute qua Gateway thật), `live_system_eval.py` | Benchmark hệ thống có sẵn; benchmark độ trễ cache (Stage 5) là script riêng dùng provider giả lập — không trùng chức năng |
| Data pipeline | `data_pipeline.py` + `data_cli` (lint/build) | Lint đạt (12 warning `SECOND_INDEPENDENT_SOURCE_PENDING`); build draft cho 30 chunks; build reviewed-only cho 0 chunks vì corpus 100% draft |
| Corpus | `knowledge/retrieval/documents.json` | 30 documents, revision `authored-ctst-reference-draft-2026-11-06`, 100% `draft`. Metadata hiện có: `lab_id` (suy ra subject), `provenance.source_id`/`source_language`/`level`, `review_status` — ánh xạ sang yêu cầu metadata của Directive được ghi ở Stage 3 |
| Docker | `docker/compose.yml`, `docker/api.Dockerfile`, `docker/web.Dockerfile` | Compose 4 service; cổng 5175/8002/15434 xác nhận còn đúng tại baseline; api.Dockerfile build sẵn artifact draft vào image |

## 2. Những gì KHÔNG tạo mới (theo lệnh chống trùng lặp)

- Không viết module retrieval/embedding/store mới — đã có đủ.
- Không viết lại cache — đã IMPLEMENTED, chuyển sang kiểm chứng bằng test (Stage 2).
- Không tạo reranker, Redis, hay UI dataset — ngoài phạm vi.

## 3. Điểm cần quyết định kỹ thuật duy nhất: cấu hình hybrid C/D của Stage 4

Directive yêu cầu so sánh "Hybrid lexical 0.3/vector 0.7" và "0.5/0.5", đồng thời lệnh "xác minh chiều trọng số thực tế trong code trước khi chạy". Kết quả xác minh: **production không có trọng số tuyến tính** — `CompiledIndex.retrieve()` hợp nhất theo hạng RRF (k=60) với cổng chất lượng hai phía. Vì vậy Stage 4 sẽ chạy: A = BM25-only, B = Vector-only (cùng cổng của production), **C/D = hợp nhất điểm có trọng số (chuẩn hóa min–max trên từng danh sách, giữ nguyên các cổng)** như cấu hình *thực nghiệm* được ghi nhãn rõ, và thêm hàng tham chiếu **REF = production RRF** đối chiếu qua chính `CompiledIndex.retrieve()` và khung `evaluation.py`. Không sửa production để "ép" trọng số vào.

## 4. Kết luận Stage 1

Phạm vi tái sử dụng: toàn bộ pipeline. Phần cần thêm mới chỉ gồm: test cache chuyên biệt (Stage 2), golden set + script đánh giá (Stage 4), benchmark cache (Stage 5), tài liệu handoff (Stage 6). Không có lỗi production nào được phát hiện ở Stage 1.
