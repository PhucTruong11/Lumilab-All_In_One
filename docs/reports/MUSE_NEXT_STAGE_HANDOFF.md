# MUSE — Next Stage Handoff (PHASE VII Continuation)

**1. Latest repository HEAD:** `b7e333bbea747bd71dfed00dfc45fa173e5b592f` (Merge PR #12), branch `main`, không đổi trong suốt đợt làm việc. Baseline PHASE VII: `1f43bbae7771dea2d7d8f590e1a242d8b3bc6c1e`.

**2. Commit mới ảnh hưởng task:** PR #11 (`64ad3eb7`, `043b4ee4` → merge `6ca684d1`): cổng stage khoa học bắt buộc cho preview (`SCIENTIFIC_CHECKS_INCOMPLETE`, preview=null khi thiếu stage) + pilot VL-CONLAC-01; `charge_balance` vẫn skipped. PR #12 (`7b7f2e5f` → merge `b7e333bb`): template Cloud Run dạng `.example` (chưa kích hoạt) + script bảo trì. Cả hai đã đồng bộ vào working copy, không xung đột deliverable.

**3. GitHub Actions:** Muse không đọc trực tiếp được Actions qua connector đã duyệt (UNVERIFIED). Quan sát của ChatGPT: PR #12 quality run #30 Success, main run #31 đang chạy lúc họ kiểm tra. **Các file test/spec bổ sung của PHASE VII chưa có trên remote → CI chưa chạy chúng.** Bundle tích hợp: `phase7-integration-bundle.zip` (39 file) — giải nén vào root repo, giữ nguyên đường dẫn; CI sẽ tự nhận pytest mới ở job backend, spec Playwright mới ở job e2e (có PostgreSQL service); khi đó `test_tutor_postgres.py` + `test_tutor_run_acceptance_pg.py` chạy ở job e2e/môi trường có `LUMILAB_DATABASE_URL`.

**4. TUTOR-01 — PASS.** PostgreSQL 18.6 thật tại môi trường Muse: test của repo 7 passed + test bổ sung 3 passed; đủ 8 kiểm tra §3.1 (xem TUTOR_01_TEMPLATE_ACCEPTANCE.md).

**5. TUTOR-02 — PASS (local).** Playwright + Chromium thật trên full stack: 7/7 test của 2 spec Tutor đạt; 6/6 case có bằng chứng thực thi (xem TUTOR_02_WEB_E2E_ACCEPTANCE.md).

**6. Docker — NOT RUN** tại Muse (không có Docker Engine); checklist PowerShell + tiêu chí acceptance trong DOCKER_ACCEPTANCE_REPORT.md. Stack tương đương đã chạy thật không qua Docker ở mục 4–5.

**7. RAG-B1 findings:** `ho-cir-01` bị cổng coverage loại (0.333 < 0.4) vì 6 từ đệm ngoài STOP làm loãng mẫu số, dù khớp 3/3 khái niệm và BM25 hạng 1. Phương án A (thêm `càng, giữ, lớn, nguyên, nó, qua` vào STOP) đã đo: held-out Recall@3 0.7778→0.8889, CRR giữ nguyên; phương án hạ ngưỡng làm CRR giảm rõ. Patch A chờ duyệt, chưa áp dụng.

**8. RAG-B2 findings:** Không tồn tại ngưỡng coverage/BM25 tách được false answer khỏi answerable (khoảng chồng lấn 0.400–0.625 vs min answerable 0.429, n=38). Cần evidence-sufficiency ở tầng Tutor + mở rộng nhãn MISSING_EVIDENCE trước khi hiệu chuẩn.

**9. E5 feasibility — PARTIAL.** Code sẵn sàng (local-only, tiền tố e5, fail-closed); thiếu môi trường có torch + model (~470MB) + RAM. Lệnh và điều kiện trong RAG_E5_FEASIBILITY_REPORT.md.

**10. Chủ dự án cần quyết định:**
   a. Duyệt patch B1 phương án A (1 dòng STOP + cân nhắc tăng profile `vi-en-science-v4`) hay giữ nguyên?
   b. Đưa bundle PHASE VII lên repo (PR mới) để CI xác nhận chính thức TUTOR-01/02 và các test còn lại?
   c. Chạy checklist Docker trên máy của dự án và gửi output để đóng acceptance Docker.
   d. Duyệt nguồn con lắc + cấp quyền `send_llm` + ngân sách/key nếu muốn mở TUTOR-03 live (hiện BLOCKED).
   e. (Đã đối chiếu xong) Các kết quả E2E nhiễu trong quá trình chạy song song với pytest (dùng chung database) đã được thay bằng lần chạy cô lập: **toàn suite 40/40 passed** — không còn ca fail nào treo.

**11. File đã thêm/sửa trong đợt này (working copy, chưa commit/push):**
- Thêm: `apps/api/tests/test_tutor_run_acceptance_pg.py`, `scripts/rag_b1_experiment.py`, `knowledge/evaluation/results/rag_b1_experiment.json`, `knowledge/evaluation/results/rag_b2_signals.json`, báo cáo REPO_LIVE_STATUS, RAG_B1, RAG_B2, RAG_E5_FEASIBILITY, TUTOR_LIVE_PILOT_READINESS, DOCKER_ACCEPTANCE_REPORT, MUSE_NEXT_STAGE_HANDOFF.
- Sửa: `tests/e2e/tutor-acceptance.spec.ts` (bổ sung `lab_id` cho 3 lời gọi list runs), `apps/api/tests/test_tutor_acceptance.py` (fixture hermetic với biến môi trường DB), báo cáo TUTOR_01/TUTOR_02 (cập nhật kết quả), LUMILAB_PHASE7_FINAL_REPORT (thêm phần Continuation C1–C10).
- Đồng bộ từ remote (ghi đè bằng bản mới của đội): `recompute.py`, `test_expansion_routes.py`, `docs/STATUS.md`, `docs/VERIFICATION.md`; thêm mới `deploy/cloud-run/*`, `.github/workflows/cloud-run.yml.example`, `scripts/rebuild/*`.

**12. Git diff summary:** 0 commit, 0 push. Production code: **không sửa** (patch B1 mới ở mức đề xuất). Mọi thay đổi là test/spec/script/báo cáo + đồng bộ file của đội từ remote.

**13. Test logs & evidence:** pytest no-DB 535 passed/9 skipped; pytest + PostgreSQL 546 passed/2 skipped; Playwright Tutor 7 passed; toàn suite E2E chạy cô lập 40 passed/0 failed; ruff sạch trên apps/api; kết quả thô tại `knowledge/evaluation/results/` và `test-results/` (trace Playwright).
