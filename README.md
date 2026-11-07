# LumiLab B

LumiLab là phòng thí nghiệm ảo Vật lí/Hóa học cho THPT. Repo B hiện có web React/TypeScript với **9 lab đang dùng**, engine tính toán TypeScript và API FastAPI tính lại độc lập. Hai model cũ chỉ phục vụ tương thích phiên. Số liệu và học liệu vẫn ở trạng thái draft/preview; chưa có VERIFIED hay AI live.

## Chạy local

Cần Node 24 và Python 3.13. Tại root repo B:

```powershell
npm ci
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r docker/requirements-dev.lock
.\.venv\Scripts\python.exe -m pip install --no-deps -e apps/api
.\.venv\Scripts\python.exe -m lumilab_api.data_cli build --include-drafts
```

Terminal 1:

```powershell
.\.venv\Scripts\python.exe -m uvicorn lumilab_api.main:app --reload --port 8002 --no-access-log
```

Terminal 2:

```powershell
npm run dev:web
```

Web: http://127.0.0.1:5175 · API docs: http://127.0.0.1:8002/docs · liveness: http://127.0.0.1:8002/health . Vite chuyển `/api` sang API B. Không cần DB để xem và thao tác lab, dùng engine browser, xem preview từ server và đọc học liệu draft. Không có DB, `/ready` và các chức năng lưu lượt/gia sư theo phiên trả trạng thái chưa sẵn sàng.

## PostgreSQL local khi cần lịch sử phiên

Compose B dùng project `lumilab-b-dev`, cổng DB `15434` và volume riêng:

```powershell
docker compose -f docker/compose.yml up -d --wait db
$env:LUMILAB_DATABASE_URL='postgresql+psycopg://lumilab:lumilab_local_only@127.0.0.1:15434/lumilab'
.\.venv\Scripts\python.exe -m lumilab_api.run_schema
```

Chạy API trong cùng terminal có biến DB. Dừng bằng `docker compose -f docker/compose.yml stop`; giữ volume. Mật khẩu trong Compose chỉ dùng local. Không đưa key hoặc `.env` thật lên Git.

## Kiểm tra

```powershell
npm run check:web
npm run test:unit
npm run build:web
.\.venv\Scripts\python.exe -m ruff check apps/api
.\.venv\Scripts\python.exe -m pytest apps/api/tests
$env:Path = "$PWD\.venv\Scripts;$env:Path"
npm run test:e2e
```

E2E không có DB sẽ bỏ qua các ca lưu phiên; CI chạy chúng với PostgreSQL test. Mọi kiểm AI provider đều dùng fake/local, không gọi live trong CI.

## Làm UI/UX

Giao diện và tương tác nằm trong `apps/web/src/main.tsx`, `apps/web/src/components/` và các file CSS ở `apps/web/src/`. Cấu hình lab và phép tính nằm trong `packages/lab-engine/`; API và tính lại server nằm trong `apps/api/`. JSON Schema dùng chung ở `packages/contracts/`. Đọc `AGENTS.md`, `docs/STATUS.md` và `docs/CONTRACT.md` trước khi sửa luồng dữ liệu hoặc số đo.
