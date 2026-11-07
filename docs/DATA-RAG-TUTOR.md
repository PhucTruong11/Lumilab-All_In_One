# RAG và Lumi Tutor trong repo B

Hướng dẫn được chuyển và cập nhật từ [runbook RAG/Tutor của A](https://github.com/PhucTruong11/lumilab/blob/f5f233f8dc2ee21934e6b77c740e7959fecb102a/docs/DATA-RAG-TUTOR.md) theo code và dataset B. [Danh mục bài và nguồn nhóm đã chọn](DATASET.md)

## Luồng có sẵn

1. Danh mục nguồn nằm ở `knowledge/pipeline/sources.json`. Corpus ở `knowledge/retrieval/documents.json` có phiên bản, trạng thái duyệt và nguồn tham chiếu. Tách quyền tham chiếu, quyền lập chỉ mục và quyền gửi dữ liệu tới provider.
2. `data_cli` lint và build artifact retrieval. Bộ truy xuất hỗ trợ lexical/vector local và hybrid qua artifact khi được nạp. Hash là lựa chọn mặc định cho chạy offline. Truy xuất semantic cần model và artifact tương ứng. [Dependencies tùy chọn](../docker/requirements-data-optional.txt)
3. `POST /api/v1/retrieval/query` nhận mã runtime, truy vấn và bộ lọc. Bật `include_drafts` khi kiểm nội bộ. Điểm truy xuất dùng để xếp hạng. Verify vẫn quyết định trạng thái khoa học từ mô hình và bằng chứng đã duyệt. [Contract](CONTRACT.md)
4. Tutor qua `POST /api/v1/sessions/{session_id}/tutor` cần phiên hợp lệ. API kiểm quyền đối với lượt chạy tham chiếu, dựng context và trả template hoặc đi qua gateway theo cấu hình. [Điều kiện LLM](LLM-DATA-REVIEW.md)

## Kiểm local

Từ root B, sau khi cài API dev theo [README](../README.md), chạy:

```powershell
.\.venv\Scripts\python.exe -m lumilab_api.data_cli lint --include-drafts
.\.venv\Scripts\python.exe -m lumilab_api.data_cli build --include-drafts --output .local/retrieval/index.json
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_data_rag_gateway.py apps/api/tests/test_vector_retrieval.py apps/api/tests/test_tutor_context.py -q
```

`.local/retrieval/index.json` là kết quả build nội bộ. Giữ `LUMILAB_LLM_ENABLED=false` và `LUMILAB_LLM_EVENT_CAP=0` khi kiểm offline. Kiểm trạng thái thực qua `GET /api/v1/tutor/status`.

## Áp dụng cho dataset B

Chốt ánh xạ mã kiến thức sang ID runtime theo từng bài. Giữ thẻ nháp trong luồng thử nội bộ cho tới khi người phụ trách khoa học xác nhận nội dung và có căn cứ sử dụng nguồn. Bộ câu hỏi mẫu của con lắc dùng để kiểm kết quả truy xuất và rubric Tutor. [Bản nháp con lắc](../knowledge/pendulum.draft.json) · [Câu hỏi mẫu](../tests/pendulum-dataset.sample.json) · [Kế hoạch tích hợp](tasks/DATASET-VERIFY-UI-PLAN.md)
