# Cloud Run — template chuẩn bị, chưa deploy

Thư mục này chứa mẫu Cloud Run cho API LumiLab. Web và PostgreSQL cần cấu hình môi trường đích riêng. [Chạy local bằng Docker Compose](../../README.md) · [Cấu hình LLM](../../docs/LLM-DATA-REVIEW.md)

## Trước khi áp dụng

**[MỞ]** Nhóm triển khai xác minh project/billing/credit, region/quota, yêu cầu nghiệm thu, owner account và chính sách chi phí. Chưa có các thông tin này thì chỉ build/test local, không chạy deploy. Artifact Registry/build/scan/egress/logs/secrets/DB có phí riêng; free compute không là bill toàn hệ thống bằng0.

**[ĐỀ XUẤT]** Bắt đầu API lean1vCPU/512Mi, min0/max1, concurrency4, request-based CPU, timeout20s. Chưa có Torch/embedding. Hai service staging/production có revision image digest, service account least privilege và secret riêng. Region quyết theo credit/quota/giá/latency đo được, không tự chọn giáTier1 cho mọi vùng.

## Files

- `service.template.yaml`: Knative Service template; thay tên/project/image digest/service account. Cổng container8000 khớp Docker API hiện tại; Cloud Run sẽ cấpPORT8000 theo cấu hình này.
- [Workflow mẫu `.yml.example`](../../.github/workflows/cloud-run.yml.example) ở trạng thái tham khảo. Khi team phê duyệt quyền và ngân sách, review toàn file, chọn GitHub Environments staging/production và bật branch restriction/approval. Pin action theo SHA khi kích hoạt.

Mẫu giữ `LUMILAB_LLM_ENABLED=false`, `LUMILAB_RAG_ENABLED=false` và `LUMILAB_LLM_EVENT_CAP=0`. Thiếu DB thì `/ready` trả `503` và các luồng lưu lượt theo phiên chưa dùng được. Đưa `LUMILAB_DATABASE_URL` vào Secret Manager sau khi chốt DB, TLS và backup. Cấp quyền tối thiểu cho service account. [Contract API](../../docs/CONTRACT.md)

## Pipeline dự kiến

**[ĐỀ XUẤT]** Quality gate local/CI → OIDC/WIF credential ngắn hạn → build immutable image → Artifact Registry → staging → `/health` smoke → production environment approval → promote cùng digest. `/health` chứng minh process/route, không chứng minhDB/verifier/AI. Khi làm nghiệp vụ, thêm `/ready`/owned-run smoke trước promote. WIF restriction repository/ref/environment, không dùng JSON service-account key dài hạn. Tách runtime/deploy identities.

**[MỞ]** Public endpoint: HTTPS managed; IAM public invoker chỉ cho service cần public, không public DB/Chroma. Đối chiếu rubric về ingress/firewall serverless với BTC. Rate limit/ownership vẫn là nhiệm vụ backend, không được thay bằng CORS. Mẫu dùng identity-token smoke cho staging/production private; deploy identity cần quyền invoker phù hợp. Công khai URL cho ban giám khảo là bước IAM riêng sau khi chốt service cần public, template không tự cấp allUsers.

## Vận hành

**[ĐỀ XUẤT]** Tắt min instance/uptime ping giữ ấm, giới hạn log retention, cleanup policy image cũ theo rollback window đã chốt, kiểm dashboard sau smoke. Giữ known-good digest và backup DB độc lập. Revisions max-instance không là tiền trần; kiểm spend-cap support/coverage thay vì chỉ budget email. Không tự xóa tài nguyên/dữ liệu sau cuộc thi; owner duyệt cụ thể cleanup và giữ evidence/backup cần thiết.
