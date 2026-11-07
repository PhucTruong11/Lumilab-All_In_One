# PHASE C — E5 Embedding Feasibility

**Kết luận: PARTIAL** — đường code đã sẵn sàng; việc còn thiếu là cung cấp model + thư viện trên máy đánh giá. Không thay đổi embedding production (`token-hash-v1` vẫn là mặc định).

## 1. Implementation hiện có (đã đọc source)
- `SentenceTransformerEmbedding` (`vector_index.py`): nạp model **chỉ từ thư mục local** (`local_files_only=True`, `device="cpu"`), yêu cầu revision tường minh; thiếu model/dependency → `VectorUnavailable` và hệ thống rơi về lexical an toàn.
- Quy ước e5 đã được cài sẵn: family `"e5"` → truy vấn được encode với tiền tố `"query: "` (vector_index.py:92); độ dài bị cắt theo ngân sách token của model.
- Artifact kiểm tra `embedding_id` khi nạp — đổi embedding đồng nghĩa build lại artifact, fingerprint thay đổi; pipeline đã hỗ trợ qua `data_cli build` với cấu hình embedding.

## 2. Dependency
- `docker/requirements-data-optional.txt`: `sentence-transformers==5.7.0` (kéo theo torch), tách riêng khỏi lock của API/CI — chủ đích của repo là không đưa torch vào CI.
- Môi trường Muse: **không cài được torch** (tải wheel lớn thất bại lặp lại trên mạng hiện tại — cùng giới hạn đã ghi ở các đợt trước). Không ép cài để tránh phá môi trường test đang dùng cho các nghiệm thu khác.

## 3. Tài nguyên ước lượng cho `intfloat/multilingual-e5-small`
| Hạng mục | Ước lượng |
|---|---|
| Tham số / dung lượng model | ~118M tham số; file trọng số ≈ 470 MB (fp32) |
| Torch CPU wheel + sentence-transformers | ≈ 200–900 MB tùy nền tảng/phụ thuộc |
| RAM khi encode | ~1–2 GB (model + runtime) — máy đánh giá nên có ≥ 8 GB trống |
| Tốc độ CPU | Encode câu ngắn ở mức chục ms/câu; build artifact 30 chunk: dưới vài giây sau thời gian nạp model (~vài giây tới ~30 s) |
| Máy Muse hiện tại | 4 CPU nhưng RAM trống < 1 GB tại thời điểm kiểm tra và mạng không tải nổi torch → **không chạy benchmark tại đây** |

## 4. Điều kiện để chạy benchmark (READY khi đủ)
1. Máy trạm của dự án (Windows, nơi đội đã chạy Docker local) cài `requirements-data-optional.txt` trong venv riêng.
2. Tải sẵn thư mục model `multilingual-e5-small` + ghi revision vào cấu hình embedding (mã nguồn không tự tải model — thiết kế fail-closed).
3. Chạy `scripts/rag_evaluation.py` biến thể trỏ embedding sang e5 (cần một cấu hình eval riêng — chưa tạo trong đợt này vì chưa có môi trường kiểm chứng), so sánh cùng 2 golden set với baseline hash hiện tại; giữ held-out làm regression gate.

**Không có thay đổi production nào được đề xuất ở phase này.**
