# Scientific Verifier trong repo B: phạm vi và cách nghiệm thu

Chuyển và điều chỉnh từ `PhucTruong11/lumilab` tại commit `f5f233f8dc2ee21934e6b77c740e7959fecb102a`, file `docs/VERIFICATION.md`. Mô tả hiện trạng dưới đây áp dụng cho mã Verify đã có trong B; đây không phải chứng nhận khoa học hoặc quyền duyệt nguồn.

Hiện có 11 bộ tính Python đối chiếu TypeScript, 9 lab hiện hành và 2 lab lưu trữ. Route runtime kiểm schema/revision, tính lại và chạy scientific_checks cho catalog đã hỗ trợ. Các bước ghi stage/status/code/reason trong stage_checks. Schema, bảo toàn nguyên tố của phương trình catalog, điều kiện cố định, định lượng và bất biến đã có kiểm thử. Parser chỉ hỗ trợ công thức trung hòa phẳng; ionic charge_balance ghi skipped; units chuyển tường minh theo tên trường, chưa có pint runtime.

Dữ liệu/nguồn chưa duyệt nên kết quả hợp lệ vẫn INSUFFICIENT_DATA/REVIEWED_EVIDENCE_REQUIRED, preview có số đọc, facts/evidence rỗng. Kết quả vi phạm invariant không được trả preview để lưu. Chưa có nhánh tự động nâng VERIFIED. Xem [các stage đang chạy và giới hạn](VERIFY-STAGES.md) và [contract của B](CONTRACT.md).

Route runtime chỉ trả preview khi các stage bắt buộc của model đều `pass`: `physics_invariants` cho model Vật lí, hoặc `formula_equation`, `scientific_rules`, `quantitative`, `simulation` cho model Hóa. Thiếu stage bắt buộc hoặc lặp tên stage trả `INSUFFICIENT_DATA/SCIENTIFIC_CHECKS_INCOMPLETE` với `preview=null`. `charge_balance` của Hóa vẫn `skipped` vì parser hiện chỉ hỗ trợ công thức trung hòa; cổng này không thay thế duyệt evidence.

Pilot dataset `VL-CONLAC-01` ánh xạ tới runtime `pendulum`. Ca hai chiều dài 0,4 m và 1,6 m ở cùng góc 10° và cùng `g` kiểm tỉ lệ chu kỳ 2 qua route; cả hai vẫn là preview draft. Công thức góc nhỏ trong dataset chỉ được dùng trong miền góc nhỏ, còn runtime AGM hỗ trợ đến 90°.

Hai route P0 body phẳng giữ tương thích sàng lọc; route runtime /labs/ID mới có các stage mở rộng. Nguồn RAG và LLM không quyết định kết quả Verify. Chưa hỗ trợ mọi chất, ion, phương trình hay điều kiện phản ứng.

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

- VERIFIED: đủ dữ kiện, đúng phạm vi, nguồn được duyệt và các lớp bắt buộc qua.
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
.\.venv\Scripts\python.exe -m pytest apps/api/tests/test_scientific_checks.py apps/api/tests/test_foundation.py apps/api/tests/test_expansion_routes.py -q
npm run test:unit
```

Với Compose đang healthy, dùng `POST /api/v1/verification/labs/{lab_id}` qua web proxy `http://127.0.0.1:5175`. So sánh `model_version`, `dataset_version`, `parameters` và `elapsed_s` với `packages/lab-engine/labs/<id>/lab.json`. Kết quả hợp lệ phải vẫn là `INSUFFICIENT_DATA / REVIEWED_EVIDENCE_REQUIRED`, `facts` và `evidence` rỗng. Không gắn `VERIFIED` khi chưa có nguồn được duyệt và gate đầy đủ.
