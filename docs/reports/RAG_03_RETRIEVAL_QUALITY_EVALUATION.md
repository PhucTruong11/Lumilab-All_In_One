# RAG-03 — Retrieval Quality Evaluation (+ PHASE VII Stage 4)

**Thiết lập (tái lập được):** Corpus tại baseline `1f43bbae` — artifact build `--include-drafts` (30 chunks, fingerprint `12c66451d323dab2cc4193e78d4964f5eddfa06bf307c8b456d85ca02d99b881`), embedding mặc định của repo `token-hash-v1` (không tải model, không gọi ngoài), ngưỡng production `min_bm25=0.05`, `min_cosine=0.12`, cổng coverage 0.4. Script: `scripts/rag_evaluation.py` (chạy từ root repo). Kết quả đầy đủ: `knowledge/evaluation/results/rag_eval_{dev,heldout}.{json,csv,md}`.

**Bộ câu hỏi (không dùng LLM judge):**
- Development set `knowledge/evaluation/rag_golden_dev.json`: 24 câu — 16 ANSWERABLE (gồm nhiều paraphrase tiếng Việt cho cùng một chunk), 3 WRONG_LAB, 2 OUT_OF_SCOPE, 3 MISSING_EVIDENCE.
- Held-out regression set `knowledge/evaluation/rag_golden_heldout.json`: 14 câu — 9 ANSWERABLE, 2 WRONG_LAB, 1 OUT_OF_SCOPE, 2 MISSING_EVIDENCE. **Không dùng để tinh chỉnh** — chỉ chạy kiểm tra sau thay đổi.

**Cấu hình:** A = BM25-only · B = Vector-only (hash) · C = hợp nhất điểm có trọng số lexical 0.3/vector 0.7 · D = 0.5/0.5 (C/D là thực nghiệm — production không có trọng số tuyến tính, xem PHASE7_IMPLEMENTATION_AUDIT §3) · REF = production RRF qua `CompiledIndex.retrieve()` (tối đa 3 hits nên Hit@5 của REF = Hit@3).

## 1. Kết quả Development (16 answerable / 8 cần từ chối)

| Config | Hit@1 | Hit@3 | Hit@5 | Recall@1 | Recall@3 | Recall@5 | MRR | CRR |
|---|---|---|---|---|---|---|---|---|
| A BM25 | 0.8125 | 0.9375 | 0.9375 | 0.8125 | 0.9375 | 0.9375 | 0.875 | 0.625 |
| B Vector | 0.7500 | 0.9375 | 0.9375 | 0.7500 | 0.9375 | 0.9375 | 0.8438 | 0.750 |
| C 0.3/0.7 | 0.8125 | 0.9375 | 0.9375 | 0.8125 | 0.9375 | 0.9375 | 0.875 | 0.625 |
| D 0.5/0.5 | 0.8125 | 0.9375 | 0.9375 | 0.8125 | 0.9375 | 0.9375 | 0.875 | 0.625 |
| REF (RRF) | 0.8125 | 0.9375 | 0.9375 | 0.8125 | 0.9375 | 0.9375 | 0.875 | 0.625 |

## 2. Kết quả Held-out (9 answerable / 5 cần từ chối) — không tinh chỉnh trên bộ này

| Config | Hit@1 | Hit@3 | Hit@5 | Recall@1 | Recall@3 | Recall@5 | MRR | CRR |
|---|---|---|---|---|---|---|---|---|
| A BM25 | 0.6667 | 0.7778 | 0.7778 | 0.6667 | 0.7778 | 0.7778 | 0.7222 | 0.800 |
| B Vector | 0.5556 | 0.7778 | 0.7778 | 0.5556 | 0.7778 | 0.7778 | 0.6481 | 0.800 |
| C 0.3/0.7 | 0.5556 | 0.7778 | 0.7778 | 0.5556 | 0.7778 | 0.7778 | 0.6481 | 0.800 |
| D 0.5/0.5 | 0.6667 | 0.7778 | 0.7778 | 0.6667 | 0.7778 | 0.7778 | 0.7037 | 0.800 |
| REF (RRF) | 0.6667 | 0.7778 | 0.7778 | 0.6667 | 0.7778 | 0.7778 | 0.7037 | 0.800 |

