# Sổ chuyển giao LumiLab A → B

Cập nhật **07/11/2026**. Sổ ghi nguồn, phần tích hợp và bằng chứng tại B; không thay lịch sử Git, quyền sử dụng hay duyệt khoa học. [Audit baseline](TRANSFER-AUDIT.md) · [Vận hành](OPERATIONS.md) · [LLM](LLM-RUNBOOK.md)

## Nguồn và cách đọc

Baseline đối chiếu A là [`f5f233f8dc2ee21934e6b77c740e7959fecb102a`](https://github.com/PhucTruong11/lumilab/commit/f5f233f8dc2ee21934e6b77c740e7959fecb102a). Đây là SHA dùng kiểm parity sau chuyển giao; không suy ra mọi file được nhập cùng lúc từ SHA đó. Khi có source SHA riêng từ handoff, ghi riêng ở bảng. B có các phần tự viết mới và thay đổi của team; không ghi chúng thành bản sao nguyên trạng của A.

| Module / source paths A | Commit và review tại B | Điều chỉnh / dependency / bằng chứng |
| --- | --- | --- |
| Web, API, engine, contracts, knowledge và tests: `apps/`, `packages/`, `knowledge/`, `tests/golden/`, `tests/e2e/` | `886c892`; [PR #6](https://github.com/PhucTruong11/Lumilab-All_In_One/pull/6), merge `c7598da` | Baseline runtime đã tích hợp. B đổi cổng/CORS sang 5175/8002; PostgreSQL phục vụ phiên/owned-run. Test lịch sử ở [STATUS](STATUS.md); kiểm API mới bên dưới. |
| Docker/team setup; tham khảo cấu hình A `docker/` | `05a068f`, cùng PR #6 | Web Dockerfile, Nginx, script khởi động và README cho B; DB volume/cổng tách A. Không chuyển DB/secret A vào Git. |
| Phạm vi Verify và scientific stages: `docs/VERIFICATION.md`, `docs/VERIFY-STAGES.md` | `1ea6ff1`; [PR #7](https://github.com/PhucTruong11/Lumilab-All_In_One/pull/7), merge `9f9bcc8` | Tài liệu viết lại cho B, giữ preview/draft. Không cấp `VERIFIED` theo kết quả test. |
| RAG/Tutor, skills và specs: `docs/DATA-RAG-TUTOR.md`, `docs/LLM-DATA-REVIEW.md`, `.agents/`, `.claude/`, `.specify/`, `specs/` | `2a7c47c`; [PR #10](https://github.com/PhucTruong11/Lumilab-All_In_One/pull/10), merge `d94d2e5` | Giữ upstream lock/license, đồng bộ skill copies; hướng dẫn phù hợp B. Runtime/pipeline/eval đã có trong baseline, không tính chuyển lại ở đợt docs. |
| Maintenance/deploy templates: `scripts/`, `.editorconfig`, `.gitattributes`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/workflows/cloud-run.yml.example`, `deploy/` | `7b7f2e5`; [PR #12](https://github.com/PhucTruong11/Lumilab-All_In_One/pull/12), merge `b7e333b` | Điều chỉnh docs/link/cổng; workflow deploy giữ `.example`, chưa chạy cloud. Loại demo JavaScript cũ theo phạm vi đã chốt. |
| Kiến trúc và benchmark: `docs/ARCHITECTURE.md`, `docs/BENCHMARK-AND-DATA.md`, `docs/LIVE-LLM-EVALUATION.md` | `740428a`; [PR #15](https://github.com/PhucTruong11/Lumilab-All_In_One/pull/15), nhánh `chore/transfer-llm-benchmark` | Kiến trúc theo code B, phép đo offline B tại `b7e333b`; số live A được ghi rõ là lịch sử. Key/metadata/preflight local không được commit. |
| Runbook còn thiếu ở A: `docs/GEMINI-FALLBACK.md`, `docs/GROQ-FALLBACK.md`, `docs/PROMPT-SCREENING-08.md`, `docs/TUTOR-CONTEXT.md`, `docs/DEPLOYMENT.md`, `docs/VALIDATION.md` | `d449123`; [PR #15](https://github.com/PhucTruong11/Lumilab-All_In_One/pull/15): `LLM-RUNBOOK.md`, `OPERATIONS.md`, sổ này và audit | Tổng hợp theo code hiện hành, không sao chép đoạn lịch sử đã cũ. Backup/restore và PostgreSQL tests đã thực thi ở B; kết quả bên dưới. PR mở để team review, chưa merge/deploy trong lượt bàn giao. |

Các URL nguồn A theo baseline: [cây code](https://github.com/PhucTruong11/lumilab/tree/f5f233f8dc2ee21934e6b77c740e7959fecb102a), [runbook Gemini](https://github.com/PhucTruong11/lumilab/blob/f5f233f8dc2ee21934e6b77c740e7959fecb102a/docs/GEMINI-FALLBACK.md), [runbook Groq](https://github.com/PhucTruong11/lumilab/blob/f5f233f8dc2ee21934e6b77c740e7959fecb102a/docs/GROQ-FALLBACK.md), [vận hành](https://github.com/PhucTruong11/lumilab/blob/f5f233f8dc2ee21934e6b77c740e7959fecb102a/docs/DEPLOYMENT.md). Giữ [third-party notices](../THIRD_PARTY_NOTICES.md) và vendor lock; permission nguồn/corpus được ghi riêng, không tự suy ra từ quyền code.

## Phần team phát triển tại B

| Phần việc | Commit/PR | Phân biệt với transfer |
| --- | --- | --- |
| Dataset/phạm vi Kết nối tri thức | `71bf8cb`; [PR #8](https://github.com/PhucTruong11/Lumilab-All_In_One/pull/8), merge `1f43bba` | Phạm vi nhóm chọn và bản nháp con lắc; nguồn chưa approved. |
| Gate bắt buộc/không trùng stage và pilot con lắc | `64ad3eb`, `043b4ee`; [PR #11](https://github.com/PhucTruong11/Lumilab-All_In_One/pull/11), merge `6ca684d` | Tăng kiểm Verify tại B, không ghi đè bằng bản A cũ. |
| Học liệu và 9 bài thực hành | `93909f5`, `8bc0d27`; [PR #13](https://github.com/PhucTruong11/Lumilab-All_In_One/pull/13), merge `02d92f2` | Handoff kiểm kê ghi source A riêng `67712a7a6e6de24fd64e9a9b9cdbf2c80aff2475`. B giữ phần cũ và phát triển sáu model mới, đưa 9 bài/12 runtime hiện hành, 5 runtime lưu trữ và 36 thẻ draft vào main. [Bàn giao Dataset](tasks/DATASET-SYNC.md) · [9 bài](tasks/NINE-LABS.md) |

Trong lượt bàn giao runbook, đã merge B/main `02d92f2` vào nhánh tài liệu bằng merge commit `8167827`. Không sửa code/model/corpus của PR #13. Các số parity trong audit và benchmark trước đó là snapshot trước PR #13; không coi chúng là phép đo corpus mới.

## Bằng chứng chạy tại B trong lượt runbook

| Kiểm tra | Kết quả thực chạy ngày 07/11/2026 | Giới hạn |
| --- | --- | --- |
| Backup custom dump, SHA256, `pg_restore --list`, restore transaction vào DB mới | Đạt. Đủ sáu bảng và row count khớp DB nguồn trước khi chạy tests. | DB/volume nguồn giữ nguyên; thử phục hồi local, chưa chứng minh cloud/RPO/RTO. |
| Pytest LLM/guard/preflight/HTTP fake và PostgreSQL trước sync PR #13 | **113 passed, 2 skipped**, 1 cảnh báo Starlette | Không provider generation. |
| `pytest apps/api/tests -q -rs` sau sync `8167827`, DB khôi phục riêng | **633 passed, 2 skipped**, 1 cảnh báo Starlette | Skip do chưa cài Chroma và Pint; không skip PostgreSQL. Cảnh báo TestClient HTTPX từ dependency hiện có. |
| `ruff check apps/api` | Đạt | Kiểm static, không thay test tích hợp. |
| `data_cli lint/build --include-drafts`, output riêng dưới `.local/ops-handoff/` | Đạt, 36 chunks; fingerprint `45725db93c40b71627cf6fb4cfcd9fa4eccf593d946b5cb10ba1d3ee218b7da5` | 12 warning thiếu nguồn độc lập thứ hai; dữ liệu vẫn draft. Không ghi đè artifact của task RAG. |
| `guard_evaluation` local, 48 ca | TP 24, TN 24, FP 0, FN 0 | Tập phát triển tự soạn, không đánh giá an toàn production. |
| Preflight giữ image rollback | Phát hiện image ID của API đang chạy không còn tồn tại trong kho local; lệnh tag dừng. | Không gán image latest thay thế, không restart/rollback container. Cần chuẩn bị đúng image trước release. |

Biên bản local ignored: `.local/ops-handoff/restore-check.json`, `pytest.txt`, `pytest-full.txt`, `guard-local.json`; backup dưới `.local/backups/`. DB thử có tên trong biên bản, giữ lại cho owner. Test dùng URL trỏ DB thử, live off/cap 0 và key provider rỗng. Backup có dữ liệu riêng; không upload dump/biên bản chứa thông tin nội bộ vào PR.

Kiểm liên kết docs, vendor skills và đồng bộ Claude được chạy trước commit; exit code và số link ghi trong PR. CI PostgreSQL trên SHA của PR cần được kiểm riêng trước merge. Không đổi schema/contract/model/dataset/prompt revision trong diff tài liệu này. Chưa thao tác chuyển traffic hoặc rollback image thật; phần kiểm image đã chỉ ra dependency còn thiếu, không ghi thành phục hồi ứng dụng đạt.

## Khi cập nhật sổ

Mỗi đợt thêm source SHA/path, owner/phạm vi, commit/PR B, phần sửa riêng, revision, lệnh/kết quả B và dependency còn chờ. Ghi rõ review, CI, merge và deployment theo trạng thái thực. Hoàn nguyên tài liệu bằng PR revert nếu cần; không rollback dữ liệu hoặc reset ngân sách theo một thay đổi docs.
