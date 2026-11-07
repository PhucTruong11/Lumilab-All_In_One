# Taskboard triển khai

Phân công theo [Workflow](../../docs/coordination/WORKFLOW.md). UI có sẵn. Thiết kế hướng tới **n lab**, dùng **9 lab hiện hành (11 model gồm 2 lưu trữ)** để kiểm thử preview và lịch sử phiên PostgreSQL. Mỗi việc bên dưới cần người nhận, nhánh riêng và bằng chứng nghiệm thu. Phụ thuộc chỉ chặn tích hợp, nhóm có thể chuẩn bị song song.

| ID | Người giữ | Việc và tiêu chí nghiệm thu | Hệ thống và công nghệ | Phụ thuộc |
| --- | --- | --- | --- | --- |
| T1-1 | T1 | Lập bảng đối chiếu n lab với nguồn, trang, phạm vi và quyền sử dụng. Nguồn chưa duyệt có nhãn riêng. | JSON, Markdown trong knowledge/ | T2 kiểm mô hình |
| T1-2 | T1 | Soạn bộ ca hỏi Lumi cho n lab với số liệu kỳ vọng, tình huống thiếu nguồn và tiêu chí đạt. | Fixture JSON, rubric Markdown | T1-1 và T4 thống nhất format |
| T2-1 | T2 | Kiểm tra đơn vị, tolerance và ca biên. Bổ sung golden test khi phát hiện lệch giữa frontend và server. | TypeScript, Python, tests/golden/, Vitest, pytest | T1-1 với ca cần nguồn |
| T2-2 | T2 | Hoàn thiện luồng Verify từ đầu vào, phạm vi, đơn vị đến kết quả tính lại. Ca đủ kiểm tra và bằng chứng được duyệt mới trả VERIFIED. Ca chưa duyệt trả preview/INSUFFICIENT_DATA. | readings.py, recompute.py, verifier.py, JSON Schema | T1-1, T2-1 |
| T3-1 | T3 | Kiểm quyền đọc/ghi, hết hạn, chống lưu trùng và thiết kế dọn dữ liệu theo chính sách. Nghiệm thu với PostgreSQL thật. | FastAPI, SQLAlchemy, PostgreSQL, session_routes.py, run_schema.py | Hợp đồng API hiện tại |
| T3-2 | T3 | Bổ sung giới hạn request và ngân sách theo phiên. Kiểm cạnh tranh giao dịch và lỗi DB. | FastAPI, PostgreSQL, OpenAPI | T3-1, yêu cầu từ T4 |
| T4-1 | T4 | Mở rộng mẫu Lumi theo lab và kiểu câu hỏi. Mọi số liệu trích từ lượt đúng phiên. Dùng nhãn preview và có fallback. | Lumi, Python/templates, fixture | T1-2, T3-1 |
| T4-2 | T4 | Thử gateway giả lập và chấm theo bộ ca. Chỉ đề xuất nối nguồn truy xuất hoặc nhà cung cấp thật sau khi xác minh tài khoản, quota và ngân sách. | Python, fake provider, Chroma nếu được chọn | T1-2, T3-2, T4-1 |
| T4-3 | T4 | Dựng luồng RAG local từ corpus được phép dùng. Chia đoạn, giữ ID nguồn/trang, lập chỉ mục, truy xuất theo lab và câu hỏi. Kiểm trích nguồn và fallback bằng bộ ca T1. | Python, sentence-transformers, Chroma local | T1-1, T1-2, T4-1 |
| T5-1 | T5 | Chạy CI và luồng n lab từ preview → lưu → mở bằng Lumi. Kiểm lỗi DB, phiên sai và kết quả cũ. | Playwright, PostgreSQL, GitHub Actions | T3-1, T4-1 |
| T5-2 | T5 | Build image, chuẩn bị cấu hình DB/secrets và áp migration cho staging. Deploy theo runbook, kiểm HTTPS, health/readiness, smoke test n lab, backup/restore và rollback. | Docker Compose, GitHub Actions, Cloud Run staging theo runbook, PostgreSQL | T5-1, T3-1, tài khoản và ngân sách được xác nhận |

Điểm tích hợp đầu tiên là một lượt lưu của từng lab được mở đúng phiên trong Lumi. Sau đó chạy bộ ca của T1 trên gateway giả lập và RAG local. T5 dùng cùng luồng để nghiệm thu staging. Quyết định duyệt dữ liệu do T1 và T2 ghi lại trước khi thay trạng thái verifier.

Khung tích hợp local mới: [INTEGRATION-READY](../../docs/INTEGRATION-READY.md). Vector băm đã chạy, adapter embedding/Chroma có điểm nối nhưng chưa thử thật; liveLLM, dữ liệu duyệt và deploy vẫn là task của team.

