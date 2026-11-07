# LumiLab B

Khung ứng dụng để đưa LumiLab sang repo B từng mốc. M01 hiện có web React/TypeScript và FastAPI `/health`; các lab và AI chưa được tích hợp.

## Chạy local

Yêu cầu Node 24 và Python 3.13. Từ root repo B:

```powershell
npm ci
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e './apps/api[dev]'
```

Terminal 1:

```powershell
.\.venv\Scripts\python.exe -m uvicorn lumilab_api.main:app --reload --port 8002
```

Terminal 2:

```powershell
npm run dev:web
```

Web: http://127.0.0.1:5175 · API health: http://127.0.0.1:8002/health . Web gọi `/api/health` qua Vite proxy.

## Kiểm tra

```powershell
npm run check:web
npm run build:web
.\.venv\Scripts\python.exe -m ruff check apps/api
.\.venv\Scripts\python.exe -m pytest apps/api/tests
```

Đọc `AGENTS.md` và `docs/STATUS.md` trước khi thêm module. `packages/`, `knowledge/`, `tests/` và `docker/` là cấu trúc dành cho các mốc tiếp theo; file `.gitkeep` không có chức năng runtime. AI live mặc định không được bật.
