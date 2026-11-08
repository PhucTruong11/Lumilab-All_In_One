# Golden fixtures khoa học

Các fixture là ca hồi quy cho mô hình lý tưởng, chưa phải nguồn đã được giáo viên duyệt. Giữ nguyên đơn vị, giả thiết và `model_version`/`dataset_version` khi thêm hoặc sửa ca. Expected cần có phép tính hoặc nguồn đối chiếu độc lập; không sinh expected bằng chính hàm đang kiểm.

| File | Phạm vi | Test sử dụng |
| --- | --- | --- |
| `react-labs.json` | Chuẩn độ và mạch điện client | `packages/lab-engine/src/react-labs.test.ts` |
| `expanded-labs.json` | Newton II, lò xo, pin chuẩn, đếm hạt | `packages/lab-engine/src/expanded-models.test.ts` |
| `additional-labs.json` | Mạch hai tải, RC, kết tủa, sinh khí | `packages/lab-engine/src/additional-models.test.ts`, `apps/api/tests/test_additional_readings.py`, `test_expansion_routes.py`, `test_scientific_checks.py` |
| `server-readings.json` | 11 model runtime, gồm 9 hiện hành và 2 lưu trữ | `packages/lab-engine/src/server-readings.test.ts`, `apps/api/tests/test_foundation.py`, `test_scientific_checks.py` |

Python counterpart và route Verify dùng `server-readings.json` cùng `additional-labs.json` để đối chiếu TypeScript/Python; hai file còn lại là ca client bổ sung. Test qua không nâng nguồn hoặc kết quả lên `VERIFIED`.

Khi đổi model, cập nhật fixture cùng lý do, nguồn, tolerance theo từng đại lượng và test cả đường client/server liên quan. Xem `docs/VERIFICATION.md`, `docs/VERIFY-STAGES.md` và từng `packages/lab-engine/labs/<id>/lab.json` để biết giới hạn mô hình.
