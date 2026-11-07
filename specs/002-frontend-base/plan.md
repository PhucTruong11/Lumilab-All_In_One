# Implementation Plan: Frontend base

Date: 01/11/2026. Spec: [spec.md](spec.md). Templates/scripts Spec Kit đã cài, không chạy lại constitution trên nguyên tắc hiện có.

## Summary / technical context

React19 / TypeScript5 / Vite8 / Tailwind4, Canvas2D native và SVG Recharts. Pure TS pendulum module tái sử dụng mô hình legacy AGM/quadrature. Frontend state bằng React hooks, không thêm store/router chưa cần. Node24, Python3.13 cho công cụ/test.

Scope: một workspace hoạt động và catalog nền. Tách `LabWorkspace`, `PendulumCanvas`, `PendulumChart`, `LessonCatalog`. Main giữ navigation và brand. Chart lazy-loaded; Canvas vẽ theo kích thước CSS và devicePixelRatio. Màu/material chỉ minh họa. Không đụng source legacy hoặc API contract.

## Constitution check

- Code tính số liệu, không LLM: đạt theo thiết kế.
- Nguồn/model/giới hạn: giữ NIST/SCIENCE.md, không nhận đã server verify.
- Tái sử dụng và scope nhỏ: port một lab; chemistry/circuit giữ bản demo cũ.
- Chi phí: không gọi AI, không deploy tài khoản hoặc bật hooks.

## Design direction

Palette: ink #244535, green #28775c, canvas mint #edf6f2, background #f6f8f5, chart grid #dce7e1, copper #b86b43. Typeface Segoe UI/system sans cho tiếng Việt; số đo tabular. Giữ nhận diện xanh của demo, không làm hero quảng cáo.

Desktop: header gọn → tên lab/tabs → Canvas rộng bên trái + controls/đồ thị bên phải → kiến thức thu gọn và sổ tay. Mobile xếp dọc, thanh trượt là đường thao tác bàn phím/assistive thay thế Canvas. Nét đặc trưng là bàn thí nghiệm có giá treo, nền lưới chấm và quả nặng vật liệu; thông tin phụ không chiếm vùng lab.

## Verification

Vitest: quadrature, conservation/mass independence, phase, stationary/bounds. Playwright: pointer drag, controls, clock/reset, material invariance, mobile/keyboard, API catalog/error. Review ảnh desktop/mobile và runtime errors. Spec Kit smoke: integration status, template resolution, task prerequisite script. Không chạy workflow headless để tự gọi các coding agent khác.
