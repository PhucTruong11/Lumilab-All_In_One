# LumiLab B

LumiLab là phòng thí nghiệm ảo Vật lí và Hóa học cho THPT. Bản hiện tại có web React/TypeScript, 9 lab đang dùng, lab engine chạy trong trình duyệt và API FastAPI tính lại số đo. Học liệu và kết quả khoa học vẫn ở trạng thái **draft/preview**; chưa có `VERIFIED` hoặc AI live. Xem [trạng thái triển khai](docs/STATUS.md), [contract](docs/CONTRACT.md) và [phạm vi Verify](docs/VERIFICATION.md) trước khi tích hợp thêm chức năng.

## Bắt đầu nhanh cho team

Làm việc trên branch/commit của **repo B** đã chứa `docker/compose.yml`, `docker/web.Dockerfile` và toàn bộ `apps/`, `packages/`, `knowledge/`. Chạy các lệnh dưới đây từ root repo. Cần Docker Desktop (hoặc Docker Engine + Compose v2) đang chạy và các cổng local **5175, 8002, 15434** còn trống. Lần build đầu cần mạng để tải image và dependencies.

**Windows PowerShell:**

```powershell
.\scripts\Start-LumiLab.ps1
```

Script kiểm Docker, build và khởi động stack, rồi xác nhận web và API catalog. Nếu máy chặn chạy `.ps1`, dùng lệnh Compose trực tiếp như trên macOS/Linux:

```sh
docker compose -f docker/compose.yml up -d --build --wait web
docker compose -f docker/compose.yml ps
```

Mở **http://127.0.0.1:5175**. API docs: **http://127.0.0.1:8002/docs**. `up ... web` cũng khởi động API và PostgreSQL vì chúng là dependencies. Lab engine là mã client nằm trong web image, **không có service lab riêng**. Nginx trong web container chuyển `/api/*` sang API container; API tạo schema ban đầu sau khi DB khỏe. Compose giữ dữ liệu DB trong volume `lumilab-b-dev_postgres_data`, tách khỏi repo A.

| Service | Vai trò | Cổng trên máy |
| --- | --- | --- |
| `web` | Trang web, lab engine, proxy `/api` | `127.0.0.1:5175` |
| `api` | Catalog, preview, phiên/lượt và Tutor template | `127.0.0.1:8002` |
| `db` | PostgreSQL cho phiên và lượt chạy | `127.0.0.1:15434` |
| `chroma` | Profile `rag` tùy chọn, chưa cần cho đường chạy cơ bản | Không khởi động mặc định |

### Kiểm tra sau khi khởi động

```powershell
docker compose -f docker/compose.yml ps
Invoke-RestMethod http://127.0.0.1:5175/healthz
Invoke-RestMethod http://127.0.0.1:5175/api/v1/labs
Invoke-RestMethod http://127.0.0.1:5175/api/v1/runtime-labs
Invoke-RestMethod http://127.0.0.1:8002/ready
```

Ba service phải báo `healthy`; các endpoint trả HTTP 200. Mở `http://127.0.0.1:5175/#lab/pendulum`, chọn **Chạy thí nghiệm** và kiểm đồng hồ tăng. `GET /ready` cần DB; `GET /health` chỉ cho biết API process còn sống.

### Cấu hình local

Không cần file `.env` để chạy Compose với giá trị local mặc định. Nếu cần đổi cổng hoặc DB trên máy cá nhân, tạo `docker/.env` từ [`docker/.env.example`](docker/.env.example), rồi truyền file đó một cách tường minh:

```powershell
Copy-Item docker/.env.example docker/.env
.\scripts\Start-LumiLab.ps1 -EnvFile docker/.env
```

Lệnh Compose tương ứng: `docker compose --env-file docker/.env -f docker/compose.yml up -d --build --wait web`. `docker/.env` được Git bỏ qua. Mật khẩu mẫu chỉ dùng local; không đưa secret vào Git hoặc biến `VITE_*`. Root `.env` và `apps/api/.env.example` dành cho Python chạy trực tiếp, không phải file Docker Compose tự đọc. AI live vẫn tắt, event cap bằng 0 trong Compose.

### Vận hành stack

