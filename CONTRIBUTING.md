# Làm việc cùng team LumiLab

Đọc [hướng dẫn khởi động](README.md), [AGENTS](AGENTS.md) và [trạng thái repo B](docs/STATUS.md) trước khi nhận task. Xem [kế hoạch Verify/UI](docs/tasks/DATASET-VERIFY-UI-PLAN.md) cho các bài trong dataset.

1. Chọn task/phạm vi trong spec hoặc GitHub Issue. Ghi owner, tool, branch, paths và dependency để tránh sửa chồng.
2. Tạo nhánh/checkout riêng cho từng người hoặc AI đang làm. Không để nhiều agent sửa cùng thư mục làm việc. Không sửa shared contract/lockfile của người khác khi chưa bàn giao.
3. Tái sử dụng engine và fixture đang chạy ở B. Mỗi công thức có giả thiết, giới hạn, nguồn và test hồi quy độc lập.
4. Trước commit: chạy checks phù hợp, `python scripts/check_skill_sources.py`, sync/check Claude mirrors. Nếu chọn Spec Kit integration riêng, chạy `./scripts/setup-tools.ps1 -Agent none` rồi review Git diff.
5. Mở PR dùng template. Ghi điều đã làm, validation thực tế, giới hạn và task tiếp theo. Không ghi secrets hoặc câu hỏi/dữ liệu học sinh thật trong PR/logs.

Ghi kết quả CI, trạng thái duyệt kiến thức và trạng thái triển khai riêng trong phần bàn giao.

## Kiểm tra và công cụ bảo trì

```powershell
.\.venv\Scripts\python.exe scripts/check_docs.py
.\.venv\Scripts\python.exe scripts/check_foundation.py
npm run test:unit
npm run test:e2e
```

- `check_foundation.py` kiểm catalog, provenance, schema đã sinh và bản Claude. Khi chỉ kiểm schema, dùng `python scripts/export_api_schemas.py --check`. Chạy `scripts/lock_api.py` trong venv cô lập khi cần sinh lại lockfile.
- `scripts/fetch_openstax.ps1 -AuditOnly` cần các checkout đã ghim trong `.local/sources/`. Chế độ tải nguồn chuẩn bị các checkout đó. Quyền chuyển nội dung vào corpus được kiểm riêng theo [dataset](docs/DATASET.md).
- `scripts/rebuild/Transfer-Module.ps1` có chế độ `Preview` và dùng [manifest nguồn A](docs/rebuild-kit/modules.json). `Stage` và `CopyNew` yêu cầu khai báo quyền tái sử dụng và tài liệu quy chế ở repo đích. Chạy `pwsh -NoProfile -File scripts/rebuild/Test-Transfer.ps1` để kiểm bằng repo giả lập trong `.local/`.
- Các ca khoa học và UI từng nằm trong năm test demo được đối chiếu với `pendulum.test.ts`, `react-labs.test.ts`, `server-readings.test.ts`, `frontend-base.spec.ts` và `react-labs.spec.ts` của B. Kiểm mạch, chuẩn độ và con lắc qua engine TypeScript, API Python và Playwright.
- [Template Cloud Run](deploy/cloud-run/README.md) dành cho review cấu hình API.

Quyết định liên quan hosting/API phải giữ default AI off, cap0 trước khi account/quota và bộ đếm bền được kiểm. Không mua domain, nâng gói hoặc tự chuyển provider trả phí trong task thông thường.

Không force-push `main`, xóa shared work, xóa DB volume hoặc dùng repo-wide cleanup để sửa lỗi cá nhân. Maintainer cấu hình branch protection/required checks theo cách team thống nhất.
