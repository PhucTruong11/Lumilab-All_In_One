# Bộ dữ liệu học tập và đánh giá Tutor cho 9 bài LumiLab

**Revision** · nine-lab-learning-draft-01  
**Trạng thái** · draft, dùng cho review và đánh giá nội bộ  
**Phụ trách** · Đạt

[learning-dataset.json](learning-dataset.json) là gói độc lập dùng cùng [danh mục bài](../../../packages/contracts/practice-map.json), [học liệu đang chạy](../../../apps/web/src/data/demo-lessons.json) và [hồ sơ nguồn](../../../docs/DATASET.md). Gói có 9 hồ sơ, 27 mục kiến thức, 18 kết quả học tập, 39 mục nguồn theo bài, 36 câu hỏi mới, 31 câu và bài tính hiện hành được tham chiếu, 22 rubric phân biệt, 12 hoạt động và 54 ca Tutor. Tính 67 mục câu hỏi và bài tính có đáp án và giải thích khi giải tham chiếu.

| Bài | Hồ sơ | Câu mới + hiện hành | Rubric riêng | Hoạt động | Ca Tutor |
| --- | ---: | ---: | ---: | ---: | ---: |
| Con lắc đơn | 1 | 4 + 5 | 2 | 1 | 6 |
| Con lắc lò xo | 1 | 4 + 5 | 3 | 2 | 6 |
| Newton II và mặt phẳng nghiêng | 1 | 4 + 4 | 3 | 2 | 6 |
| Ròng rọc và pa-lăng | 1 | 4 + 2 | 2 | 1 | 6 |
| Ohm, nối tiếp và song song | 1 | 4 + 7 | 3 | 2 | 6 |
| Nạp và xả tụ điện RC | 1 | 4 + 2 | 2 | 1 | 6 |
| Na, K với nước và màu ngọn lửa | 1 | 4 + 2 | 2 | 1 | 6 |
| Đồng với HNO₃ | 1 | 4 + 2 | 2 | 1 | 6 |
| Clo và tính tẩy màu | 1 | 4 + 2 | 2 | 1 | 6 |

Có 21 rubric riêng và 1 rubric dùng chung cho câu khách quan. Bài tự luận và hoạt động dùng hai tiêu chí riêng, mỗi tiêu chí tối đa 2 điểm. Đạt từ 3/4 điểm và mỗi tiêu chí phải có điểm. Điểm dựa vào nội dung và lập luận. Câu số dùng đơn vị và dung sai ghi trong đáp án.

## Cách đọc và dùng

- Tìm bài qua practice_id, rồi dùng runtime_ids để chọn chế độ. Các ID mục tiêu, kiến thức và rubric liên kết nội bộ trong cùng bài. existing_question_refs trỏ theo lesson_id, section và id đến học liệu hiện hành. Phần này giữ đáp án và lời giải ở tệp gốc để tránh hai bản phải cập nhật song song.
- Hoạt động dẫn đến parameter_schema trong cấu hình lab để lấy trường, kiểu, giới hạn, đơn vị và giá trị mặc định. cases chứa đường dẫn repo, JSON Pointer, phần tham số thay đổi và thời điểm của ca chuẩn. Hợp nhất tham số mặc định với phần ghi trong ca. Giá trị mong đợi chi tiết nằm ở expected của fixture. Nếu ca kiểm dùng thời điểm chính xác, đọc ca qua công cụ kiểm thử hoặc đối chiếu xấp xỉ trên đồ thị.
- Học liệu và kết quả trình bày từ dataset LumiLab và các ca mô hình có sẵn. Mục nguồn phân biệt học liệu nội bộ, OpenStax/NIST dùng để đối chiếu và dẫn chiếu SGK kế thừa từ hồ sơ dự án. Trong 39 mục có 9 nguồn nội bộ theo bài, 14 mục OpenStax/NIST đã tìm được phần tương ứng và 16 dẫn chiếu trang SGK chờ xác minh lại qua nhà xuất bản. Không đưa nguyên văn tài liệu bên ngoài vào gói. Ghi reviewer và reviewed_at sau khi có review thật.
- Mỗi bài có 6 ca Tutor về kiến thức, hướng dẫn, lỗi, gợi ý, chấm lập luận và nhận biết giới hạn. Với ca có liên quan lượt thử, tạo lượt hợp lệ trong đúng phiên rồi thêm run_id khi gọi API. Chỉ gửi trường trong input và run_id thực qua API Tutor. Context, đáp án, rubric và hành vi kỳ vọng dùng cho người chấm. Khi cần, người chấm cung cấp ngữ cảnh học sinh đang có thông qua câu hỏi hoặc lượt chạy hợp lệ.
- Chấm ba tiêu chí mỗi ca, mỗi tiêu chí 1 điểm và yêu cầu đủ 3 điểm để PASS. Ghi phản hồi thực tế vào execution.actual và kết quả chấm vào execution.status. Bản này giữ NOT_RUN cho cả 54 ca vì chưa chấm phản hồi Tutor. Phạm vi pilot trùng với 11 ca con lắc và bàn mạch circuit. Với 43 ca ngoài pilot, gateway hiện có kỳ vọng trả MVP_SCOPE_ONLY khi kiểm offline. Cần phân biệt kết quả kiểm nhánh fallback với điểm chất lượng nội dung.
- Gói này cần consumer riêng khi nhóm tích hợp. Đ.Phúc nối phần học và chấm với giao diện, Nam đối chiếu ca chuẩn và trạng thái phiên, Khoa chỉ lập chỉ mục học liệu sau review phù hợp. Phản hồi Tutor dùng dữ liệu từ lượt đúng phiên và nguồn được phép dùng. Kết quả khoa học vẫn theo Verify và nhãn preview hiện hành.

## Kiểm tra và phạm vi

Đã kiểm UTF-8, ID duy nhất, đường dẫn và tham chiếu, 31 đáp án/lời giải hiện hành, đáp án mới, thang điểm, giới hạn tham số và 54 payload theo hợp đồng API Tutor. Tính lại 29 ca tham chiếu bằng engine TypeScript và các hàm Python. Các bước này kiểm dữ liệu và kết quả mô hình, chưa xác nhận mức độ học sinh hiểu bài hay chất lượng trả lời của AI.

Ròng rọc dùng cấu hình dựng sẵn. Ba bài Hóa chỉ hỗ trợ hiện tượng ảo định tính. Hạn chế riêng và phần dữ liệu còn thiếu nằm trong simulation_scope của từng bài. Các ca Tutor, kết quả mô phỏng và nguồn tham khảo giữ trạng thái phù hợp với review hiện có.
