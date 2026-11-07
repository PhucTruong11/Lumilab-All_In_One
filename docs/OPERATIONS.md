# Nghiệm thu, backup và rollback LumiLab B

Runbook cho stack local tại [README](../README.md), đối chiếu ngày **07/11/2026**. [Runbook LLM](LLM-RUNBOOK.md) · [Sổ chuyển giao](MIGRATION-LEDGER.md). Production/Cloud Run vẫn là template; tài liệu này không kích hoạt deploy.

Đã bổ sung [Docker release bundle có phiên bản](DOCKER-RELEASE.md): CI xuất archive image đã kiểm, checksum và digest; có lệnh kiểm/nạp lại image trước rollback. Các lệnh giữ tag thủ công bên dưới vẫn dùng được khi image còn local.

## 1. Gate trước review và phát hành

Chạy từ root sau khi cài Node 24, Python 3.13 và dependencies theo README. AI live off, cap 0; không đặt provider key trong CI.

```powershell
npm run check:web
npm run test:unit
npm run build:web
.\.venv\Scripts\python.exe -m ruff check apps/api
.\.venv\Scripts\python.exe -m lumilab_api.data_cli lint --include-drafts
.\.venv\Scripts\python.exe -m lumilab_api.data_cli build --include-drafts
.\.venv\Scripts\python.exe -m pytest apps/api/tests
python scripts/check_docs.py
python scripts/check_skill_sources.py
python scripts/sync_claude_skills.py --check
git diff --check
```

Kiểm exit code từng lệnh; dừng khi lỗi. `--include-drafts` phục vụ nghiệm thu nội bộ, không nâng nội dung thành approved.

[CI quality](../.github/workflows/ci.yml) có frontend, backend, E2E và job tổng `quality-gate`. Job E2E tạo PostgreSQL 17 riêng, chạy schema, build artifact, `test_tutor_postgres.py` và Playwright. Backend không có DB nên một số ca skip ở đó; cần cả job E2E/DB đạt trên đúng SHA của PR. Run bị skip/cancel/thiếu không thay bằng kết quả cũ ở A. Chờ team review, không tự merge khi chỉ một job xanh.

Để chạy E2E local, dùng **DB test riêng**, không chạy bộ test vào DB đang dùng của team. Đặt `LUMILAB_DATABASE_URL` đến DB test mới, chạy `run_schema` và `test_tutor_postgres.py`, rồi làm theo lệnh E2E trong README. Playwright dùng cổng 5175/8002 và có thể reuse server local khi không ở CI; dừng web/API local hoặc Compose web/API trước để không kiểm nhầm server. Không dừng/xóa DB/volume để giải quyết trùng cổng.

## 2. Nghiệm thu hành vi

```powershell
docker compose -f docker/compose.yml config --quiet
docker compose -f docker/compose.yml ps
Invoke-RestMethod http://127.0.0.1:5175/healthz
Invoke-RestMethod http://127.0.0.1:8002/ready
Invoke-RestMethod http://127.0.0.1:5175/api/v1/runtime-labs
Invoke-RestMethod http://127.0.0.1:5175/api/v1/tutor/status
```

| Flow | Điều kiện nghiệm thu |
| --- | --- |
| Stack | DB/API/web healthy; web/proxy và `/ready` trả 200. `/health` chỉ chứng minh process, không chứng minh DB/quota/AI. |
| Lab và Verify | Chạy con lắc; đồng hồ tăng, sửa tham số/keyboard hoạt động. Server preview đúng revision; giữ `INSUFFICIENT_DATA`, facts/evidence rỗng khi chưa duyệt. Ca sai revision/ngoài phạm vi và lỗi mạng có phản hồi phù hợp. |
| Phiên và owned-run | Tạo hai phiên; lưu/đọc run bằng token đúng. Token sai/hết hạn bị 401; run không thuộc phiên không đọc được. Idempotency không tạo run trùng. |
| Tutor offline | Câu hỏi có lab/run đúng quyền trả template và nguồn draft; không có provider call. Status có `live_enabled=false`; kiểm `hybrid_available` theo artifact bàn giao. |
| UI | Desktop/mobile, loading/empty/error/retry; kết quả cũ được đánh dấu khi snapshot đổi. [Backlog UI/Verify](tasks/DATASET-VERIFY-UI-PLAN.md) chỉ rõ các trạng thái còn cần nối. |

API tests PostgreSQL kiểm ownership, input giả, atomic budget, lượt lỗi vẫn tính, token/header caps; dùng `apps/api/tests/test_tutor_postgres.py`. UI hiện chủ yếu nhận preview; checklist là điều kiện nghiệm thu, không khẳng định mọi mục đã hoàn thành.

