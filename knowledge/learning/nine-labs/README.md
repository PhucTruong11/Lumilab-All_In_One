# Bộ dữ liệu học tập và đánh giá Tutor cho 11 bài LumiLab

**Revision** · eleven-lab-learning-draft-02

**Trạng thái** · draft, dùng cho review và đánh giá nội bộ  
**Phụ trách** · Đạt

[learning-dataset.json](learning-dataset.json) là gói độc lập dùng cùng [danh mục bài](../../../packages/contracts/practice-map.json), [học liệu đang chạy](../../../apps/web/src/data/demo-lessons.json) và [hồ sơ nguồn](../../../docs/DATASET.md). Gói có 11 hồ sơ (6 bài Vật lí và 5 bài Hóa học từ danh sách tương thích phiên cũ), 33 mục kiến thức, 22 kết quả học tập, 43 mục nguồn theo bài, 44 câu hỏi mới, 38 câu và bài tính hiện hành được tham chiếu, 26 rubric phân biệt, 14 hoạt động và 66 ca Tutor. Tính 82 mục câu hỏi và bài tính có đáp án và giải thích khi giải tham chiếu.

| Bài | Hồ sơ | Câu mới + hiện hành | Rubric riêng | Hoạt động | Ca Tutor |
| --- | ---: | ---: | ---: | ---: | ---: |
| Con lắc đơn | 1 | 4 + 5 | 2 | 1 | 6 |
| Con lắc lò xo | 1 | 4 + 5 | 3 | 2 | 6 |
| Newton II và mặt phẳng nghiêng | 1 | 4 + 4 | 3 | 2 | 6 |
| Ròng rọc và pa-lăng | 1 | 4 + 2 | 2 | 1 | 6 |
| Ohm, nối tiếp và song song | 1 | 4 + 7 | 3 | 2 | 6 |
| Nạp và xả tụ điện RC | 1 | 4 + 2 | 2 | 1 | 6 |
| Chuẩn độ axit–bazơ | 1 | 4 + 5 | 2 | 1 | 6 |
| Phản ứng tạo kết tủa AgCl | 1 | 4 + 2 | 2 | 1 | 6 |
| Phản ứng axit và muối bicarbonat | 1 | 4 + 2 | 2 | 1 | 6 |
| Pin điện hóa | 1 | 4 + 2 | 2 | 1 | 6 |
| Cấu tạo nguyên tử | 1 | 4 + 2 | 2 | 1 | 6 |

Có 25 rubric riêng và 1 rubric dùng chung cho câu khách quan. Bài tự luận và hoạt động dùng hai tiêu chí riêng, mỗi tiêu chí tối đa 2 điểm. Đạt từ 3/4 điểm và mỗi tiêu chí phải có điểm. Điểm dựa vào nội dung và lập luận. Câu số dùng đơn vị và dung sai ghi trong đáp án.

## Cách đọc và dùng

