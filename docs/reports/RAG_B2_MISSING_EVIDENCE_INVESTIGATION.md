# RAG-B2 — Investigation: Missing-source false answers

**Các ca:** `dev-missing-03` ("Dung dịch đệm giữ pH ổn định bằng cơ chế nào?" — corpus không có nội dung dung dịch đệm; bị trả `ctst-titration-direction:0`) và `ho-missing-01` ("Con lắc lò xo dao động trong dầu nhớt thì biên độ thay đổi thế nào?" — corpus không có dao động tắt dần; bị trả `spring-overview:0`). Số liệu: `knowledge/evaluation/results/rag_b2_signals.json`.

## 1. Vì sao retrieval vẫn có hit?

Cả hai câu hỏi **dùng đúng từ vựng lõi của lab**: "pH" khớp khái niệm chỉ thị/chuẩn độ; "lò xo, biên độ, dao động" khớp `spring-overview`. Coverage của chunk bị trả: 0.625 (dev-missing-03) và 0.545 (ho-missing-01); BM25 3.31 và 2.50 — đều vượt mọi ngưỡng hiện có. Retrieval đo **tương đồng chủ đề**, và ở tiêu chí đó các hit này "đúng": chúng là tài liệu gần nhất thật sự tồn tại trong corpus.

## 2. Tương đồng chủ đề ≠ đủ bằng chứng

Chunk được trả không chứa quan hệ được hỏi: thẻ chuẩn độ nói về chiều chuẩn độ/điểm tương đương, không có cơ chế đệm; thẻ lò xo nói về độ cứng/chu kỳ, không có tắt dần/ma sát nhớt. Không tín hiệu nào trong pipeline hiện tại kiểm tra "chunk có chứa mệnh đề trả lời câu hỏi hay không" — đó là khoảng trống **evidence sufficiency**, không phải lỗi xếp hạng.

## 3. Tín hiệu hiện có có tách được không? — Đã đo: KHÔNG

Phân bố coverage của hit hạng 1 trên toàn bộ 38 câu của hai bộ:

| Nhóm | Coverage |
|---|---|
| ANSWERABLE được trả lời (24 câu) | min **0.429**, trung vị 0.778, max 1.0 |
| Cần từ chối nhưng bị trả lời (4 câu: 2 missing + 2 wrong-lab) | **0.400 – 0.625** |

Hai khoảng **chồng lấn hoàn toàn**: câu trả lời được ở 0.429 (`dev-pen-mass-02`) và 0.444 (`ho-pre-01`) nằm ngay giữa vùng của false answer. Mọi ngưỡng coverage/BM25 đặt giữa 0.43–0.65 đều đánh đổi trực tiếp: chặn được tối đa 2 false answer thì cũng giết 6–8 câu trả lời được. **Kết luận: không tồn tại ngưỡng tín hiệu hiện tại giải quyết được B2** — đây là lý do không đề xuất sửa ngưỡng.

## 4. Tutor có đủ thông tin để từ chối không?

Hiện tại: không. Gateway nhận `TutorContext.sources` (chunk + provenance) và chỉ từ chối theo trạng thái truy hồi (`NO_MATCH` → NEEDS_SOURCE) hoặc quyền nguồn. Khi retrieval trả hit, Tutor không có tín hiệu "hit này không chứa đáp án" — nó sẽ trích dẫn chunk gần chủ đề như bằng chứng, chính là nguy cơ "trả lời dựa trên chunk không tương ứng" mà Addendum nêu.

## 5. Các phương án nghiên cứu (chưa triển khai — cần dữ liệu gán nhãn lớn hơn)

| Phương án | Cơ chế | Rủi ro false refusal | Đánh giá |
|---|---|---|---|
| Evidence sufficiency check ở Tutor | Kiểm tra chunk có chứa quan hệ/khái niệm phân biệt của câu hỏi (ví dụ khái niệm "đệm"/"tắt dần" vắng mặt trong mọi chunk → LOW_EVIDENCE) | Trung bình — khái niệm phân biệt phải suy ra đáng tin cậy | Khả thi nhất với kiến trúc hiện tại (dùng chính hệ khái niệm ALIASES); cần bộ nhãn riêng để hiệu chuẩn |
| Trạng thái `LOW_EVIDENCE` tường minh | Retrieval trả kèm tín hiệu độ phủ khái niệm phân biệt; UI/Tutor hiển thị "có tài liệu liên quan nhưng chưa đủ căn cứ" thay vì trả lời thẳng | Thấp — không chặn, chỉ gắn nhãn | Nên làm kèm phương án 1; cải thiện tính minh bạch ngay cả khi chưa chặn |
| Topic compatibility / wrong-lab cross-check | So khái niệm câu hỏi với lab được chọn | — | Giải quyết nhánh wrong-lab (dev-wronglab-02/03), không giải quyết missing-evidence cùng lab |
| Semantic entailment (e5/NLI) | Model kiểm tra chunk ⇒ đáp án | Chưa đo được (xem báo cáo E5) | Dài hạn, phụ thuộc PHASE C |

**Khuyến nghị:** không vá heuristic theo 2 câu. Bước tiếp theo đúng quy trình: mở rộng golden set nhánh MISSING_EVIDENCE (hiện 5 câu ở hai bộ) lên tối thiểu ~15 câu phủ nhiều lab, rồi hiệu chuẩn phương án 1+2 trên dev và xác nhận bằng held-out — đúng regression gate đã dùng cho B1.
