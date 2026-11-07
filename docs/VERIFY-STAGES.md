# Kiểm tra khoa học theo stage · bản nháp trong repo B

Chuyển và điều chỉnh từ `PhucTruong11/lumilab` tại commit `f5f233f8dc2ee21934e6b77c740e7959fecb102a`, file `docs/VERIFY-STAGES.md`. Các stage dưới đây mô tả code hiện có trong B.

`apps/api/src/lumilab_api/scientific_checks.py` bổ sung hàm thuần
`check_science(lab_id, parameters, reading, elapsed_s)`. Đầu vào cần qua JSON Schema,
kiểm phiên bản và tính lại ở server trước. Hàm trả danh sách `stage`, `status`,
`code`, `reason`; không duyệt học liệu, không tạo facts đáng tin cậy và không tự
trả trạng thái cuối `VERIFIED`. Nhãn stage `pass` chỉ có nghĩa kiểm tra cụ thể
đó qua, khác với trạng thái khoa học cuối của một lượt.

| Stage | Nội dung thực hiện | Giới hạn |
| --- | --- | --- |
| `formula_equation` | Đếm nguyên tử trong phương trình catalog; đối chiếu phương trình của reading | Cân bằng không chứng minh phản ứng xảy ra |
| `charge_balance` | Ghi rõ `skipped` với parser công thức trung hòa | Chưa có parser ion hoặc kiểm điện tích tổng quát |
| `scientific_rules` | Tra danh mục phản ứng hỗ trợ và điều kiện cố định của mô hình | Catalog vẫn draft, chưa thay thế KB được duyệt |
| `quantitative` | Đối chiếu mol ban đầu, phản ứng, dư, khối lượng/thể tích và chuyển mL → L | Dùng mô hình lý tưởng đã khai báo |
| `simulation` | Kiểm trạng thái trước/sau: pH, chỉ thị minh họa, có kết tủa/khí và chất giới hạn | Không mô phỏng động học hoặc chứng nhận hiện tượng thực nghiệm |
| `physics_invariants` | Kiểm các bất biến riêng của mô hình vật lí | Không áp dụng cân bằng phản ứng hóa học cho vật lí |

Các stage dùng `pass`, `invalid`, `unsupported`, `insufficient_data`, `skipped`.
Caller ánh xạ lỗi về bốn trạng thái công khai của API. Nguồn chưa duyệt vẫn
chặn `VERIFIED`, kể cả khi mọi stage đang áp dụng đều qua.

## Catalog hóa học đang hỗ trợ

- Chuẩn độ: HCl hoặc HNO₃ với NaOH hoặc KOH, mạnh và 1:1; axit ban đầu
  25 mL, nồng độ hai dung dịch 0,1 mol/L, 25°C, thể tích cộng được. Kiểm
  `[H⁺] − Kw/[H⁺] = (n_axit − n_bazơ)/V`, `Kw = 10⁻¹⁴` và pH. Màu chỉ thị
  là nội suy để vẽ, không phải nồng độ hoặc cường độ màu đo thực.
- Kết tủa: `AgNO₃ + NaCl → AgCl + NaNO₃`, hai dung dịch 0,1 mol/L,
  chuyển hóa hết chất giới hạn theo tỉ lệ 1:1; dùng `M(AgCl) = 143,32 g/mol`.
  Chưa giải cân bằng độ tan, tác động lực ion hoặc thời gian tạo hạt.
- Sinh khí: `HCl + NaHCO₃ → NaCl + H₂O + CO₂`, HCl 0,1 mol/L,
  `M(NaHCO₃) = 84,0066 g/mol`; tính khí khô lý tưởng bằng `PV = nRT`
  ở 298,15 K và 1 atm. Bỏ qua CO₂ hòa tan và hơi nước, không phải khí thu
  thực tế trong một dụng cụ cụ thể.

Đây là kiểm tính nhất quán với mô hình draft. Các hằng số/giả thiết vẫn cần
T1/T2 duyệt nguồn theo quy trình của dự án; module này không thay đổi nhãn
duyệt hoặc quyền dùng dữ liệu.

## Parser có giới hạn rõ

`parse_formula()` nhận công thức ASCII trung hòa gồm các nguyên tố H, C, O,
N, Na, Cl, Ag, K và chỉ số nguyên 1–999; tối đa 64 ký tự và 16 token. Hàm
không nhận dấu điện tích, ngoặc, hydrate, dấu chấm hoặc chỉ số Unicode. Các
cú pháp ngoài phạm vi trả `UnsupportedFormula`; sai cú pháp trong grammar trả
`FormulaSyntaxError`. Không suy ra một chất không tồn tại từ việc parser không
hỗ trợ. `equation_is_balanced()` kiểm hệ số nguyên dương của phương trình
được cung cấp, không tự đoán sản phẩm hoặc cân bằng mọi phản ứng.

## Vật lí và tolerance

- Con lắc: đối chiếu chu kỳ bằng chuỗi elliptic độc lập với AGM của engine,
  kiểm thế năng/vận tốc và trạng thái góc 0°; mô hình hiện giới hạn 0–90°.
- Newton II: `a = F/m`, động năng và định lí công–động năng.
- Lò xo: lực Hooke, tần số, động/thế năng và bảo toàn cơ năng.
- Mạch nối tiếp: tổng trở, cách mắc đồng hồ, công tắc, Ôm và công suất.
- Mạch hai tải: tổng trở nối tiếp/song song, dòng nhánh, KCL/KVL và công suất.
- RC: hàm mũ ở thời điểm reading khai báo, dấu dòng nạp/xả, `Q = CU`,
  `E = CU²/2`. Caller vẫn phải ràng buộc thời điểm với snapshot đã tính lại.
- Lò xo có cản: đối chiếu li độ, vận tốc, đường bao, chu kỳ và cơ năng tại thời điểm request; dốc: đối chiếu lực, quãng đường, vận tốc, thời gian dừng ở cuối dốc và nhãn trạng thái; ròng rọc: lực, dây kéo và công nâng tải. Các ca Hóa định tính đối chiếu cả phần diễn giải theo kịch bản, vẫn ghi `quantitative: skipped`.
- Hai model cũ được giữ để đọc lịch sử: đếm hạt kiểm A/Z/điện tích và tổng
  electron; pin chuẩn kiểm hiệu điện thế chuẩn, dấu vôn kế và cầu muối.

Đối chiếu số dùng sai số tương đối `2×10⁻⁹` và sai số tuyệt đối mặc định
`10⁻¹²` theo đơn vị của từng trường. Kiểm điện tích dung dịch dùng sai số
tuyệt đối `10⁻¹² mol/L` gần tương đương để tránh chia theo đại lượng gần 0.
Không dùng sai số này làm độ không đảm bảo đo của thí nghiệm thật.

Kiểm riêng: `python -m pytest apps/api/tests/test_scientific_checks.py -q`.
Các ca gồm số mol/khối lượng biết trước, pH tại tương đương, khí ở 25°C khác
STP, gần tương đương, thiếu dữ liệu, công thức ngoài grammar và readings giả.
