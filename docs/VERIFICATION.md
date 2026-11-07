# Scientific Verifier trong repo B: phạm vi và cách nghiệm thu

Chuyển và điều chỉnh từ `PhucTruong11/lumilab` tại commit `f5f233f8dc2ee21934e6b77c740e7959fecb102a`, file `docs/VERIFICATION.md`. Mô tả hiện trạng dưới đây áp dụng cho mã Verify đã có trong B; đây không phải chứng nhận khoa học tổng quát cho mọi mô hình.

Hiện có 17 bộ tính Python đối chiếu TypeScript. Danh mục gồm 12 mô hình thuộc 9 bài và 5 mô hình lưu trữ. Route runtime kiểm schema/revision, tính lại và chạy scientific_checks cho catalog đã hỗ trợ. Các bước ghi stage/status/code/reason trong stage_checks. Schema, bảo toàn nguyên tố của phương trình catalog, điều kiện cố định, định lượng và bất biến đã có kiểm thử. Parser chỉ hỗ trợ công thức trung hòa phẳng; ionic charge_balance ghi skipped; units chuyển tường minh theo tên trường, chưa có pint runtime.

Với các mô hình dữ liệu/nguồn chưa duyệt, kết quả hợp lệ vẫn INSUFFICIENT_DATA/REVIEWED_EVIDENCE_REQUIRED, preview có số đọc, facts/evidence rỗng. Riêng mô hình pilot `pendulum` (`VL-CONLAC-01`) đã hoàn tất phê duyệt khoa học và nguồn T2/T4 (`VER-02`) tại [`knowledge/verification/pendulum.json`](../knowledge/verification/pendulum.json) và [`knowledge/verification/pendulum.draft.json`](../knowledge/verification/pendulum.draft.json), nên khi mọi stage bắt buộc đạt và tham số nằm trong phạm vi AGM đã duyệt, API nâng trạng thái lên `VERIFIED / VERIFIED` kèm `facts` và `evidence` (`VL-CONLAC-01:period-agm`, `VL-CONLAC-01:length-ratio`, `VL-CONLAC-01:small-angle-learning`). Kết quả vi phạm invariant không được trả preview để lưu. Xem [các stage đang chạy và giới hạn](VERIFY-STAGES.md) và [contract của B](CONTRACT.md).

Route runtime chỉ trả preview khi các stage bắt buộc của từng mô hình đều `pass`. Các mô hình kiểm bất biến dùng `physics_invariants`. Các bài phản ứng có định lượng cần `formula_equation`, `scientific_rules`, `quantitative` và `simulation`. Ba bài Hóa định tính cần `simulation` để đối chiếu hiện tượng và phương trình với kịch bản. Stage `quantitative` của ba bài này ghi `skipped` vì mô hình chỉ trả quan sát định tính.

Với sáu mô hình thuộc dataset 9 bài, Verify còn đối chiếu thời điểm mô phỏng với request, quỹ đạo/biên độ lò xo có cản, trạng thái vật trên dốc, công nâng tải trực tiếp và phần diễn giải của ba kịch bản Hóa. Đây là kiểm tính nhất quán của mô hình nháp, chưa xác nhận nguồn hay hiện tượng thực nghiệm.

Thiếu stage bắt buộc hoặc lặp tên stage trả `INSUFFICIENT_DATA/SCIENTIFIC_CHECKS_INCOMPLETE` với `preview=null`. Các stage đạt yêu cầu cho phép xem preview nháp; chỉ mô hình có hồ sơ claim được T2/T4 duyệt đầy đủ (`verified_eligible: true`, khớp revision và miền tham số) mới mở cổng `VERIFIED`.

Pilot dataset `VL-CONLAC-01` ánh xạ tới runtime `pendulum`. Ca hai chiều dài 0,4 m và 1,6 m ở cùng góc 10° và cùng `g` kiểm tỉ lệ chu kỳ 2 qua route; cả hai trả `VERIFIED` với bằng chứng đã duyệt. Công thức góc nhỏ $T \approx 2\pi\sqrt{L/g}$ chỉ áp dụng cho góc khác 0 đến 10° (sai số tương đối < 0,2% so với AGM), còn runtime AGM hỗ trợ đến 90°.

