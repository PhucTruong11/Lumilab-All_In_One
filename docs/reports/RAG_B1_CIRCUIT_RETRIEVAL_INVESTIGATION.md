# RAG-B1 — Investigation: `ho-cir-01` false refusal

**Câu hỏi:** "Điện trở càng lớn thì dòng điện qua nó thế nào nếu giữ nguyên hiệu điện thế?" (lab `circuit`, THPT). Chunk đúng: `circuit-overview:0`. Production trả `NO_MATCH` ở mọi cấu hình (RAG-03).

## 1. Truy vết từng bước (số liệu chạy thật, script `scripts/rag_b1_experiment.py`)

| Bước | Kết quả |
|---|---|
| Eligibility (lab + THPT + draft index) | 2 ứng viên: `circuit-overview:0`, `ctst-source-voltage:0` — chunk đúng **có mặt** |
| BM25 rank | `circuit-overview:0` hạng 1, điểm **0.952** (ngưỡng min_bm25 = 0.05) — BM25 **không** phải nguyên nhân |
| Vector (hash) rank | Có mặt trong nhóm ứng viên hợp lệ |
| **Coverage gate** | coverage(query, circuit-overview:0) = **0.333 < 0.4** → bị loại khỏi cả hai danh sách → hợp nhất rỗng → NO_MATCH |
| Kết luận | **Bước loại bỏ chính xác: cổng coverage trong `CompiledIndex.retrieve()`** (dùng `BM25Index.coverage`) |

## 2. Vì sao coverage chỉ 0.333 dù khớp hết khái niệm?

`coverage` = (số **từ truy vấn** có trong postings của chunk) / (tổng số từ truy vấn), với từ vựng của `retrieval_terms.words()` (khái niệm qua ALIASES + loại stopword). Phân rã thật:

- Từ truy vấn (9): `conceptcurrent, conceptresistance, conceptvoltage` + 6 từ đệm **không nằm trong STOP**: `cang` (càng), `giu` (giữ), `lon` (lớn), `nguyen` (nguyên), `no` (nó), `qua` (qua).
- Chunk khớp **3/3 khái niệm chuyên môn** (dòng điện, điện trở, hiệu điện thế — tài liệu dùng "điện áp", ALIASES đã ánh xạ đúng về `conceptvoltage`).
- Mẫu số bị phình bởi từ so sánh/giữ nguyên/chức năng: 3/9 = 0.333. STOP hiện có `tang, giam, hon, doi, thay` nhưng thiếu họ từ của chính mẫu câu này.

So sánh với các câu circuit đang PASS: `dev-cir-ohm-01` coverage 1.0, `dev-cir-meter-01` 1.0, `dev-cir-src-01` 0.714 — chúng dùng từ vựng trực tiếp, ít từ đệm so sánh. Vấn đề không nằm ở tokenization/normalization (đã đúng) hay đồng nghĩa chuyên môn (ALIASES đã phủ), mà ở **từ chức năng ngoài STOP làm loãng mẫu số coverage**.

## 3. Hai phương án — đã đo trên cả dev + held-out (không sửa production)

Harness sao chép nguyên logic `retrieve()` của production; số BASE tái lập **trùng khớp tuyệt đối** với REF của RAG-03 trên cả hai bộ → phép đo hợp lệ. Chi tiết: `knowledge/evaluation/results/rag_b1_experiment.json`.

### Phương án A — Bổ sung từ đệm vào STOP (khuyến nghị)
Thêm `cang, giu, lon, nguyen, no, qua` vào `STOP` của `retrieval_terms.py` (từ chức năng/so sánh, không mang nghĩa chuyên môn).

| Bộ | Hit@1 | Hit@3 | Recall@3 | MRR | CRR |
|---|---|---|---|---|---|
| Held-out BASE | 0.6667 | 0.7778 | 0.7778 | 0.7037 | 0.800 |
| Held-out A | **0.7778** | **0.8889** | **0.8889** | **0.8148** | **0.800 (không đổi)** |
| Dev BASE | 0.8125 | 0.9375 | 0.9375 | 0.875 | 0.625 |
| Dev A | 0.8125 | 0.9375 | 0.9375 | 0.875 | 0.625 (không đổi) |

Thay đổi theo câu: `ho-cir-01` từ rỗng → `[circuit-overview:0, ctst-source-voltage:0]` (đúng chunk ở hạng 1). Thay đổi duy nhất còn lại: `dev-pen-mass-02` mất hit phụ không liên quan ở hạng 2 (câu này vốn đã trượt) — không đổi metric, không false answer mới, không false refusal mới.

### Phương án B — Hạ cổng coverage 0.4 → 0.30 (không khuyến nghị)
Cùng mức tăng recall trên held-out, nhưng **CRR giảm**: dev 0.625 → **0.500**, held-out 0.800 → **0.600** — sinh false answer mới ở `dev-missing-02` và `ho-missing-02` (câu thiếu nguồn nay bị trả lời bằng chunk con lắc/tụ điện biên). Hạ ngưỡng mở cổng cho mọi truy vấn biên, đúng như rủi ro đã dự báo ở RAG-03.

### Phương án C (ghi nhận, chưa đo) — Coverage chỉ tính khái niệm
Đổi định nghĩa coverage để mẫu số chỉ gồm các `concept*` khi truy vấn có khái niệm. Nguyên lý tốt hơn nhưng thay đổi ngữ nghĩa cổng cho mọi lab và cần bộ kiểm thử lớn hơn hai bộ hiện có để kết luận — để đội dự án cân nhắc dài hạn.

## 4. Đề xuất production patch (chưa áp dụng — chờ chủ dự án duyệt)
Một dòng trong `retrieval_terms.py`: bổ sung 6 từ vào `STOP`. Sau khi áp dụng: chạy lại `scripts/rag_evaluation.py` trên cả hai bộ làm regression gate (kỳ vọng: dev không đổi, held-out như cột A ở trên), rồi chạy pytest + data build (profile version nên cân nhắc tăng `vi-en-science-v4` vì postings thay đổi — quyết định của T4).