Ghi SHA, lệnh, exit code, số test/skip và lý do, runtime/artifact revision, ảnh/trace cần thiết vào PR. Chỉ ghi test đã chạy; log đính kèm phải bỏ credential và dữ liệu riêng.

## 3. Backup PostgreSQL local

Backup chứa phiên, token hash, lượt chạy và audit ngân sách. Giữ file trong `.local/backups/` ignored, hạn chế quyền đọc và lưu bản bảo vệ ngoài máy theo owner; không đính kèm dump lên PR. Chọn lịch/retention, nơi lưu và người chịu trách nhiệm trước khi đưa vào vận hành public.

Ví dụ PowerShell cho **Compose B với tên DB/user local mặc định**. Nếu dùng `docker/.env`, thêm `--env-file docker/.env` vào `$composeArgs` và điền đúng DB/user; không in password. Dùng một terminal cho cả phần backup và restore dưới đây. Mỗi dump có tên riêng; mọi lệnh Docker lỗi đều dừng:

```powershell
$ErrorActionPreference = 'Stop'
function Invoke-Docker {
    & docker @args
    if ($LASTEXITCODE -ne 0) { throw "Docker thất bại (exit $LASTEXITCODE)." }
}
$composeArgs = @('compose', '-f', 'docker/compose.yml')
$dbUser = 'lumilab'
$sourceDb = 'lumilab'
$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8)
$remoteDump = "/tmp/lumilab-$stamp.dump"
$backupDir = New-Item -ItemType Directory -Force .local/backups
$backupPath = Join-Path $backupDir.FullName "lumilab-$stamp.dump"
Invoke-Docker @composeArgs exec -T db pg_dump -U $dbUser -d $sourceDb --format=custom --no-owner --no-acl "--file=$remoteDump"
Invoke-Docker @composeArgs exec -T db pg_restore --list $remoteDump | Out-Null
Invoke-Docker @composeArgs cp "db:${remoteDump}" $backupPath
if ((Get-Item -LiteralPath $backupPath).Length -eq 0) { throw 'Dump rỗng.' }
(Get-FileHash -LiteralPath $backupPath -Algorithm SHA256).Hash | Set-Content -LiteralPath "$backupPath.sha256" -Encoding ascii
```

`pg_dump` tạo snapshot nhất quán cho một DB; ghi commit/schema version, thời điểm UTC, SHA256, DB nguồn và trạng thái live vào biên bản riêng. Dump không lưu role toàn cluster, secret `.env`, image hoặc artifact RAG; các phần đó có quy trình lưu/version riêng. Bản custom dump được `docker compose cp` chép dạng binary, không pipe qua chuyển mã PowerShell. Không dùng backup chưa kiểm restore làm bằng chứng phục hồi.

## 4. Thử khôi phục vào DB mới

Các lệnh sau **chỉ tạo DB thử mới** trong cluster B, không đổi DB nguồn hoặc `LUMILAB_DATABASE_URL` của API. Dùng biến từ mục 3. Khi thử một backup từ máy khác, đặt lại các biến và chép archive đã kiểm SHA vào `$remoteDump` bằng `compose cp` trước.

```powershell
$expectedHash = (Get-Content -LiteralPath "$backupPath.sha256" -Raw).Trim()
if ((Get-FileHash -LiteralPath $backupPath -Algorithm SHA256).Hash -ne $expectedHash) { throw 'Checksum không khớp.' }
$restoreDb = 'lumilab_restore_' + [guid]::NewGuid().ToString('N').Substring(0, 12)
Invoke-Docker @composeArgs exec -T db createdb -U $dbUser "--maintenance-db=$sourceDb" --template=template0 $restoreDb
Invoke-Docker @composeArgs exec -T db pg_restore -U $dbUser "--dbname=$restoreDb" --exit-on-error --single-transaction --no-owner --no-acl $remoteDump
$countSql = "SELECT 'lab_sessions' AS name,count(*) AS rows FROM lab_sessions UNION ALL SELECT 'lab_runs',count(*) FROM lab_runs UNION ALL SELECT 'llm_attempts',count(*) FROM llm_attempts UNION ALL SELECT 'llm_budget_counters',count(*) FROM llm_budget_counters UNION ALL SELECT 'llm_token_budgets',count(*) FROM llm_token_budgets UNION ALL SELECT 'llm_provider_headers',count(*) FROM llm_provider_headers ORDER BY name;"
Invoke-Docker @composeArgs exec -T db psql -U $dbUser -d $restoreDb -v ON_ERROR_STOP=1 --csv -c $countSql
```