Đầu vào04/11 cho T1/T3/T4: [LLM-DATA-REVIEW](../../docs/LLM-DATA-REVIEW.md), [PROGRESS](../../docs/PROGRESS.md). Chưa đánh dấu các task LLM/dataset DONE theo text đề xuất; cần quyền artifact, dữ liệu duyệt, model/quota và phép đo thực. Benchmark lớn cần ngân sách riêng.

## Cập nhật tích hợp DATA-RAG-TUTOR-01 ·05/11/2026

- [x] Sổ nguồn/pin/quyền theo mục đích, convert/import/lint và build artifact/Data Card có gate.
- [x] Hybrid BM25 + vector/RRF, lọc lab/level/review/quyền; hash mặc định, E5/Chroma local integration + dev report.
- [x] Tutor HTTP/UI theo phiên, owned run, prompt/skill/output guard, template rõ ràng.
- [x] Gateway HTTP adapters được test giả, timeout/cache/repair; PostgreSQL atomic budget đếm lỗi và chặn cap.
- [x] Schema/CI/Docker/tests/docs và handoff kỹ thuật.
- [ ] T1/T2: nguồn approved + CTST edition/trang + giáo viên duyệt; VERIFIED chưa triển khai.
- [ ] T1/T4: VMLU được phép dùng, rubric/held-out và accuracy thực của 3 cấu hình LLM.
- [ ] T3/T4: xác minh provider/account/minors/quota/giá, mới thử live trong cap; hiện mọi provider disabled.
- [ ] T5: Linux CI/Cloud Run staging, tài nguyên/cost/rollback; chưa deploy.

Chi tiết và bằng chứng: docs/DATA-RAG-TUTOR.md, docs/coordination/HANDOFF-DATA-RAG-TUTOR-01.md. Các checkbox cũ là task kế hoạch, không thay acceptance của nguồn/live/evaluation.

## DATA-LLM-BENCH-02 ·06/11/2026

- [x] Tải nội dung chữ hai kho OpenStax theo commit, receipt hash/license và section ứng viên; không ingest nguồn pending.
- [x] Scope lực/ròng rọc–điện–con lắc,3nhóm Hóa vô cơ;17thẻ tự soạn draft cóTHCS/THPT và filter từ UI đếnAPI.
- [x] BM25 postings build-time, semantic tokenizer, artifact validation, benchmark hash/E5 có nguồn/revision/cases hash.
- [x] Importer4subject Lý/Hóa THCS/THPT,4–5lựa chọn và không tự tạo đáp án thiếu.
- [x] Gemini developer CLI preflight/3configuration, atomic budget, tools annotation, không answer leakage; .env SecretStr adapter.
- [ ] T1: tải VMLU có đăng nhập và quyền dataset; SGK hợp pháp/edition/pages; OpenStax permission theo artifact/mục đích.
- [ ] T1/T2: giáo viên duyệt claim/model/rubric; không nâng VERIFIED.
- [ ] T3/T4: tuổi/account/free-quota thật + benchmark/source rights; mới chạy LLM accuracy. Hiện model calls=0.
- [ ] T5: Linux CI/staging/tài nguyên/cost thật. Không suy E2E local thành cloud deploy.

Chi tiết: docs/BENCHMARK-AND-DATA.md và docs/coordination/HANDOFF-DATA-LLM-BENCH-02.md. Khung kỹ thuật REVIEW; acceptance live/data chưa hoàn tất.

## GROQ-FALLBACK-05

- [x] AdapterJSONschema/object, compactprompt2hit, headerguard và conservativeproviderbudgets.
- [x] Chuỗi3model/cap3/1repair/deadline, metadata startupgate, benchmarkreceiptGemini/Groq.
- [x] TestsPG/fakeproviders và tài liệu/migrationidempotent.
- [ ] Groqmetadata hiện403:account/quota/policy còn cần xác minh, chưalivegeneration.
- [ ] VMLU/nguồn được phép+review và đánh giáGemini/Groq thực; không fakeaccuracy hoặc autoselectmodel.


## GROQ-GUARD-EVAL-06

- [x] T4: cấu hình Qwen trước GPT-OSS-120B; instruct/low reasoning, route GPT-OSS-20B chỉ hint và classifier role riêng.
- [x] T3/T4: đếm token từng model cùng trần provider/event/session; guard calls cũng trừ ngân sách, không cộng quota giả.
- [x] T4/T5: local rules + optional remote guard có chia đoạn/giới hạn/đếm lượt và xuống cấp khi lỗi; trạng thái qua API và TS contract.
- [x] T5: 48 câu synthetic dev, đo luật local, lưu cả bỏ sót/chặn nhầm; sáu MCQ draft và preflight so hai model cùng ID/cấu hình.
- [ ] T3/T4: Groq metadata 403, cần quyền model, số dư/free quota và budget thực trước generation; hai model NOT_RUN.
- [ ] T1/T4: RAG evidence hợp lệ, teacher review/rights, VMLU có quyền, held-out và rubric; chạy benchmark thật rồi mới chọn model thắng.
- [ ] T4/T5: contract response/tokenizer/threshold Prompt Guard thật, bộ tiếng Việt độc lập và đánh giá false positive trước bật pilot.