Hồ sơ claim đã duyệt của pilot nằm ở [`knowledge/verification/pendulum.json`](../knowledge/verification/pendulum.json) (đồng bộ với [`knowledge/verification/pendulum.draft.json`](../knowledge/verification/pendulum.draft.json)). Hồ sơ gắn đúng `lab_id`, `model_version`, `dataset_version`, giả thiết, phạm vi tham số, nguồn tham khảo và ca hồi quy với từng claim. T2 (Trương Trọng Phúc) đã xác nhận công thức AGM, ca đối chiếu độc lập, miền và sai số của xấp xỉ góc nhỏ; T4 (Văn Nam) đã kiểm vị trí nguồn, quyền sử dụng và phạm vi claim (`VER-02`). API nạp hồ sơ claim và kiểm tra chữ ký reviewer/date, trạng thái review của từng claim, revision runtime và miền tham số trước khi trả `VERIFIED`. Nếu hồ sơ thiếu chữ ký, lệch revision hoặc bị hạ về `draft`, API tự động giữ `INSUFFICIENT_DATA / REVIEWED_EVIDENCE_REQUIRED`.

Web đọc `stage_checks`, `checks_skipped` và `limitations` của phản hồi Verify, hiển thị trạng thái `Đã kiểm chứng (VERIFIED)` cho mô hình đã duyệt hoặc `Dữ liệu chưa duyệt` cho mô hình nháp. Kết quả được gắn phiên bản và thời điểm snapshot; đổi tham số hoặc thời điểm sẽ báo kết quả thuộc lượt cũ. Phản hồi `INVALID`, `UNSUPPORTED`, thiếu stage hoặc sai revision không được lưu thành preview.

Nút **Xem toàn bộ số liệu máy chủ** trình bày đối tượng `preview` bằng nhãn tiếng Việt, đơn vị và số làm tròn; các số trong đó do Python recompute tại API tạo ra, không đọc từ một file kết quả tĩnh. Ví dụ `gas-reaction` ghi thể tích CO₂ là lý thuyết của khí khô lý tưởng ở 25°C và 1 atm. Lịch sử JSON tải về giữ giá trị gốc để đối chiếu kỹ thuật. Cách hiển thị không thay công thức hoặc trạng thái Verify.

## Việc còn cần làm để mở rộng chứng nhận sang các mô hình khác

- Đã có hồ sơ claim được duyệt và cổng `VERIFIED` cho `pendulum` (`VL-CONLAC-01`); 16 mô hình còn lại chưa có hồ sơ theo từng claim nối nguồn, điều kiện, revision, ca đối chiếu độc lập và sai số nên vẫn giữ preview nháp (`INSUFFICIENT_DATA`).
- T2 cần kiểm các giả thiết và giá trị chuẩn trong phạm vi từng mô hình tiếp theo; T4 cần kiểm vị trí nguồn và quyền dùng cho đúng loại nội dung. Ghi reviewer/ngày thực tế sau review; không suy ra quyền nhập văn bản nguồn vào corpus chỉ từ liên kết tham khảo.
- T3 chỉ mở thêm nhánh `VERIFIED` cho mô hình mới sau khi có hồ sơ được duyệt, kiểm stage bắt buộc và ca PostgreSQL/CI trên revision cuối.

Hai route P0 body phẳng giữ tương thích sàng lọc; route runtime /labs/ID mới có các stage mở rộng và cổng `VERIFIED`. Nguồn RAG và LLM không quyết định kết quả Verify. Chưa hỗ trợ mọi chất, ion, phương trình hay điều kiện phản ứng.

Bảng dưới đây là **thiết kế mục tiêu**, không phải checklist đã hoàn thành.