```powershell
# Build lại sau khi sửa web/API/engine/knowledge
docker compose -f docker/compose.yml up -d --build --wait web

# Xem lỗi khởi động
docker compose -f docker/compose.yml logs --tail=100 web api db

# Dừng container nhưng giữ database volume
docker compose -f docker/compose.yml stop
```

Không dùng `down -v` để sửa lỗi vì thao tác đó xóa volume dữ liệu. Nếu đổi mật khẩu DB sau khi volume đã tạo, biến môi trường mới không tự đổi mật khẩu trong PostgreSQL hiện có; cần xử lý migration/backup riêng. Khi chạy Compose, dừng Vite và Uvicorn local trước để không trùng cổng 5175/8002.

## Phát triển trực tiếp trên máy

Cần Node.js 24 và Python 3.13. Cách này hữu ích khi sửa giao diện hoặc API với hot reload; Docker vẫn có thể chỉ chạy DB.

```powershell
npm ci
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r docker/requirements-dev.lock
.\.venv\Scripts\python.exe -m pip install --no-deps -e apps/api
.\.venv\Scripts\python.exe -m lumilab_api.data_cli build --include-drafts
```

Chạy API và web ở hai terminal riêng:

```powershell
.\.venv\Scripts\python.exe -m uvicorn lumilab_api.main:app --reload --port 8002 --no-access-log
```

```powershell
npm run dev:web
```

Không có DB, lab client, catalog và server preview vẫn chạy; lưu lượt theo phiên và `/ready` báo chưa sẵn sàng. Nếu cần DB cho API chạy trực tiếp:

```powershell
docker compose -f docker/compose.yml up -d --wait db
$env:LUMILAB_DATABASE_URL='postgresql+psycopg://lumilab:lumilab_local_only@127.0.0.1:15434/lumilab'
.\.venv\Scripts\python.exe -m lumilab_api.run_schema
```

Khởi động Uvicorn trong **cùng terminal** đã đặt `LUMILAB_DATABASE_URL`. File `.env.example` ở root liệt kê cấu hình cho chế độ này; nếu tạo `.env` thật, Git sẽ bỏ qua nó. Không dùng DB/volume của repo A.

## Kiểm tra trước PR

```powershell
npm run check:web
npm run test:unit
npm run build:web
.\.venv\Scripts\python.exe -m ruff check apps/api
.\.venv\Scripts\python.exe -m pytest apps/api/tests
```

E2E cần Chromium của Playwright và Python từ `.venv` trong `PATH`:

```powershell
npx playwright install chromium
$env:Path = "$PWD\.venv\Scripts;$env:Path"
npm run test:e2e
```

Các ca lưu phiên cần PostgreSQL; CI chạy chúng với DB test. Không coi kết quả test từ repo A là bằng chứng cho B. Xem [`AGENTS.md`](AGENTS.md) và hướng dẫn trong từng module trước khi sửa contract, engine, API hoặc trạng thái khoa học.

## Vị trí cần sửa

| Phần việc | Thư mục |
| --- | --- |
| Giao diện và tương tác | `apps/web/src/` |
| Phép tính và cấu hình lab | `packages/lab-engine/` |
| DTO và JSON Schema dùng chung | `packages/contracts/` |
| API, kiểm chứng và phiên | `apps/api/` |
| Học liệu draft và nguồn | `knowledge/` |
| Container và cấu hình triển khai local | `docker/` |

Mỗi người làm trên branch riêng, ghi rõ file mình sửa và đưa diff nhỏ qua PR. Thay contract phải cập nhật schema, TypeScript consumer, Python producer và test cùng lúc. Registry/UI chỉ công bố lab đã chạy ở B. Nguồn chưa duyệt không được nâng thành `VERIFIED`; AI live và provider key không được bật chỉ để làm demo.

## Giới hạn của bản Compose này

Đây là stack **phát triển local**: các cổng chỉ bind vào `127.0.0.1`, DB dùng mật khẩu mẫu local, chưa có HTTPS, backup hay cấu hình public hosting. Muốn triển khai ra server cần cấu hình domain/TLS, secret, backup, giám sát và kiểm lại quyền nguồn trước khi mở truy cập ngoài máy.
