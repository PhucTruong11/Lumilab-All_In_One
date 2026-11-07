# Trạng thái repo B

## Mở cổng VERIFIED đầu tiên cho Con lắc đơn (VER-02) · 08/11/2026

Hoàn thành phê duyệt T2/T4 (`VER-02` — Trương Trọng Phúc, Văn Nam) cho hồ sơ claim con lắc đơn `VL-CONLAC-01` tại [`knowledge/verification/pendulum.json`](../knowledge/verification/pendulum.json) và [`knowledge/verification/pendulum.draft.json`](../knowledge/verification/pendulum.draft.json), đồng bộ trạng thái nguồn `nist-pendulum`, `nist-agm` và mục curated `pendulum-ideal-agm`.

API recompute (`/api/v1/verification/labs/pendulum`), lưu lượt theo phiên (`/api/v1/sessions/{id}/runs`) và `tutor_context` đã nối cổng bằng chứng đã duyệt: khi đủ stage khoa học bắt buộc (`physics_invariants: pass`) và khớp revision/phạm vi tham số của hồ sơ claim đã duyệt, `pendulum` trả `status="VERIFIED"`, `code="VERIFIED"`, `facts` chứa các đại lượng định lượng đã kiểm chứng và `evidence` chứa danh sách claim ID (`VL-CONLAC-01:period-agm`, `VL-CONLAC-01:length-ratio`, `VL-CONLAC-01:small-angle-learning`). 16 mô hình runtime còn lại và hai route sàng lọc phẳng P0 (`/api/v1/verification/physics`, `/chemistry`) tiếp tục giữ `INSUFFICIENT_DATA / REVIEWED_EVIDENCE_REQUIRED`. Web (`LabServerPreview`, `LabServerHistory`, `LumiChat`) hiển thị và lưu đúng trạng thái `Đã kiểm chứng (VERIFIED)` hoặc `Dữ liệu chưa duyệt`.

## Kiểm Verify dataset 9 bài · 07/11/2026

Sáu mô hình mới giữ preview nháp. Cổng Verify nay ràng buộc thời điểm request với lò xo có cản và mặt phẳng nghiêng, đối chiếu quỹ đạo/trạng thái, công ròng rọc và diễn giải của ba kịch bản Hóa. Bộ golden chung tăng từ 19 lên 22 ca, thêm li độ thả âm, ngưỡng ma sát nghỉ và ròng rọc hai nhánh. Các ca cố ý sửa sai reading phải trả `INVALID`, `preview=null`, `facts={}`, `evidence=[]`.

Web trình bày toàn bộ preview máy chủ và preview trong lịch sử bằng nhãn tiếng Việt, đơn vị và số làm tròn; file lịch sử JSON vẫn giữ số gốc. Kiểm Playwright riêng cho phản ứng sinh khí xác nhận nhãn thể tích CO₂ lý thuyết và không còn khối JSON thô trong mục số liệu mở rộng.

Kiểm local sau sửa: Ruff đạt; API **674 passed, 10 skipped** khi không cấp DB test và thư viện tùy chọn; TypeScript **99 unit passed**; `check:web` và `build:web` đạt; Playwright headless **19 ca liên quan đạt**. Các ca PostgreSQL vẫn cần CI với DB test riêng. Đây là kiểm nhất quán kỹ thuật của model draft, chưa có duyệt nguồn/claim T2/T4 hoặc trạng thái `VERIFIED`.

## Nâng cấp tương tác bàn thực hành

Nhánh `codex/lab-interaction-upgrade` bổ sung 36 cấu hình mẫu cho 12 chế độ, nhập số có kiểm giới hạn, tốc độ phát/chạy từng bước, chế độ tập trung và thao tác trực tiếp/bàn phím cho ròng rọc, dốc nghiêng và bàn Hóa. Mạch nối tiếp v2 mở rộng ba ô lắp với bóng/điện trở lặp, điện trở 10 Ω, tính tổng công suất bóng đồng nhất ở engine/API/Verify và nhập được phiên v1 hợp lệ. Bàn lab được đặt trước công cụ phụ để hiển thị sớm hơn trên mobile. Kiểm local mới: 114 unit, 650 pytest (2 skip), 52 E2E trên DB test riêng và 7 E2E trên Docker đều đạt; CI/review còn riêng. [Hướng dẫn và giới hạn](LAB-INTERACTIONS.md); [đặc tả](../specs/007-tactile-labs/spec.md). Trạng thái nguồn vẫn draft; con lắc có cản vẫn chỉ minh họa, không ghi số đo có cản.