**Recall@3** (chỉ số được yêu cầu nhấn mạnh): dev 0.9375 · held-out 0.7778 ở mọi cấu hình. Chênh lệch dev/held-out là khoảng generalization thật, được báo cáo nguyên trạng.

## 3. Phân tích thất bại — từng câu (không chỉ tỷ lệ)

**Trả lời sai khi lẽ ra phải từ chối (false answers):**
- `dev-wronglab-02` (hỏi độ cứng lò xo nhưng `lab_id=pendulum`) và `dev-wronglab-03` (hỏi con lắc nhưng `lab_id=circuit`): mọi cấu hình đều trả chunk của lab được truy vấn. Nguyên nhân cấu trúc: retrieval bị giới hạn phạm vi theo `lab_id` nên không thể "biết" câu hỏi thuộc lab khác; từ vựng dao động/chu kỳ/điện trở chồng lấn đủ qua cổng coverage. Đây là **giới hạn đã biết**: lớp Tutor/API hiện tin vào `lab_id` do client gửi. Khuyến nghị (ngoài phạm vi đợt này): kiểm tra chéo topic ở tầng Tutor hoặc cảnh báo khi độ phủ từ vựng biên.
- `dev-missing-03` (dung dịch đệm — corpus không có): chunk hóa học về pH/chỉ thị khớp từ vựng "pH" nên bị trả về ở mọi cấu hình. Thiếu nguồn nhưng hệ thống vẫn cố trả lời: 1 ca ở dev.
- `ho-missing-01` (dao động tắt dần của lò xo trong dầu — corpus không có): mọi cấu hình trả chunk lò xo gần nhất. Cùng bản chất với missing-03.

**Từ chối nhầm (false refusals):**
- Dev: **0 ca** ở mọi cấu hình.
- Held-out: `ho-cir-01` ("Điện trở càng lớn thì dòng điện… giữ nguyên hiệu điện thế?") bị **mọi cấu hình** từ chối dù `circuit-overview:0` tồn tại — khoảng trống từ vựng/cổng coverage với cách diễn đạt này, không phải lỗi hợp nhất điểm. Đây là ca regression rõ ràng nhất để đợt sau xử lý (bổ sung từ đồng nghĩa trong `retrieval_terms` hoặc xem lại cổng 0.4 — cần quyết định của T4, không tự sửa trong đợt này).

**Trượt top-1 (có trả đúng chunk nhưng không ở vị trí 1):** dev — `dev-pen-mass-01/02`, `dev-pen-measure-01` (mọi cấu hình; hai thẻ con lắc cạnh tranh nhau), thêm `dev-pen-limits-02`, `dev-cir-ohm-01` ở B/C. Held-out — `ho-pen-01`, `ho-chem-01` (mọi cấu hình), thêm `ho-pen-03` ở B/C.

**Wrong-lab hits:** dev 2 ca (wronglab-02, wronglab-03 — vector-only tránh được wronglab-03); held-out **0 ca**.

## 4. Kết luận

- Production RRF (REF) ngang bằng cấu hình tốt nhất trên dev và thuộc nhóm tốt nhất trên held-out; hợp nhất trọng số tuyến tính C/D **không cho lợi thế đo được** → giữ nguyên production, không sửa.
- Điểm mạnh: không từ chối nhầm trên dev; CRR held-out 0.800.
- Điểm yếu thật, có bằng chứng: (1) 1 ca từ chối nhầm hệ thống ở held-out (ho-cir-01); (2) câu hỏi thiếu nguồn vẫn bị "trả lời" khi có chunk cùng chủ đề rộng (missing-03, ho-missing-01); (3) wrong-lab theo `lab_id` là giới hạn thiết kế hiện tại.
- Đánh giá ngữ nghĩa e5: **NOT RUN** trong đợt này (môi trường kiểm chứng không tải được torch — cùng giới hạn hạ tầng đã ghi ở các đợt trước; đường hash là mặc định của repo nên số liệu trên là baseline chính thức, tái lập 100%).
