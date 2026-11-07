# LumiLab B — quy tắc làm việc

Đọc `README.md`, `docs/STATUS.md` và task trước khi sửa. Repo B được xây từng mốc; chỉ công bố chức năng có thật và đã kiểm ở B.

- Kiểm tra `git status --short`; mỗi task có owner, branch và paths rõ. Giữ thay đổi của người khác.
- Đưa từng module cùng dependency, contract và test. Registry và UI chỉ công bố module đã triển khai.
- Engine/verifier tính số liệu. AI không đặt số đo hoặc trạng thái kiểm chứng. Nguồn chưa duyệt giữ draft/preview, không VERIFIED.
- Mặc định AI live tắt, ngân sách 0. Secret ở server env, không đưa vào Git hoặc biến `VITE_*`.
- Không đổi contract chung khi chưa trao đổi với owner liên quan. Không xóa dữ liệu, reset volume hoặc force push để sửa lỗi.
- Bàn giao bằng diff, lệnh kiểm tra thực tế, kết quả và giới hạn.

M01: `npm ci`, `npm run dev:web`, `npm run check:web`, `npm run build:web`; API qua `apps/api` theo README. Các thư mục có `.gitkeep` là chỗ cho mốc sau, không phải implementation.
