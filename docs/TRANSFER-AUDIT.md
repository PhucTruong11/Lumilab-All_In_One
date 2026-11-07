# Đối chiếu chuyển giao A → B

Kiểm ngày **07/11/2026**. Nguồn A: [`f5f233f`](https://github.com/PhucTruong11/lumilab/commit/f5f233f8dc2ee21934e6b77c740e7959fecb102a). B local: `740428a54affbecf6bf2c486d23d5a9e4d799f02`, nhánh `chore/transfer-llm-benchmark`, working tree sạch tại lúc đối chiếu. GitHub xác nhận A/main ở SHA trên; B/main vẫn ở `b7e333b`, nên commit tài liệu LLM `740428a` còn ở local tại thời điểm kiểm.

Đây là **snapshot audit trước PR #13**. Trong lượt triển khai tiếp theo, main đã nhận Dataset #13 tại `02d92f2` và nhánh tài liệu đã sync qua `8167827`. Runbook LLM, sổ chuyển giao và hướng dẫn nghiệm thu/backup/rollback đã được bổ sung; phần thống kê bên dưới giữ mốc gốc để tra cứu. Xem [sổ hiện hành](MIGRATION-LEDGER.md) và [bàn giao 9 bài](tasks/NINE-LABS.md).

## Phần đã có ở B

Đối chiếu đường dẫn và blob bằng `git ls-tree -r HEAD` ở hai repo; đọc diff runtime khác nhau. Không đọc hoặc sao chép secret.

| Nhóm | File đã track ở A | Có cùng đường dẫn tại B | Ghi nhận |
| --- | ---: | ---: | --- |
| `apps/` | 103 | 103 | 97 blob giống; B đổi cổng/CORS, cấu hình mẫu và tăng kiểm stage Verify cùng test. |
| `packages/` | 46 | 46 | Toàn bộ blob giống, gồm engine, contract và cấu hình lab. |
| `knowledge/` | 32 | 32 | 31 blob giống; README skill Tutor đã điều chỉnh cho B. |
| `scripts/` | 10 | 10 | Công cụ nguồn/skills/docs đã có; B điều chỉnh fetch và kiểm liên kết. |
| `.github/`, `docker/`, `deploy/` | 11 | 11 | CI và template deploy đã có; Compose B bổ sung web/proxy, tách DB/cổng local. |
| `specs/` | 14 | 14 | Toàn bộ blob giống. |

A có 531 file đã track; B có 346 file. Có 336 đường dẫn chung: 290 blob giống và 46 blob khác. A còn 195 đường dẫn chưa có tại B: **168 file tài liệu/tài sản tài liệu** và **27 file của demo JavaScript cũ** (`dist/`, `server.mjs`, 5 test). Demo cũ nằm ngoài phạm vi theo yêu cầu của nhóm; golden fixture dùng cho TypeScript/Python đã có ở B.

Các nhóm trong bảng đạt **100% về sự hiện diện đường dẫn**. Con số này không đo độ hoàn thiện sản phẩm, chất lượng dữ liệu hay khả năng chạy live. Không dùng tỷ lệ tổng file để báo phần trăm chuyển giao vì tài liệu lưu trữ và ảnh chiếm nhiều file.

## Việc có thể làm trong lúc chờ RAG/Dataset

| Ưu tiên | Công việc | Đầu ra và điều kiện xong |
| --- | --- | --- |
| 1 | Hoàn thiện runbook vận hành LLM | Đã viết [LLM-RUNBOOK.md](LLM-RUNBOOK.md) theo gateway B; kiểm bằng provider giả. |
| 2 | Ghi sổ nguồn chuyển giao | Đã viết [MIGRATION-LEDGER.md](MIGRATION-LEDGER.md), tách nguồn A và phần phát triển mới tại B. |
| 3 | Chuẩn hóa nghiệm thu và vận hành B | Đã viết [OPERATIONS.md](OPERATIONS.md), thử backup/restore trên DB mới và chạy PostgreSQL tests. |
| 4 | Đưa commit LLM hiện tại qua review | Đã push `740428a` cùng runbook `d449123`, mở [PR #15 vào main](https://github.com/PhucTruong11/Lumilab-All_In_One/pull/15). Review/CI/merge là mốc riêng trong PR; chưa tự merge/deploy. |

Không chép nguyên runbook A: tài liệu Gemini cũ mô tả 2 attempts/chưa có deadline chung, trong khi settings B hiện cho tối đa 4 chat attempts và deadline chung 18 giây. Tài liệu Tutor/vector cũng có đoạn lịch sử trước khi nối endpoint. Các phần này cần được viết lại theo code hiện hành.

## Việc tích hợp mới, tách khỏi transfer

- **Compose và cấu hình AI/RAG:** root `.env` phục vụ Python trực tiếp. Compose hiện đặt AI/RAG tắt, cap 0 và không truyền key root vào API. Khi team bàn giao RAG, cần thiết kế profile/override cấu hình, artifact và secret server rồi kiểm endpoint; chỉ thêm Chroma service chưa chứng minh API dùng nó. [README Docker](../README.md) · [Compose](../docker/compose.yml)
- **Dataset B:** ở mốc audit gốc, các runtime mới chưa có. PR #13 đã phát triển thêm sáu model, học liệu và ca kiểm tại B; không còn ghi đây là phần thiếu transfer từ A. Việc duyệt nguồn, RAG theo các mã mới và mở rộng pilot LLM vẫn cần owner bàn giao. [Trạng thái 9 bài](tasks/NINE-LABS.md)
- **UI Verify:** consumer hiện chủ yếu nhận preview `INSUFFICIENT_DATA`; cần nối các trạng thái, `stage_checks`, evidence và lỗi theo backlog. Hành vi này cũng có ở A, nên chép lại A không giải quyết được. [Consumer hiện tại](../apps/web/src/api.ts)

## Chờ owner RAG/Dataset

| Hạng mục | Điều kiện bàn giao |
| --- | --- |
| Data Card, nguồn và quyền dùng | Tham khảo `DATA-CARD.md`, `DATA-SOURCES-AND-RIGHTS.md`, `CONTENT-SCOPE-REVIEW.md` của A nhưng ghi đúng phạm vi Kết nối tri thức của B. Gắn revision, claim/source ID, người/ngày duyệt thật và quyền index/gửi provider; không kế thừa phê duyệt từ tài liệu lịch sử. |
| Artifact và benchmark RAG | Corpus/registry khớp mã B, build lại index có fingerprint, chạy retrieval và kiểm ngoài phạm vi; bàn giao manifest và ca lỗi. |
| Benchmark live | Dùng dữ liệu đủ quyền và bằng chứng được duyệt, receipt đúng hash/ngày UTC, quota và ngân sách chung đã xác nhận; preflight hết chặn mới chạy trong lượt được cấp. [Trạng thái đã đo tại B](LIVE-LLM-EVALUATION.md) |

Các ảnh kiến trúc, báo cáo đánh giá A, hồ sơ sprint và tài liệu v0.1 có thể giữ bằng liên kết SHA hoặc đưa vào archive khi thật sự cần. Chúng không chặn web/API/engine hoạt động và không thay bằng chứng nghiệm thu trên B.

Lần audit chỉ kiểm Git, cấu trúc, diff và tài liệu; không chạy lại toàn bộ test ứng dụng, không gọi provider, không deploy hoặc đổi trạng thái khoa học. AI live tiếp tục tắt, cap 0.
