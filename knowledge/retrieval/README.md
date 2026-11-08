# Học liệu cho truy xuất local

documents.json gồm thẻ tự biên soạn dựa trên phạm vi mô hình đã mô tả trong SCIENCE.md và các lab.json. Các URL là nguồn tham khảo, kho này chỉ chứa phần ghi chú của dự án. Mỗi thẻ hiện là draft và đang chờ review khoa học.

1. Thêm thẻ có ID riêng, lab_id đúng catalog, tiêu đề, đoạn nội dung, từ khóa, giả thiết và nguồn HTTPS.
2. Giữ origin là project-authored và external_material_use là reference-only cho các ghi chú tự viết theo kiểu hiện tại. Việc nhập nguyên văn tài liệu bên ngoài cần rà quyền và thiết kế ingestion riêng.
3. Ghi review_status draft khi chưa có người duyệt. Chỉ dùng reviewed sau review thực tế và lưu reviewer, reviewed_at.
4. Tách nội dung thành đoạn bằng dòng trống. API lập chỉ mục trong bộ nhớ khi khởi động, có thể khởi động lại để nạp revision mới.
5. Chạy pytest và Playwright để kiểm nguồn, nhãn duyệt, bộ lọc draft và trường hợp không tìm được đoạn phù hợp.

Luồng hiện tại là JSON → chia đoạn → chuẩn hóa từ khóa tiếng Việt → lọc theo lab và trạng thái duyệt → lấy tối đa ba đoạn → Lumi hiển thị đoạn và nguồn. Mặc định trả `local-lexical`. Gửi `retrieval_method: "vector"` để dùng vector local: mặc định là **feature hashing trên token** và cosine similarity, trả `local-hash-vector`. Đây là baseline từ khóa có vector, chưa hiểu ngữ nghĩa hay từ đồng nghĩa.

Vector mặc định chạy trong bộ nhớ, không cần package/model/API mới. Adapter sentence-transformers chỉ nhận model đã có trên đĩa, không tải model; adapter Chroma là tùy chọn local, import khi yêu cầu vector đầu tiên. Xem [VECTOR-RETRIEVAL.md](../../docs/VECTOR-RETRIEVAL.md) để cấu hình và biết giới hạn. Tutor dùng kết quả truy xuất theo chế độ và quyền nguồn; học liệu draft không được coi là nguồn đã duyệt.

Kho truy xuất này có revision riêng. Thay trạng thái của học liệu yêu cầu review và không đổi trạng thái của kết quả verifier.