## 9 bài hiện hành đã tích hợp vào main

Phòng thực hành có 6 bài Vật lí và 3 bài Hóa vô cơ. Ba bài ghép có hai chế độ, tạo thành 12 mô hình hiện hành. Năm mô hình lưu trữ hỗ trợ phiên và nội dung cũ. Học liệu và kết quả khoa học ở trạng thái nháp. Chi tiết triển khai và kiểm thử tại [bàn giao 9 bài](tasks/NINE-LABS.md).

PR Dataset #13 đã merge tại `02d92f2`. Nhánh runbook đã sync main và bổ sung [vận hành LLM](LLM-RUNBOOK.md), [nghiệm thu/backup/rollback](OPERATIONS.md), [sổ chuyển giao](MIGRATION-LEDGER.md). Kiểm local trong lượt này: toàn bộ API trên DB khôi phục riêng đạt **633 passed, 2 skipped** (Chroma/Pint tùy chọn), Ruff đạt; backup custom dump/restore có checksum và đủ sáu bảng khớp số dòng trước khi chạy test. Đây là kiểm local; review/CI của PR runbook và deployment là các bước riêng. LLM live vẫn tắt, cap 0.

## Lịch sử tích hợp

Tích hợp UI/UX PR #14 trên `feature/ui-ux`: giữ canvas/vector/chart con lắc và bốn bàn thực hành SVG mới; nối chúng vào runtime chuẩn `pulley`, `alkali-water`, `copper-nitric`, `chlorine-bleach` và giữ đủ các mode/nhánh lưu trữ của main. Các màn Hóa dùng quan sát định tính từ snapshot thay vì bộ tính riêng không có stage tương ứng. Kiểm local với DB thử riêng: **645 pytest đạt, 2 skip thư viện tùy chọn; 65 E2E Chrome đạt**, gồm 5 ca desktop/mobile mới. Không nâng trạng thái khoa học hoặc bật LLM; trạng thái CI/review xem PR.

Nhánh `feat/docker-release-capabilities` bổ sung metadata web/API và manifest chung cho 9 bài/12 mode, giữ nguyên scope ba pilot Tutor. CI có job Docker dùng PostgreSQL tmpfs riêng, kiểm proxy/owned-run/Tutor template và nạp/recreate image từ archive. Kiểm local trước commit: **645 pytest đạt, 2 skip Chroma/Pint**, **96 unit TypeScript đạt**, Ruff và check:web đạt; smoke Docker và run tồn tại sau recreate đạt. Lượt local dùng `--allow-dirty` nên bundle chỉ dùng phát triển; bản release cần checkout sạch và CI trên SHA cuối. [Hướng dẫn release](DOCKER-RELEASE.md)

