# PHASE E — Docker / Local Runtime Acceptance

**Trạng thái tại môi trường Muse: NOT RUN** (không có Docker Engine trong VM này — đã kiểm tra lại trong đợt này). Cấu hình Compose đã đối chiếu tại HEAD `b7e333bb`: không đổi so với baseline (project `lumilab-b-dev`; web 5175, api 8002, db 15434; chroma profile `rag`).

**Bằng chứng liên quan đã có trong đợt này (không phải Docker):** cùng một stack ứng dụng đã chạy thật **không qua Docker** trong môi trường Muse: PostgreSQL 18.6 local (cổng 15434) + API (uvicorn do Playwright webServer điều phối) + web (Vite) — xem TUTOR_01/TUTOR_02. Đội dự án cũng đã tự nghiệm thu Docker local ngày 07/11/2026 (ghi trong `docs/STATUS.md`: build đạt, 3 service healthy, proxy và `/ready` trả 200, Chrome headless mở được lab con lắc).

## Checklist PowerShell cho chủ dự án (chạy tại thư mục repo, branch main)

```powershell
git pull origin main
docker compose -f docker/compose.yml config --quiet
docker compose -f docker/compose.yml up -d --build --wait web
docker compose -f docker/compose.yml ps
# Kỳ vọng: db, api, web đều healthy

curl.exe -s http://127.0.0.1:5175/healthz
curl.exe -s http://127.0.0.1:8002/ready
curl.exe -s http://127.0.0.1:5175/api/v1/labs
curl.exe -s -X POST http://127.0.0.1:8002/api/v1/retrieval/query -H "Content-Type: application/json" -d '{\"lab_id\":\"pendulum\",\"query\":\"khối lượng chu kỳ\",\"retrieval_method\":\"hybrid\"}'
# Kỳ vọng retrieval: status FOUND (artifact draft trong image), method local-hybrid-hash

# Kiểm tra persistence: tạo session + lưu run qua UI (http://127.0.0.1:5175),
# sau đó restart stack và xác nhận run còn đọc được:
docker compose -f docker/compose.yml restart
docker compose -f docker/compose.yml ps

# Chạy E2E trên stack đang chạy (nếu muốn kiểm tra độc lập với CI):
$env:LUMILAB_DATABASE_URL = "postgresql+psycopg://<user>:<pass>@127.0.0.1:15434/<db>"
npm run test:e2e

docker compose -f docker/compose.yml stop   # dừng, GIỮ nguyên volume
```

**Cấm:** `docker compose down -v` (xóa volume `postgres_data`/`chroma_data`). Không dùng dữ liệu/volume của repo A.

## Tiêu chí đóng acceptance
Cả ba service healthy; `/healthz` + `/ready` + proxy `/api/v1/labs` trả 200; retrieval hybrid trả FOUND với artifact trong image; run đã lưu còn tồn tại sau `restart`; E2E (nếu chạy) đạt. Khi chủ dự án chạy xong checklist, gửi lại output của `ps` và các curl để Muse ghi nhận PASS chính thức vào báo cáo này.