## LIVE-SYSTEM-EVAL-07

- [x] T3/T4: kiểm Groq metadata bằng client chuẩn, lưu200 và model allowlist; HTTPX runtime/lock + kiểm safe headers, redirect, size, lỗi và no retry.
- [x] T4/T5: chạy12APIattempt thật trong ngân sách cũ, ghi latency/usage/JSON/numeric/preview và Guard contract; không bật app hoặc duyệt học liệu giả.
- [x] T3: đối chiếu audit12lượt, event2→14, giữ5demo; không hoàn lượt lỗi.
- [x] T4/T5: đo lại RAG dev, hồi quy468API và build/smokeDocker; báo cáo gồm cả lỗi và false positives/negatives.
- [ ] T1/T4: đủ corpus quyền/review, VMLU/held-out và rubric; benchmarkRAG end-to-end vẫn chưa chạy.
- [ ] T4/T5: quyết định routing/deadline choGemini3.8 và đánh giáGuard tiếng Việt rộng hơn trước khi bật live.


## RAG-GUARD-SCOPE-08

- [x] T1/T4: versioned scope gồm6nhóm Lý/Hóa,CTST THCS–THPT,OpenStaxchapter/modulemetadata đúngpin; táchscope selected/rights/academicpending.
- [x] T4: lexicalaliasVi–En dùngchungbuild/query, meaningfuloverlapguard,staleprofilerebuild; khôngđổiguardlab/level/review.
- [x] T4/T5: luậtcontext/quote/negation/Unicode/encoding/multiline và regression; dev/challengebefore/after cùng nhãn,giữfirstpassfailure.
- [x] T5:494API/74unit/38legacy/36E2E/Docker; cập nhật report/handoff. Gitpush tách4mốc, khôngforce hoặcsecret.
- [ ] T1/T2: SGKedition/grade/pages, quyền reuse và giáo viên/claimreview thật; scope khôngtựcấpVERIFIED.
- [ ] T4/T5: corpus lớn hơn, heldoutđộclập,adversarialtest,rawGuard/LLM+RAGliveevaluation theoquota; khônglấyđiểmregression làm bằngchứnghiệuquảhọc.


## REBUILD-STRATEGY-09

- [x] Gom kit có trang bắt đầu, lịch20giờ/5owner, quickstart, module dependency và prompt AI cho B.
- [x] Template AGENTS/adapters/RULES/STATUS/CONTRACT/ledger/gitignore/env cho B, không mang trạng thái/test của A sang.
- [x] PS7 Preview→Stage→CopyNew theo immutableSHA/manifest, checksum/receipt, không overwrite hoặc Git mutations;24localfixturechecks đạt,12sourcepaths hợp lệ.
- [x] User yêu cầu commit/push bộ tài liệu và công cụ; liên kết từREADME/onboarding/workflow.
- [ ] Khi bắt đầu thật: quy chế/căn cứreuse và URL/pathB; tự bootstrap, chọn từngmodule và test tại B. Không coi test công cụ là appB đã triển khai.

## CTST-CARDS-10 · học liệu tự soạn theo nguồn online

- [x] T1/T4: đọc trang cụ thể 4SGK+1SGV CTST chính thức, sổ reader/ISBN/trang và giới hạn, 13thẻ tự soạn→corpus30. Không đưa bản sách gốc vào RAG.
- [x] T4/T5: build hash/E5/Chroma30chunks, strict0; HTTP giữ nguồn/draft, không nhầm lab/level, lexical profilev3 và regression.
- [x] 510API/74unit/38legacy/33E2E đạt; 7API+3E2E cầnDB bịskip. Báo cáo hashdev22/24; E5dev24/24; challenge16/18, CTST13/13, OODđềuđạt ởhybrid.
- [ ] T1/T2/giáo viên: xác nhận năm in/ấn bản, SGK Vật lí11 (reader0/0), reviewclaim và mapping thật. Không tựđiền reviewer hoặc VERIFIED.
- [ ] T4/T5: tập độc lập, câuparaphrase/English còn thiếu, DBintegration và LLMgrounded sau quyền/duyệt; khôngđổi budgetliveoff.

[Học liệu](../../docs/CTST-LEARNING-MATERIALS.md) · [Report](../../docs/evaluation/CTST-10-2026-11-06.md).
