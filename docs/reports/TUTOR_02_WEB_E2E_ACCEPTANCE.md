# TUTOR-02 — Web E2E Acceptance (6 tình huống)

**Cập nhật đợt CONTINUATION (2026-11-07, HEAD `b7e333bb`): trạng thái tổng thể PASS** — cả 6 case đã **chạy thực tế bằng Playwright + Chromium thật** trong môi trường Muse: API uvicorn (cổng 8002) + web Vite (5175) + PostgreSQL 18.6 local (15434), do chính `webServer` của `playwright.config.ts` điều phối — không phải Docker, không phải TestClient, không mock session/ownership.

**Kết quả chạy:** `tutor-pipeline.spec.ts` (3 test của repo) + `tutor-acceptance.spec.ts` (4 test bổ sung) = **7 passed** (18.3s). Toàn bộ suite E2E (40 test, 11 file) khi chạy **cô lập** với database riêng: **40 passed / 0 failed** (3.4 phút). Các lần chạy song song trước đó cho kết quả nhiễu do dùng chung database với pytest — không dùng làm bằng chứng.

| Case | Expected | Actual (chạy thật) | Trạng thái |
|---|---|---|---|
| 1. Tìm thấy nguồn | Retrieval FOUND đúng lab; UI hiện citation + nhãn draft | Spec repo: hybrid query hiện citation + "Dữ liệu chưa duyệt" + license thật | ✅ PASS |
| 2. Thiếu nguồn | NO_MATCH; Tutor NEEDS_SOURCE; UI "Chưa tìm thấy học liệu" | Spec repo đạt; API trả `status: NO_MATCH` | ✅ PASS |
| 3. Session không hợp lệ | API 401; UI không hiện response giả | Spec bổ sung: token giả → **401** (sau khi sửa spec để truyền `lab_id` — bản đầu thiếu tham số này nên nhận 422 validation trước tầng auth; đã sửa và chạy lại đạt) | ✅ PASS |
| 4. Run thuộc session khác | Từ chối, không lộ số liệu | Token B đọc runs của A → **401**; token đúng → 200 | ✅ PASS |
| 5. Mất kết nối | UI hiện lỗi, không thành công giả, không citation giả | Abort request retrieval → đáp án hiển thị không chứa citation/license | ✅ PASS |
| 6. Chất vấn nguồn trích dẫn | UI khớp provenance API thật | Đối chiếu trực tiếp payload API với UI: title + license của hit đầu + nhãn draft khớp | ✅ PASS |

Bằng chứng kèm theo: Playwright sinh trace/error-context trong `test-results/` cho các lần chạy lỗi; log HTTP của API (webServer) ghi nhận các request 200/201/401 đúng kỳ vọng trong lần chạy đạt.

**Lưu ý phạm vi:** các file bổ sung (`tutor-acceptance.spec.ts`, test Python mới) **chỉ nằm trong working copy**, chưa có trên remote main — CI của GitHub chưa chạy chúng. Muốn CI xác nhận chính thức phải đưa file lên repo theo CI handoff (MUSE_NEXT_STAGE_HANDOFF §CI). Việc chạy local này là bằng chứng thực thi thật, nhưng không thay thế CI của dự án.

**Kết luận TUTOR-02: PASS (local, full stack thật).**
