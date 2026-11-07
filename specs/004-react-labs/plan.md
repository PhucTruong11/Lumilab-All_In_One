# FE-LABS-01 — Chuẩn độ và mạch điện React

## Phạm vi

Port mô hình và tương tác từ `dist/science.js`, `dist/circuit.js`; giữ demo cũ. Hai lab mới mở từ tab lab hoặc bài học. Không mở rộng backend/verifier/AI, không thêm dependency.

- Chuẩn độ: 25 mL axit 0,1 M, HCl/HNO₃ với NaOH/KOH 0,1 M; kéo lọ vào bình, đổi lọ tạo mẫu mới, khóa buret thêm 0,05 mL, chỉnh lượng bazơ 0–50 mL, đồ thị pH và sổ tay.
- Mạch điện: nguồn DC 0–12 V, R chính 5–100 Ω; ampe kế nối tiếp, vôn kế song song R chính. Kéo hai đồng hồ đổi cách mắc; ba linh kiện tùy vị trí, hoán đổi/tháo, công tắc trực tiếp. Đồ thị I theo U nguồn. Không mô phỏng mạng tải song song tổng quát.
- Pointer/touch + lựa chọn bằng bàn phím, không bắt buộc kéo thả để hoàn thành bài.
- README bỏ ảnh nhúng demo; giữ ảnh trong gallery. Tài liệu hướng dẫn thêm skill riêng/team.

## Mô hình và bằng chứng

Chuẩn độ ideal-strong-titration-ts-v1: dung dịch loãng lý tưởng ở 25°C, Kw=10⁻¹⁴, điện li hoàn toàn, thể tích cộng được. Giữ nhánh nghiệm ổn định của tự điện li nước. Chỉ thị là màu minh họa 8,2–10; không đồng nhất điểm kết thúc và tương đương. Nguồn: SCIENCE.md/OpenStax Chemistry 2e §14.7; các cặp muối chỉ thuộc client catalog demo.

Mạch ideal-series-circuit-ts-v1: dây/đồng hồ lý tưởng; bóng là điện trở cố định 10 Ω, điện trở phụ 20 Ω, không có nhiệt/điện trở trong. I=Unguồn/Rtổng; UV=IRchính; Pnguồn=UI. Cách mắc đồng hồ sai khóa số đo, không tính ngắn mạch thật. Nguồn: OpenStax University Physics 2 §10.2/10.4, mô hình legacy `dist/circuit.js`.

Chỉ là phép tính local, chưa phải VERIFIED của server. KB và SGK vẫn cần T2/T4 duyệt. Golden cases lưu JSON để tái sử dụng Python khi có counterpart; không đổi P0 server scope.

## Nghiệm thu

Type/lint/build + unit độc lập (mol, pH, điện tích, công suất, mạch hở, swap) + legacy tests. Playwright kiểm kéo lọ, màu và điểm tương đương, kéo/swapping linh kiện, đồng hồ song song, công tắc, link thư viện, mobile/no overflow. Xem ảnh desktop/mobile trước bàn giao. Ghi kết quả thật trong VALIDATION và handoff.
