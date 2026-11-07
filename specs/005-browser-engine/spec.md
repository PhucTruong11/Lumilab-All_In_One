# FE-ENGINE-01 — Frontend hoàn chỉnh và browser Lab Engine

## Phạm vi đã nhận

Hoàn thiện bốn khu vực hiện có và ba lab, không tăng số lab hoặc thay backend khoa học. Engine TypeScript chạy local, nạp `lab.json`, kiểm JSON Schema, giữ lifecycle/thông số/thời gian/số đo. Chuyển tab không mất phiên; tải lại khôi phục phiên đã lưu; nhập/xuất JSON phải kiểm version và tính lại kết quả, không tin số đo client. Học sinh dự đoán, làm, ghi kết quả và giải thích; Lumi có ngữ cảnh thật với câu trả lời theo mẫu và nguồn được chọn. Library/search/note/exercise, practice/quiz phải có trạng thái trống/lỗi/thành công và thao tác bàn phím.

Không gọi LLM, không tuyên bố server VERIFIED; không provision cloud hay bật billing. Bộ tài liệu v0.1 có 12 mục/spec A–D/skills được gắn trạng thái. Cloud Run thay Oracle làm đích chính theo yêu cầu; tiêu chí cuộc thi do người dùng cung cấp, chưa có rubric gốc để xác nhận độc lập.

## Thiết kế giao diện

- Giữ mint #edf6f2, ink #244535, green #28775c; màu Hóa #9c6baf, điện #d69b42, nền #f6f8f5. Segoe UI cho tiếng Việt; số đo tabular.
- Lab là vùng lớn, điều khiển/công thức gọn. Thanh phiên chung đặt dưới tiêu đề: lưu/xuất/khôi phục; prediction→lab→reflection nối tới bài học và Lumi.
- Library: ô tìm kiếm + hai môn/chương/bài; workspace chia soạn/quiz, hiển thị bài đang dùng và link trực tiếp. Lumi: nguồn có thể thu gọn, roadmap kiến thức, snapshot lab tùy chọn, mode gợi ý/giải thích/phản hồi.
- Giữ nhãn mô phỏng local/phản hồi mẫu ở đúng nơi quyết định; không rải thuật ngữ kỹ thuật vào nội dung học.

## Flow và nghiệm thu

Config→schema+model allowlist→engine→snapshot immutable→Canvas/SVG/chart; pointer/keyboard→commands→atomic validation→new snapshot. Host React sở hữu animation clock và vòng đời; engine không import React/DOM/API. Lưu local có thông báo thất bại; import hỏng/version lạ không ghi đè phiên tốt. Pause khi rời lab hoặc browser hidden. Reset kết quả tách xóa sổ tay.

Kiểm config malformed/default/version, unknown/missing/nonfinite input, immutable snapshots, lifecycle/zero angle/pause/reset/dispose, restore chống giả facts, bounds/records, khoa học golden/legacy không đổi. E2E switch/reload/import/export, Lumi snapshot, search/quiz/workspace, keyboard/touch/mobile và review ảnh. Docs và mẫu deploy được kiểm cấu trúc; không đánh dấu cloud deploy đã chạy.

## Contract

Server contract `packages/contracts/schemas/lab.schema.json` v1 giữ nguyên. Browser runtime có schema riêng `packages/lab-engine/schemas/runtime-lab.schema.json` phiên bản1.0, metadata `implementation_status=client`, review=draft. Không làm catalog server planned thành implemented chỉ vì client đã có model.