Mốc M02 đang tích hợp trên nhánh `feat/full-web-engine-api` (Issue #5). Web, engine, contracts, API, knowledge draft và bộ test liên quan đã được đưa vào B. Xem Issue #5 và PR của nhánh để biết trạng thái tích hợp mới nhất.

| Thành phần | Trạng thái tại B |
| --- | --- |
| Web | 9 lab hiện hành, bài học, soạn/quiz và Lumi UI; đã build |
| Lab engine | 11 model TypeScript/config gồm 9 hiện hành, 2 lưu trữ; 74 unit test đạt |
| API | FastAPI catalog, tính lại preview, phiên/lượt PostgreSQL, retrieval/Tutor; 508 pytest đạt, 9 skip khi không có DB |
| Knowledge | 30 thẻ gồm 10 thẻ reviewed; data CLI lint/build đạt |
| E2E | 33 đạt, 3 skip khi không có PostgreSQL |
| Docker Compose | Web, API và PostgreSQL đã build và chạy healthy local; lab engine chạy trong web container/browser |
| CI | Workflow web, API và E2E PostgreSQL đã cấu hình; xem Actions để biết kết quả mới nhất |
| Khoa học/AI | `pendulum` (`VL-CONLAC-01`) đã `VERIFIED`; các mô hình còn lại Preview/`INSUFFICIENT_DATA`. AI live tắt, budget 0 |

Verify ở B đã có route, recompute Python, scientific stages, schema và golden vectors từ A. Tài liệu phạm vi và stage đã chuyển, điều chỉnh cho B tại `docs/VERIFICATION.md` và `docs/VERIFY-STAGES.md`. Test golden hiện dùng cả TypeScript/Python; mô hình `pendulum` đã được duyệt nguồn và trả `VERIFIED`, các mô hình còn lại tiếp tục là preview/`INSUFFICIENT_DATA`.

Pilot con lắc có hồ sơ claim đã duyệt tại `knowledge/verification/pendulum.json` (`pendulum.draft.json`), gắn revision runtime và nguồn/ca kiểm đã được T2/T4 duyệt (`VER-02`). Web trình bày các stage, giới hạn và nguồn tham khảo của phản hồi Verify.

Kiểm lại sau thay đổi UI/hồ sơ: `npm run check:web`, `npm run test:unit` (74 đạt), `npm run build:web`, Ruff đạt; pytest API với PostgreSQL local 521 đạt, 2 skip, 1 cảnh báo Starlette; Playwright E2E trên Docker web mới với PostgreSQL local 38 đạt. Không tính các ca skip là đạt, và chưa dùng kết quả này làm bằng chứng duyệt nguồn.

Task Verify #9 trên `feature/verifyData`: route runtime nay chặn preview nếu thiếu stage khoa học bắt buộc hoặc trùng tên stage. Kiểm HTTP tại defaults của cả 9 lab hiện hành và 2 model lưu trữ đều trả preview draft với facts/evidence rỗng. Pilot `VL-CONLAC-01` kiểm tỉ lệ chu kỳ khi chiều dài tăng gấp bốn qua route. Ruff và 330 pytest Verify đạt trước ca pilot mới; `test_expansion_routes.py` đạt 29 ca sau khi thêm pilot (1 cảnh báo Starlette). 74 unit TypeScript, check:web và build:web đạt. Toàn bộ API đạt 513 pytest, 9 skip khi không cấp DB test ở lượt trước ca pilot; ca route bị ảnh hưởng đã chạy lại. Nguồn/giả thiết vẫn cần T2/T4 duyệt trước khi mở `VERIFIED`.

Kiểm Verify local 07/11/2026: 325 pytest tại `test_scientific_checks.py`, `test_foundation.py`, `test_expansion_routes.py` đạt (1 cảnh báo Starlette TestClient); 74 unit TypeScript và Ruff đạt. Docker proxy Verify con lắc trả preview, `facts={}`, `evidence=[]`, có `physics_invariants: pass`. Đây là kiểm tích hợp kỹ thuật, chưa phải duyệt nguồn hay chứng nhận khoa học.

Web chạy local trên 5175, API trên 8002, DB B nếu bật là 15434. Không dùng dữ liệu hay volume repo A. Bạn làm UI/UX có thể bắt đầu tại `apps/web/src/`; giữ hợp đồng với engine và API. Các ca PostgreSQL sẽ được xác nhận bằng CI trước merge.

Kiểm Docker local 07/11/2026: `docker compose config --quiet` và build web/API đạt; `up -d --wait web` cho DB, API, web đều healthy. Web `/`, `/healthz`, proxy `/api/v1/labs` và API `/ready` đều trả HTTP 200. Chrome headless mở con lắc, canvas hiện, đồng hồ tăng khi chạy, không có lỗi JavaScript. Chưa kiểm toàn bộ E2E trên container hoặc triển khai cloud.
