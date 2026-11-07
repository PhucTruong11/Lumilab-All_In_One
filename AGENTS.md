# LumiLab B — quy tắc làm việc

Repo này được xây từng mốc. Đọc `README.md`, `docs/STATUS.md` và GitHub Issue của task trước khi sửa.

- Kiểm tra nhánh và thay đổi hiện có; mỗi task có owner, branch và paths rõ trên Issue chung.
- Chỉ ghi tính năng, lệnh chạy và kết quả test đã có thật trong B. Không lấy kết quả của repo khác làm bằng chứng B.
- Đưa từng module cùng dependency, contract và test; registry và UI chỉ công bố module đã triển khai.
- Engine/verifier tính số liệu. AI không đặt số đo hoặc trạng thái kiểm chứng. Nguồn chưa duyệt chỉ là draft/preview, không VERIFIED.
- Mặc định AI live tắt, ngân sách 0. Không đưa secret vào Git hoặc biến `VITE_*`.
- Không đổi contract chung khi chưa trao đổi với owner liên quan. Không xóa dữ liệu, reset volume hoặc force push để sửa lỗi.
- Bàn giao mỗi task bằng diff, lệnh kiểm tra thực tế, kết quả, giới hạn và bước tiếp theo.

M00 chỉ có khung làm việc. Thêm lệnh cài/chạy vào README khi ứng dụng tương ứng đã tồn tại.
