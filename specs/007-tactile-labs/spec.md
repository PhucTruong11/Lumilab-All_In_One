# Thao tác trực tiếp trong phòng thí nghiệm

## Người học cần làm được

Người học vào một bài và nhìn thấy bàn thí nghiệm trước các công cụ lưu phiên. Vật thể có thể chọn, kéo, thả và thao tác bằng bàn phím. Khi thay cấu hình, số đo hiện tại thay đổi theo engine; số đo đã ghi giữ nguyên để so sánh. Màn hình 390 px không tràn ngang và không buộc người học đi qua nhiều khối quản trị trước khi thấy bàn.

Trong mạch nối tiếp, người học chọn linh kiện từ khay, gắn vào một trong ba ô, kéo linh kiện đã gắn sang ô khác, tháo từng ô và lắp nhiều bóng hoặc điện trở cùng loại. Có thêm điện trở 10 Ω bên cạnh điện trở 20 Ω, bóng 10 Ω và công tắc. Hai bóng 10 Ω và điện trở chính 20 Ω ở nguồn 6 V cho dòng 0,15 A và tổng công suất trên hai bóng 0,45 W. Công tắc chỉ có một chiếc. Đồng hồ sai cách mắc tiếp tục khóa số đo. Có đường thao tác tương đương bằng nút/select cho người không kéo thả.

Các lab Hóa hiện chỉ có mô hình định tính theo kịch bản; thao tác chọn vật/dụng cụ đổi kịch bản rồi cần mở quan sát lại. Không thêm số đo hoặc trạng thái khoa học ngoài engine.

## Thiết kế

Giữ bảng màu LumiLab: giấy #F4F7F4, bề mặt #FFFFFF, mực #1B382B, xanh dụng cụ #1F7054, cyan cho tay nắm #14798F, hổ phách cho ghi số đo #C97A16. Chữ Segoe UI hiện có. Bố cục ưu tiên thứ tự: tên bài → bàn và điều kiện → kịch bản/ghi chú → phiên và máy chủ. Trên mobile bàn chiếm cả chiều ngang; công cụ phụ thu gọn. Tay nắm, ô thả và vị trí tháo có trạng thái chọn/focus rõ và câu hướng dẫn ngắn khi thao tác.

## Hợp đồng và giới hạn

Mạch v2 giữ nguyên ba ô và cùng đơn vị; mở rộng giá trị ô với `resistor10` và cho phép nhiều tải cùng loại, tối đa một công tắc. Tổng trở là tổng của các tải nối tiếp; `bulbPower_W` là tổng công suất các bóng. Phiên v1 có ba ô không trùng vẫn khôi phục và được tính lại theo v2. API kiểm cùng ràng buộc, trả preview draft. Các lượt đã lưu và chủ sở hữu không đổi.

## Nghiệm thu

- Golden vector và bất biến Ohm/công suất khớp TypeScript/Python; một công tắc là giới hạn.
- Kéo/thả, bàn phím, nút thay thế, lưu số đo, xuất/nhập phiên cũ có E2E.
- Web build, unit, Ruff, pytest, E2E desktop/mobile đạt; Docker web/API/DB healthy và proxy hoạt động.
