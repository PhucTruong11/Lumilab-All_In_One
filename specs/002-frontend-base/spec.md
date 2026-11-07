# Feature Specification: Frontend base và công cụ cho team

Created: 01/11/2026. Working tree: main, chưa commit. User yêu cầu setup Spec Kit/5 skill, sau đó làm React + TypeScript, Canvas 2D, SVG/Recharts, Tailwind CSS.

## User scenarios & testing

### US1 — Một lab mẫu hoạt động (P1)

Học sinh mở Phòng thực hành, kéo con lắc/chỉnh thông số, chạy hoặc dừng, xem kết quả và đồ thị rồi ghi số đo.

Acceptance: Canvas thật; chiều dài 0.3–2m, góc 0–90°, khối lượng 0.1–1kg. Drag trực tiếp cập nhật thanh trượt. T góc lớn theo AGM, không thay bằng góc nhỏ. Góc 0 đứng yên; mass/material không đổi T. Đồ thị Recharts SVG phản ánh cùng engine. API không sẵn vẫn chạy được mẫu local.

### US2 — Bộ nền dễ mở rộng (P2)

Thành viên dùng React components riêng cho Canvas, chart, workspace và catalog; engine pure TypeScript tách UI. Chart được tải theo chunk; Tailwind hoạt động cùng CSS tokens. UI mobile không tràn ngang và sliders dùng được bằng bàn phím.

### US3 — Team dùng được tooling đã yêu cầu (P2)

Spec Kit CLI/templates/scripts/workflow có thật, giữ constitution/spec cũ. 5 coding skill có nguồn/commit/license, cả tài liệu và script hỗ trợ; Claude có mirror, Codex/Antigravity dùng .agents. Spec Kit integration chuyển theo checkout, tránh cài đè Codex/Antigravity. Không tự bật hooks hoặc provider.

## Functional requirements

- FR1: React/TS/Vite/Tailwind build static được bằng lockfile.
- FR2: Canvas responsive/HiDPI, pointer capture, chiều dài và góc có bounds; animation lifecycle không rò rAF.
- FR3: Mô hình phi tuyến được port từ demo, có test với quadrature độc lập và invariants.
- FR4: Recharts SVG cùng input; không để schema API draft biến thành tuyên bố server verified.
- FR5: Sổ tay local giới hạn20 số đo, reset thí nghiệm không tự xóa số đo; reload/chuyển view có thể khởi tạo lại. Chưa lưu DB.
- FR6: Catalog API vẫn có loading/error/retry/config states.
- FR7: Skill imports pin commit, giữ license; sync không sửa native speckit skills.

## Success criteria

Frontend type/lint/unit/build, legacy regression và 6 E2E đạt; review ảnh desktop/mobile. Spec Kit integration status không missing/modified managed files sau setup. Chưa nằm trong feature: lab hóa/điện React đầy đủ, backend verifier/session/AI/RAG hoặc cloud deployment.
