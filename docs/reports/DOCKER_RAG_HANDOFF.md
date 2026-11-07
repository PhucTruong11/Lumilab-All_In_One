# Docker RAG Handoff — Lumilab-All_In_One (PHASE VII, Stage 6)

**Trạng thái kiểm chứng:** Cấu hình được đọc và đối chiếu trực tiếp tại baseline `1f43bbae` (và xác nhận không đổi tại HEAD `d94d2e59`). **Docker build/smoke: NOT RUN trong môi trường của Muse** (không có Docker Engine) — đội dự án đã tự nghiệm thu stack local ngày 07/11/2026 theo `docs/STATUS.md` của repo. Quy trình dưới đây để chủ dự án chạy lại trên máy nghiệm thu.

## 1. Cấu hình đã xác minh (không hard-code thêm)

| Hạng mục | Giá trị tại baseline | Nguồn |
|---|---|---|
| Compose project | `lumilab-b-dev` | `docker/compose.yml` |
| Web | build `docker/web.Dockerfile` (Node 24 → nginx, proxy `/api/`) | cổng host **5175** |
| API | build `docker/api.Dockerfile` (python:3.13-slim, user không-root, chạy `run_schema` rồi uvicorn **1 worker**) | cổng host **8002** |
| DB | `postgres:17-alpine`, volume `postgres_data` | cổng host **15434** |
| Chroma | image `chromadb/chroma:1.3.0`, **profile `rag`** (không chạy mặc định), volume `chroma_data` | cổng 8003 khi bật profile |
| LLM mặc định | `LUMILAB_LLM_ENABLED=false`, `LUMILAB_LLM_EVENT_CAP=0` (ghi cứng trong compose) | giữ nguyên |
| RAG trong image API | `api.Dockerfile` build sẵn artifact **draft** (`--include-drafts`) vào `/workspace/retrieval-index/index.json` và đặt `LUMILAB_RAG_ARTIFACT_PATH` | xem cảnh báo §3 |

Mọi cổng/biến đều override được qua `docker/.env` (từ `docker/.env.example`) truyền tường minh bằng `--env-file` — không có giá trị nào bị hard-code ngoài các mặc định an toàn trên.

## 2. Quy trình nghiệm thu trên máy chủ dự án (copy-paste)

```bash
git clone https://github.com/PhucTruong11/Lumilab-All_In_One.git
cd Lumilab-All_In_One && git checkout main
docker compose -f docker/compose.yml config --quiet
docker compose -f docker/compose.yml up -d --build --wait web
docker compose -f docker/compose.yml ps        # db, api, web = healthy
curl -s http://127.0.0.1:5175/healthz
curl -s http://127.0.0.1:8002/ready
curl -s -X POST http://127.0.0.1:8002/api/v1/retrieval/query \
  -H 'Content-Type: application/json' \
  -d '{"lab_id":"pendulum","query":"khối lượng chu kỳ","retrieval_method":"hybrid"}'
# Kỳ vọng: status FOUND, retrieval_method local-hybrid-hash (artifact draft trong image)
docker compose -f docker/compose.yml stop     # dừng, GIỮ volume
```

**Không chạy `docker compose down -v`** (xóa volume dữ liệu). Không xóa `postgres_data`/`chroma_data` khi xử lý sự cố.

## 3. RAG trong Docker — những điểm phải biết

1. **Artifact trong image là DRAFT** (build với `--include-drafts` theo `api.Dockerfile` hiện tại). Đây là lựa chọn của repo cho stack dev local; retrieval qua API vẫn tôn trọng `include_drafts` theo từng request — client gửi `include_drafts=false` sẽ nhận `NO_MATCH` với corpus hiện tại (đã kiểm chứng bằng test tại Stage 3).
2. **Production chỉ index dữ liệu reviewed:** khi có corpus reviewed, quy trình đúng là build artifact bằng `python -m lumilab_api.data_cli build` (không `--include-drafts`) → artifact 0 chunks với corpus hiện tại, tăng dần khi nguồn được duyệt thật. Fingerprint của artifact thay đổi theo corpus + embedding (`embedding_id` được kiểm tra khớp khi nạp — `CompiledIndex` từ chối artifact lệch phiên bản model).
3. **Bật/tắt RAG bằng env:** `LUMILAB_RAG_ENABLED` + `LUMILAB_RAG_ARTIFACT_PATH` theo `settings.py`/`.env.example`; đường hybrid trả 503 `LOCAL_INDEX_UNAVAILABLE` khi không có artifact — hành vi fail-closed đúng thiết kế.
4. **Chroma là tùy chọn:** chỉ cần khi chọn `LUMILAB_RETRIEVAL_STORE=chroma`/profile `rag`; lát cắt hiện tại chạy tốt bằng local index in-memory.
5. **Benchmark/demo:** giữ 1 worker (mặc định của compose) để số liệu cache/retrieval tái lập được.
