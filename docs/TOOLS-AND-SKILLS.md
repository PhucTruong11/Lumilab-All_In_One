# Coding skills, specs và Spec Kit

B chuyển bộ công cụ từ [repo A tại `f5f233f`](https://github.com/PhucTruong11/lumilab/tree/f5f233f8dc2ee21934e6b77c740e7959fecb102a). `.agents/skills/` chứa 4 skill LumiLab và 5 skill upstream. `.claude/skills/` là bản đồng bộ. Xem [giấy phép](../THIRD_PARTY_NOTICES.md) và revision trong `.agents/vendor-lock.json`.

`.specify/` chứa constitution, template, workflow và cấu hình tích hợp Spec Kit. `specs/` giữ hồ sơ 6 feature đã chuyển từ A để tra quyết định cũ. Khi làm bài theo dataset B, dùng [DATASET.md](DATASET.md) và [backlog hiện tại](tasks/DATASET-VERIFY-UI-PLAN.md) để chốt phạm vi.

## Kiểm offline

```powershell
python scripts/check_skill_sources.py
python scripts/sync_claude_skills.py --check
```

Khi chỉnh một skill LumiLab, chạy `python scripts/sync_claude_skills.py` rồi xem diff hai bản. Giữ nguyên file upstream để checksum còn khớp.

## Chọn tích hợp trong checkout riêng

Baseline được chia sẻ là `none`. Dùng PowerShell, Python và `uv` để chọn một trong các tích hợp. Lần đầu chạy cần mạng để tải Specify CLI ở commit đã ghim. Công cụ dùng `.local/` cho CLI và cache.

```powershell
./scripts/setup-tools.ps1 -Agent codex
# Chọn claude hoặc agy nếu dùng công cụ tương ứng.
./.local/bin/specify.exe integration status
```

Dùng `./scripts/setup-tools.ps1 -Agent none` để trở về baseline trước khi chia sẻ checkout. Trong chat của agent, các lệnh `speckit-specify`, `speckit-plan` và `speckit-tasks` dùng cú pháp của tích hợp tương ứng. Các skill này là tài sản của repo. Kết nối và xác thực plugin của từng ứng dụng được quản lý trong ứng dụng đó. [Skill runtime của Tutor](../knowledge/tutor-skills/README.md)
