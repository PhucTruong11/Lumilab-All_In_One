# TUTOR-01 — Template Tutor Acceptance (rubric Con lắc)

**Cập nhật đợt CONTINUATION (2026-11-07, HEAD `b7e333bb`): trạng thái tổng thể PASS** — phần Run Response còn thiếu ở đợt trước nay đã có bằng chứng PostgreSQL thật (chi tiết ở mục C).

## A. Hint (gợi ý) — ✅ PASS (đợt PHASE VII)
Template trả hướng dẫn quan sát/thử nghiệm thay vì đáp án số; citation trỏ đúng chunk của lab; output chứa số bịa/"VERIFIED" bị validation chặn (bằng chứng: `apps/api/tests/test_tutor_acceptance.py` 9/9 + bộ test gateway của repo).

## B. Explanation (giải thích) — ✅ PASS (đợt PHASE VII)
Thiếu nguồn → `NEEDS_SOURCE/NO_RELEVANT_SOURCE`; nguồn draft → `REVIEWED_SOURCES_REQUIRED` và provider không được khởi tạo; cache/prompt gắn đúng session + nguồn (Stage 2 cache correctness).

## C. Run Response — ✅ PASS (đợt này, PostgreSQL thật)
**Môi trường:** PostgreSQL **18.6** chạy local (binaries đóng gói, cổng 15434 theo quy ước repo), schema tạo bằng `lumilab_api.run_schema`, `LUMILAB_DATABASE_URL` trỏ DB test riêng. Không dùng fixture/mock cho persistence.

| # | Kiểm tra (theo Directive §3.1) | Bằng chứng chạy thật | Kết quả |
|---|---|---|---|
| 1 | Tạo session A | `POST /api/v1/sessions` → 201 + token (test repo + test bổ sung) | ✅ |
| 2 | Lưu run A (persistence thật) | `POST /sessions/{A}/runs` → 201, run nằm trong PostgreSQL | ✅ |
| 3 | Tutor truy xuất run A | `POST /sessions/{A}/tutor` với `run_id` → 200, template trả lời kèm run | ✅ |
| 4 | Số liệu API khớp run đã lưu | `result.run.preview == saved.result.preview` (khẳng định trong test của repo `test_tutor_owned_runs_preview_and_spoofed_context_are_blocked` và test bổ sung `test_tutor_run_preview_matches_saved_run_exactly`) | ✅ |
| 5 | Session B không đọc được run A | Token B tại route của A → **401**; run của A dưới session B → **404** | ✅ |
| 6 | Run không tồn tại bị từ chối | `run_id` hợp lệ-cú pháp nhưng chưa từng lưu → **404** (test bổ sung) | ✅ |
| 7 | Session không hợp lệ bị từ chối | Token giả → **401** trên cả tutor và runs (test bổ sung); session hết hạn (expires_at lùi về quá khứ trong DB) → **401** (test của repo) | ✅ |
| 8 | Nội dung draft có nhãn preview | `run.status = INSUFFICIENT_DATA`, `review_status = draft`, mọi hit đều draft; UI hiển thị "Preview lượt đã lưu · dữ liệu chưa duyệt" (E2E) | ✅ |

**Kết quả test:** `test_tutor_postgres.py` **7 passed**; `test_tutor_run_acceptance_pg.py` (mới, bổ sung ca 6–7) **3 passed**. Ghi chú: PR #11 siết thêm cổng stage khoa học — run không đạt `SCIENTIFIC_CHECKS_INCOMPLETE` sẽ không có preview để lưu, nên Tutor chỉ nhận các run đã qua gate; các ca trên dùng defaults của lab nên đều qua gate bình thường.

**Kết luận TUTOR-01: PASS** (chạy local trong môi trường Muse với PostgreSQL thật; chưa chạy trên CI của remote vì các file test bổ sung chưa được đẩy lên repo — xem CI handoff).