Đối chiếu bảng/constraint và row count với biên bản của snapshot; nếu nguồn vẫn có ghi mới, số hiện tại có thể khác snapshot. Xác nhận đủ sáu bảng, run/result JSONB và audit còn nguyên. DB thử/dump được giữ lại để owner kiểm; không có cleanup tự động.

Để kiểm ứng dụng trên DB khôi phục: dùng API riêng/cổng khác, live off/cap 0, kiểm `/ready`, owned-run và Tutor template. Một test mới có thể tạo thêm record trong DB thử; ghi baseline trước khi chạy test. Không dùng token/PII của phiên thật làm ví dụ công khai.

**Khôi phục production là bước riêng:** dừng ghi theo kế hoạch của owner, backup hiện trạng, restore sang DB đích mới, kiểm nghiệp vụ rồi mới chuyển connection secret. Giữ DB cũ cho rollback. Snapshot budget cũ có thể thấp hơn usage provider thực: giữ live off, đối chiếu audit/quota và các lần gọi sau snapshot trước khi cấp lại lượt. Không dùng restore để reset quota.

## 5. Rollback ứng dụng

Trước release, ghi known-good Git SHA, image ID/digest của web/API, cấu hình và corpus/index fingerprint. Image phải được giữ trong rollback window do owner chốt. Với Compose local, có thể tag image đang chạy trước build mới; tag local hỗ trợ rollback trên máy này, không thay backup/registry bên ngoài.

```powershell
$apiId = Invoke-Docker @composeArgs ps -q api
$webId = Invoke-Docker @composeArgs ps -q web
if (-not $apiId -or -not $webId) { throw 'API/web chưa chạy.' }
$apiImage = Invoke-Docker inspect --format '{{.Image}}' $apiId
$webImage = Invoke-Docker inspect --format '{{.Image}}' $webId
Invoke-Docker image inspect $apiImage | Out-Null
Invoke-Docker image inspect $webImage | Out-Null
Invoke-Docker image tag $apiImage "lumilab-b-api:rollback-$stamp"
Invoke-Docker image tag $webImage "lumilab-b-web:rollback-$stamp"
```

Nếu `image inspect` báo thiếu image, dừng trước release: container còn chạy không đảm bảo image vẫn còn để tạo lại. Khôi phục đúng digest từ kho image đã lưu, hoặc build lại known-good Git SHA trong checkout riêng rồi nghiệm thu trước khi dùng. Không gán image `latest` khác thành known-good chỉ vì tên giống. Lượt kiểm local ngày 07/11 gặp đúng trường hợp image cũ không còn trong kho; chưa lưu được tag hoặc chạy rollback thật.

Khi cần rollback, tạo file override riêng trong `.local/` với image đã lưu, ví dụ thay `SAVED_STAMP` bằng `$stamp` thực:

```yaml
services:
  api:
    image: lumilab-b-api:rollback-SAVED_STAMP
  web:
    image: lumilab-b-web:rollback-SAVED_STAMP
```

```powershell
docker compose -f docker/compose.yml -f .local/rollback.yml config --quiet
docker compose -f docker/compose.yml -f .local/rollback.yml up -d --no-build --wait web
```

Truyền cùng `--env-file` đã dùng lúc triển khai nếu có. Kiểm từng exit code, ba service, `/ready`, catalog, preview và Tutor status theo mục 2. Đảm bảo Compose đang dùng vẫn tắt live/cap 0. Kiểm schema/data tương thích trước khi chạy image cũ: `run_schema` hiện tạo bảng thiếu theo cách idempotent, không có migration downgrade tự động. Rollback image không tự rollback DB, secret hoặc index.

Cloud Run hiện chỉ có [template chuẩn bị](../deploy/cloud-run/README.md) và workflow `.yml.example` chưa bật. Khi triển khai thật, owner cần giữ known-good revision/digest, kiểm cấu hình/DB tương thích, promote đúng digest và smoke nghiệp vụ trước chuyển traffic. Không chạy mẫu deploy/đổi IAM trong lần bàn giao tài liệu này.

## 6. Biên bản kiểm gần nhất

Kết quả thực thi runbook và các giới hạn được ghi trong [sổ chuyển giao](MIGRATION-LEDGER.md). Review, CI, merge và deployment là các mốc riêng; backup/restore local không chứng minh khả năng phục hồi cloud hoặc đạt mục tiêu thời gian/mất dữ liệu của production.
