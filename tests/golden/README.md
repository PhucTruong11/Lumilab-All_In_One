# Shared scientific fixtures — T2-1

`react-labs.json` chứa các ca chuẩn độ/mạch điện dùng chung giữa Vitest TS và Node legacy. Nguồn, giả thiết, revision và tolerance có trong file; vẫn là draft chờ T2/T4 duyệt, không phải dataset đã approved. Python counterparts chưa triển khai nên chưa có kiểm cross-language Python. Nguồn/model trong `SCIENCE.md`.

T2 thêm JSON theo format: id, lab_id, model_version, dataset_version, parameters với units rõ, expected facts/status, tolerance theo field, evidence/source section và assumptions. T4 review scientific provenance. Cả Vitest và pytest đọc cùng vectors. Dùng ít nhất một phép tính/nguồn kiểm độc lập, không tạo expected bằng chính hàm đang test.

`expanded-labs.json` bổ sung4model client: Newton II, Hookespring, thế pin chuẩn có dấu và đếm hạt. Các expected dựa trên phép tính độc lập có units/assumptions/sources, chưa T2/T4approved. Runtime tests bao gồm7config/sessionroundtrip và đọc đúng elapsed_s khi khôi phục2lab động. Không có Python counterpart cho4model này.
