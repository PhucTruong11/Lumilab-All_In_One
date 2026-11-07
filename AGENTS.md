# LumiLab B — quy tắc làm việc

Repo B có web, lab engine, contract và API đang chạy. Đọc `README.md`, `docs/STATUS.md`, task/Issue được giao và hướng dẫn `AGENTS.md` ở thư mục module trước khi sửa. Kiểm `git status --short`, giữ thay đổi của người khác; mỗi task dùng branch và paths rõ.

- Web render snapshot từ engine. Thay UI/UX không được đổi số liệu hoặc bỏ tương tác kéo thả/keyboard. Kiểm responsive, trạng thái lỗi/loading/empty và thao tác thực.
- Engine và API tính số độc lập theo đơn vị/điều kiện rõ. Không cho LLM đặt số đo hay trạng thái khoa học. Dữ liệu chưa duyệt giữ draft/preview, không VERIFIED.
- Contract chung đổi cùng schema, Python model, TypeScript consumer và test. Chỉ đăng ký lab có implementation.
- API kiểm phiên và quyền sở hữu trước khi đọc/lưu run. UUID không thay token. DB thiếu là lỗi hạ tầng, không phải sai khoa học.
- AI live mặc định tắt, event cap 0. Secret chỉ ở server env/secret store, không vào Git hoặc `VITE_*`. Không gọi provider trong CI/health.
- Không xóa DB/volume, reset quota hoặc force push để sửa lỗi. Bàn giao bằng diff, lệnh kiểm thực, kết quả, giới hạn và dependency.

Cổng local B: web 5175, API 8002, PostgreSQL 15434. Check chính: `npm run check:web`, `npm run test:unit`, `npm run build:web`, Ruff, pytest và E2E theo README. Trước merge cần CI có PostgreSQL đạt.
