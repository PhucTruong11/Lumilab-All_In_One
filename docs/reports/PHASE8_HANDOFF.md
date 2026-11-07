# PHASE VIII — Handoff

**Điểm xuất phát:** PHASE VII khép lại với PR-A (patch B1) và PR-B (test/evidence) ở trạng thái READY FOR REVIEW trên nền `main` @ `b7e333bb` + patch profile `vi-en-science-v4` (fingerprint `abc827a9…`). PHASE VII chỉ chính thức đóng khi hai PR vào main và CI xanh. Các mục dưới đây **chưa triển khai** — chuyển giao nguyên trạng kèm bằng chứng nền.

## 1. Duyệt học liệu và cấp quyền `send_llm`
- Corpus hiện tại: 30/30 draft, 0 nguồn có `send_llm`, 12 cảnh báo thiếu nguồn độc lập thứ hai.
- Việc cần làm: duyệt khoa học bởi người có tên thật (không ghi danh tính/ngày giả — `knowledge/AGENTS.md`), duyệt bản quyền, cấp `send_llm` cho nguồn tự biên soạn, bổ sung nguồn thứ hai. Ưu tiên 4 thẻ con lắc + giữ bản ghi SGK `CONLAC-CHUKY-01` ở reference-only.
- Tài liệu nền: `TUTOR_LIVE_PILOT_READINESS.md` (checklist đầy đủ), `RAG_02_PENDULUM_CONTENT_STANDARDIZATION.md` (bảng 3 trục quyền).

## 2. Mở rộng MISSING_EVIDENCE golden set (tối thiểu 15 câu)
- Hiện có 5 câu MISSING_EVIDENCE trên hai bộ (dev 3 + held-out 2) — không đủ để hiệu chuẩn bất kỳ cơ chế từ chối nào.
- Yêu cầu: phủ nhiều lab (con lắc, mạch điện, lò xo, hóa học), giữ tách dev/held-out, không dùng held-out để tinh chỉnh.

## 3. Evidence sufficiency tại tầng Tutor
- Vấn đề đã chứng minh (RAG-B2): tín hiệu coverage/BM25 không tách được "gần chủ đề" khỏi "đủ bằng chứng" (khoảng chồng lấn 0.400–0.625 vs answerable min 0.429, n=38).
- Hướng: kiểm tra khái niệm phân biệt của câu hỏi có mặt trong chunk được trích hay không; cân nhắc trạng thái `LOW_EVIDENCE` tường minh cho UI/Tutor. Hiệu chuẩn trên dev mở rộng (mục 2), xác nhận bằng held-out.

## 4. Wrong-lab cross-check
- Hiện tượng: truy vấn bị scope theo `lab_id` nên câu hỏi lạc lab vẫn nhận chunk của lab được chọn (`dev-wronglab-02/03`).
- Hướng: so khái niệm câu hỏi với lab đang chọn ở tầng Tutor/API và cảnh báo/từ chối khi không tương thích — cần thiết kế + nhãn kiểm thử riêng, tránh tăng false refusal cho câu hỏi biên hợp lệ.

## 5. E5 embedding benchmark
- Trạng thái: PARTIAL — code sẵn sàng (model local-only, tiền tố `query:` cho họ e5, fail-closed về lexical); chưa chạy vì môi trường Muse thiếu torch/RAM.
- Việc cần làm: trên máy trạm của dự án, cài `docker/requirements-data-optional.txt`, tải sẵn `intfloat/multilingual-e5-small` + revision, chạy cùng 2 golden set với baseline hash/v4 hiện tại và so sánh (đặc biệt: false refusal và CRR).
- Tài liệu nền: `RAG_E5_FEASIBILITY_REPORT.md`.

## 6. Docker acceptance (nếu nhóm muốn kiểm tra riêng)
- Non-blocking theo quyết định chủ dự án. Đội đã tự kiểm local (build + healthy + 200s theo `docs/STATUS.md`).
- Còn thiếu nếu muốn đóng chính thức: retrieval hybrid FOUND trên container, persistence sau `docker compose restart`, E2E trên container. Checklist: `DOCKER_ACCEPTANCE_REPORT.md`. Cấm `down -v`.

## 7. Live LLM pilot
- Điều kiện mở: mục 1 hoàn tất (có nguồn reviewed + `send_llm`) + chủ dự án cấp API key, trần ngân sách, event cap và chỉ định route/model cho môi trường kiểm thử.
- Nền đã chuẩn bị: Giai đoạn A mock PASS (4 case), lệnh pilot dự thảo + giới hạn chi phí trong `TUTOR_LIVE_PILOT_READINESS.md`, rubric con lắc trong `TUTOR_01_TEMPLATE_ACCEPTANCE.md`.
- Giữ nguyên các cổng guard/budget/fallback template hiện có khi pilot.
