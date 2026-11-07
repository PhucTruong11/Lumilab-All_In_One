# LumiLab — triển khai 11 bài thực hành (6 Vật lí + 5 Hóa học tương thích phiên cũ)

Phụ trách Đạt. Phạm vi engine, API preview, web, học liệu nháp, gói đánh giá Tutor và các ca kiểm thử liên quan.

| Bài trong Phòng thực hành | Mô hình đang mở | Phần triển khai |
| --- | --- | --- |
| Con lắc đơn | `pendulum` | Mô hình phi tuyến, chu kỳ và năng lượng từ bản trước |
| Con lắc lò xo | `spring`, `spring-damped` | Lò xo lý tưởng và trường hợp có lực cản nhớt |
| Newton II và mặt phẳng nghiêng | `mechanics`, `inclined-plane` | Hợp lực một chiều và vật thả từ nghỉ trên dốc có ma sát |
| Ròng rọc và pa-lăng | `pulley` | Ba cấu hình có 1, 2, 4 nhánh đỡ, số đo lực kéo, quãng đường và công |
| Định luật Ohm, mạch nối tiếp và song song | `circuit`, `parallel-circuit` | Bàn đo và mạch hai điện trở trong cùng bài |
| Nạp và xả tụ điện RC | `capacitor` | Hai chế độ nạp/xả của mô hình RC hiện có |
| Chuẩn độ axit–bazơ | `chemistry` | Trung hòa axit mạnh–bazơ mạnh 1:1 ở 25 °C, pH và chỉ thị phenolphthalein |
| Phản ứng tạo kết tủa AgCl | `precipitation` | Trộn AgNO₃ và NaCl 0,100 mol/L, xác định chất giới hạn và khối lượng AgCl |
| Phản ứng axit và muối bicarbonat | `gas-reaction` | HCl tác dụng NaHCO₃, chất giới hạn và thể tích CO₂ lý tưởng ở 25 °C, 1 atm |
| Pin điện hóa | `electrochemistry` | Các cặp điện cực chuẩn Zn, Cu, Ag, cực tính vôn kế và cầu muối |
| Cấu tạo nguyên tử | `atomic` | Đếm hạt proton, neutron, electron (Z ≤ 18), số khối A, điện tích và lớp vỏ 2, 8, 8 |

Phòng thực hành liệt kê 11 bài (6 Vật lí, 5 Hóa học). API runtime liệt kê 14 mô hình hiện hành. Ba mô hình Hóa vô cơ định tính (`alkali-water`, `copper-nitric`, `chlorine-bleach`) chuyển sang danh mục lưu trữ và vẫn mở được từ thư viện, danh sách chuyển bài và liên kết cũ. Các phiên cũ giữ nguyên ID, phiên bản và cách tính. Danh mục học liệu hiện có 17 bản ghi theo mô hình.