- Web lấy hoạt động thực hành từ gói này qua `apps/web/src/data/physics-tasks.json` và `apps/web/src/data/chemistry-tasks.json`. Sau khi sửa hoạt động hoặc ca mẫu, chạy `python scripts/build-physics-tasks.py` và `python scripts/build-chemistry-tasks.py`, rồi kiểm diff của tệp sinh ra. Trong Thư viện bài học, nút “Làm bài này trong thí nghiệm” mở đúng chế độ và hiện bài tính ngay trên mô phỏng cho cả Vật lí và Hóa học. Trong phòng thực hành, mục “Bài tập thực hành” cho chọn hoạt động, xem yêu cầu và áp dụng tham số ca mẫu; học liệu vẫn là draft và không tự chấm hay chứng nhận kết quả.
- Tìm bài qua practice_id, rồi dùng runtime_ids để chọn chế độ. Các ID mục tiêu, kiến thức và rubric liên kết nội bộ trong cùng bài. existing_question_refs trỏ theo lesson_id, section và id đến học liệu hiện hành. Phần này giữ đáp án và lời giải ở tệp gốc để tránh hai bản phải cập nhật song song.
- Hoạt động dẫn đến parameter_schema trong cấu hình lab để lấy trường, kiểu, giới hạn, đơn vị và giá trị mặc định. cases chứa đường dẫn repo, JSON Pointer, phần tham số thay đổi và thời điểm của ca chuẩn. Hợp nhất tham số mặc định với phần ghi trong ca. Giá trị mong đợi chi tiết nằm ở expected của fixture. Nếu ca kiểm dùng thời điểm chính xác, đọc ca qua công cụ kiểm thử hoặc đối chiếu xấp xỉ trên đồ thị.
- Học liệu và kết quả trình bày từ dataset LumiLab và các ca mô hình có sẵn. Mục nguồn phân biệt học liệu nội bộ, OpenStax/NIST dùng để đối chiếu và dẫn chiếu SGK kế thừa từ hồ sơ dự án. Trong 43 mục có 11 nguồn nội bộ theo bài, 17 mục OpenStax/NIST đã tìm được phần tương ứng và 15 dẫn chiếu trang SGK chờ xác minh lại qua nhà xuất bản. Không đưa nguyên văn tài liệu bên ngoài vào gói. Ghi reviewer và reviewed_at sau khi có review thật.
- Mỗi bài có 6 ca Tutor về kiến thức, hướng dẫn, lỗi, gợi ý, chấm lập luận và nhận biết giới hạn. Với ca có liên quan lượt thử, tạo lượt hợp lệ trong đúng phiên rồi thêm run_id khi gọi API. Chỉ gửi trường trong input và run_id thực qua API Tutor. Context, đáp án, rubric và hành vi kỳ vọng dùng cho người chấm. Khi cần, người chấm cung cấp ngữ cảnh học sinh đang có thông qua câu hỏi hoặc lượt chạy hợp lệ.
- Chấm ba tiêu chí mỗi ca, mỗi tiêu chí 1 điểm và yêu cầu đủ 3 điểm để PASS. Ghi phản hồi thực tế vào execution.actual và kết quả chấm vào execution.status. Bản này giữ NOT_RUN cho cả 66 ca vì chưa chấm phản hồi Tutor. Phạm vi pilot trùng với 17 ca thuộc con lắc (`pendulum`), bàn mạch (`circuit`) và chuẩn độ (`chemistry`). Với 49 ca ngoài pilot, gateway hiện có kỳ vọng trả MVP_SCOPE_ONLY khi kiểm offline. Cần phân biệt kết quả kiểm nhánh fallback với điểm chất lượng nội dung.
- Gói này cần consumer riêng khi nhóm tích hợp. Đ.Phúc nối phần học và chấm với giao diện, Nam đối chiếu ca chuẩn và trạng thái phiên, Khoa chỉ lập chỉ mục học liệu sau review phù hợp. Phản hồi Tutor dùng dữ liệu từ lượt đúng phiên và nguồn được phép dùng. Kết quả khoa học vẫn theo Verify và nhãn preview hiện hành.

## Kiểm tra và phạm vi

Revision 02 sửa 11 liên kết ca mẫu và nhãn đơn vị ở bài điền số khối. Hồ sơ nguồn, kết quả kiểm tra và các mục chờ duyệt nằm trong [bàn giao DAT-01](../../reviews/dat-01-review-handoff.md).

Đã kiểm UTF-8, ID duy nhất, đường dẫn và tham chiếu, 38 đáp án/lời giải hiện hành, đáp án mới, thang điểm, giới hạn tham số và 66 payload theo hợp đồng API Tutor. Tính lại 29 ca tham chiếu bằng engine TypeScript và các hàm Python. Các bước này kiểm dữ liệu và kết quả mô hình, chưa xác nhận mức độ học sinh hiểu bài hay chất lượng trả lời của AI.

Ròng rọc dùng cấu hình dựng sẵn. Năm bài Hóa dùng các mô hình định lượng và đếm hạt tương thích với phiên cũ (`chemistry`, `precipitation`, `gas-reaction`, `electrochemistry`, `atomic`). Hạn chế riêng và phần dữ liệu còn thiếu nằm trong simulation_scope của từng bài. Các ca Tutor, kết quả mô phỏng và nguồn tham khảo giữ trạng thái phù hợp với review hiện có.