| Lớp | Kiểm tra | P0 | Ca kiểm tra cần có |
| --- | --- | --- | --- |
| 1 Schema | kiểu/bounds, finite, required fields, units | Pydantic + JSON Schema, không chấp nhận NaN/Infinity | thiếu temperature; volume âm; chuỗi thay số |
| 2 Formula/equation | cú pháp, atom/charge balance, hệ số | grammar nhỏ cho HCl/NaOH/NaCl/H2O; coefficients nguyên dương | mất O/H, hệ số sai, công thức ngoài grammar |
| 3 Scientific rules | phản ứng, sản phẩm, điều kiện | lookup reviewed KB; neutralization mạnh 1:1 ở 25°C | axit yếu, sản phẩm lạ, nhiệt độ ngoài scope |
| 4 Quantities | n, C, V, limiting reagent, units | Python + pint, mL→L, finite và tolerance có giải thích | 25mL bị hiểu là25L; mol dư gần tương đương |
| 5 Simulation | trước/sau, stoichiometry, amounts, observation | server recompute + conservation, pH/Kw; indicator là minh họa | lượng âm, tạo kết tủa giả, pH client giả |

Bảo toàn điện tích phải có cách biểu diễn charge rõ. Parser P0 trung hòa không phải parser ion tổng quát; lớp ionic check không áp dụng phải ghi lý do. Không hứa cân bằng mọi phản ứng từ đầu; kiểm hệ số của catalog đã hỗ trợ trước.

Physics: kiểm bounds/units, mô hình chất điểm không ma sát, T theo AGM và độc lập khối lượng, bảo toàn năng lượng, stationary release 0. Không thay bằng T góc nhỏ khi kéo 90°.

## Trạng thái

- VERIFIED: đủ dữ kiện, đúng phạm vi, nguồn được duyệt và các lớp bắt buộc qua (hiện đã kích hoạt cho `pendulum` `VL-CONLAC-01`).
- INVALID: dữ kiện khoa học mâu thuẫn trong model/grammar đã hỗ trợ.
- UNSUPPORTED: bài/chất/điều kiện ngoài phạm vi hoặc parser chưa hỗ trợ. Không kết luận chất không tồn tại.
- INSUFFICIENT_DATA: thiếu thông tin cần thiết hoặc chưa có evidence được duyệt. Payload malformed vẫn HTTP422 trước domain layer.

## Golden cases đầu tiên

Nguồn/giới hạn trong `packages/lab-engine/labs/*/lab.json` và `knowledge/sources/` cần được T2/T4 review trước khi chuyển thành dataset approved.

- Pendulum L=1m,g=9.81,10°: khoảng2.010s; 90°: khoảng2.368s; đổi mass T không đổi. Dùng quadrature/RK4 độc lập để so thay vì chép expected từ cùng hàm.
- HCl25mL0.1M, NaOH0.1M: 0mL pH≈1; 24.95mL≈4;25mL=7 không màu;25.05mL≈9.999566;50mL≈12.522879. Tính tự điện li nước, tránh cancellation khi base dư.
- Near-equivalence ±1e-10mL liên tục/finite. Số mol bảo toàn; màu là nội suy của chỉ thị, không phải đo thực nghiệm.
- Không đủ nguồn, sai đơn vị, outside catalog, forged facts, conditions thiếu đều có status/code riêng.

Fixture format trong `tests/golden/README.md`; `server-readings.json` và `additional-labs.json` chạy ở cả Vitest và pytest. Tolerance theo đại lượng, không dùng một epsilon cho mọi test. Khi model đổi, review fixture và ghi revision/lý do, không chỉ cập nhật expected để test xanh.


## Kiểm Verify trong B

Từ root repo B, chạy:

```powershell
.\.venv\Scripts\python.exe -m ruff check apps/api
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_scientific_checks.py apps/api/tests/test_foundation.py apps/api/tests/test_expansion_routes.py apps/api/tests/test_curriculum_labs.py -q
npm run test:unit
```

Với Compose đang healthy, dùng `POST /api/v1/verification/labs/{lab_id}` qua web proxy `http://127.0.0.1:5175`. So sánh `model_version`, `dataset_version`, `parameters` và `elapsed_s` với `packages/lab-engine/labs/<id>/lab.json`. Với `pendulum`, kết quả hợp lệ trong phạm vi AGM trả `VERIFIED / VERIFIED` cùng `facts` và `evidence`; các mô hình chưa duyệt khác tiếp tục trả `INSUFFICIENT_DATA / REVIEWED_EVIDENCE_REQUIRED`, `facts` và `evidence` rỗng.
