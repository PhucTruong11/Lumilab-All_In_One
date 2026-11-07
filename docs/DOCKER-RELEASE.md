# Docker CI, phiên bản và rollback bundle

Đợt triển khai trên nhánh `feat/docker-release-capabilities`. [Vận hành/backup](OPERATIONS.md) · [LLM](LLM-RUNBOOK.md) · [Contract](CONTRACT.md)

## Luồng nghiệm thu

CI `quality` giữ các job frontend, backend và E2E hiện có, rồi chạy job `docker`. Job này dùng [Compose CI riêng](../docker/compose.ci.yml), build đúng Dockerfile web/API, chỉ publish cổng Nginx lên loopback và tạo PostgreSQL bằng tmpfs. Nó không dùng `.env`, DB hoặc volume của stack dev; không truyền key provider. Cleanup chỉ áp dụng project `lumilab-ci-*` do script vừa tạo. Chọn tên project mới cho mỗi lượt; script từ chối reuse project đã có container.

[Script release](../scripts/docker_release.py) kiểm:

1. HTML/JavaScript đã build và Nginx health.
2. API qua proxy; Git SHA, mapping và runtime fingerprint của web/API khớp; index đã nạp có revision khớp corpus.
3. Catalog hiện hành, tạo hai phiên, lưu/đọc/list run, idempotency, từ chối token khác và run không thuộc phiên.
4. Preview giữ draft, facts/evidence rỗng; Tutor dùng run đúng quyền, có retrieval và trả template với 0 provider attempts.
5. Export archive, kiểm SHA256, nạp lại image, tạo lại API/web từ image đã giữ; metadata vẫn khớp và run cũ còn đọc được qua DB test.

Đây là smoke HTTP trên image cuối và kiểm recreate với DB giữ nguyên. Các thao tác trình duyệt vẫn do job Playwright kiểm riêng. Không coi thử recreate cùng phiên bản là bằng chứng downgrade schema hoặc rollback production giữa mọi phiên bản.

`quality-gate` bắt buộc cả bốn job đạt. Artifact Docker chỉ được xuất sau khi ba job nền đã đạt và smoke Docker thành công. Chỉ dùng bundle từ workflow hoàn tất thành công trên SHA đã review; PR artifact là bản ứng viên, không tự cấp quyền deploy.

## Chạy local

Từ root với Docker đang chạy; script chỉ dùng Python standard library. Checkout sạch và đã commit:

```powershell
python scripts/docker_release.py build-test --output .local/releases/my-checked-build
```

Script lấy **SHA đầy đủ của HEAD**, tạo project/cổng test riêng, chạy checks và cleanup test stack. Thư mục output phải mới và nằm trong `.local/`. Nếu cần kiểm thay đổi chưa commit, thêm `--allow-dirty` và dùng output khác; bundle được đánh dấu `source_dirty=true`, lệnh verify cho release sẽ từ chối. Không dùng dirty bundle cho triển khai.

## Nội dung artifact

CI giữ artifact `docker-release-<GIT_SHA>-<RUN_ATTEMPT>` trong **14 ngày**, gồm:

| File | Nội dung |
| --- | --- |
| `images.tar.gz` | Image web/API đã kiểm, tag `lumilab-b-web:<SHA>` và `lumilab-b-api:<SHA>`. Không chứa PostgreSQL/data volume hoặc `.env`. |
| `release.json` | SHA nguồn, dấu dirty, image references, `image_config_digest`, registry digests nếu có, checksum archive và metadata web/API đã đo. |
| `smoke.json` | Các kiểm đã đạt; có kiểm run tồn tại sau recreate, không ghi token/ID phiên/câu hỏi. |
| `rollback.yml` | Override chỉ chọn hai image đã giữ, `pull_policy=never`, live off/cap 0. Không tự đổi DB URL/volume. |

`image_config_digest` là image ID/config digest local do Docker báo, dùng để kiểm chính xác image sau `load`. Nó **không phải registry manifest digest** để dùng với `registry/name@sha256:…`. Workflow này không publish registry; `registry_digests` có thể rỗng. Tag SHA giúp tra cứu, còn digest/checksum giúp phát hiện tag hoặc archive đã đổi. Việc giữ metadata SHA không làm một build chưa kiểm thành known-good.

Artifact sẽ hết hạn. Owner tải giữ bundle cần cho rollback trước khi hết 14 ngày và trước khi dọn image. Nếu sử dụng registry sau này, lưu thêm digest từ chính registry và thực hiện theo quyền/môi trường đã chốt.

## Kiểm bundle trước release/rollback

Tải artifact từ workflow thành công của repo này, giải nén vào thư mục riêng. Lệnh sau kiểm checksum và bằng chứng smoke; sau đó xác nhận image còn local và digest/label đúng. Nếu thiếu image thì dừng, không tự pull:

```powershell
python scripts/docker_release.py verify --bundle .local/releases/my-downloaded-build
```

Để nạp lại đúng image trong archive rồi kiểm:

```powershell
python scripts/docker_release.py verify --bundle .local/releases/my-downloaded-build --load
```

Hai lệnh chỉ kiểm/nạp image và tạo override; không restart container hoặc triển khai. Checksum chứng minh artifact khớp manifest nhận được, không thay việc xác định nguồn workflow đáng tin cậy.

Sau khi owner kiểm DB/schema tương thích và hoàn thành backup theo [OPERATIONS](OPERATIONS.md), áp override cùng cấu hình môi trường đang dùng:

```powershell
docker compose -f docker/compose.yml -f .local/releases/my-downloaded-build/rollback.yml config --quiet
docker compose -f docker/compose.yml -f .local/releases/my-downloaded-build/rollback.yml up -d --no-build --wait web
```

Nếu dùng `--env-file`, truyền lại đúng file đó. Kiểm exit code, readiness, metadata, owned-run và Tutor template sau thao tác. Không khôi phục snapshot ngân sách cũ để lấy lại lượt; rollback image không rollback DB/index bên ngoài hoặc cấp quyền gọi model.

## Định danh xuyên suốt

- **Web:** `/build-info.json` có Git SHA, mapping revision/content fingerprint và runtime fingerprint. File được sinh sau Vite build bằng [build-info.mjs](../apps/web/build-info.mjs), không chứa secret. `npm run dev:web` không sinh file này; kiểm image phát hành dùng bản build thật.
- **API:** `GET /api/v1/system` có cùng định danh, danh sách model/dataset revision từng runtime, lifecycle, cờ pilot Tutor, corpus/source registry revision và index fingerprint thực sự đã nạp. Metadata được chụp lúc startup; restart khi thay corpus/config/index.
- **Docker:** hai image có OCI label `org.opencontainers.image.revision`; SHA được bake bằng `BUILD_SHA`. Dev mặc định `unknown` và không được coi là release. Build script không cho override SHA khác HEAD.
- **Mismatch:** smoke dừng nếu web/API khác SHA, mapping hash/revision hoặc runtime fingerprint; thiếu index/revision lệch corpus cũng dừng. Sau recreate còn so toàn bộ metadata với bản đã giữ. `matches_corpus` chỉ so revision corpus; index fingerprint trong bundle dùng để phát hiện artifact khác dù giữ cùng tên revision. Đây không phải trạng thái duyệt học thuật.

## Mapping chung và quyền mở rộng pilot

[practice-map.json](../packages/contracts/practice-map.json) là nguồn chung cho nhóm bài trên web và scope Tutor của gateway. API kiểm mapping khớp runtime catalog lúc startup; Vitest/Pytest kiểm thiếu/trùng/ID không tồn tại. Schema JSON và DTO Python/TypeScript được giữ cùng nhau.

| Bài dataset | Runtime/mode | Pilot Tutor hiện tại |
| --- | --- | --- |
| `VL-CONLAC-01` | `pendulum` | Có trong scope |
| `VL-LOXO-01` | `spring`, `spring-damped` | Chưa mở |
| `VL-MATPHANGNGHIENG-01` | `mechanics`, `inclined-plane` | Chưa mở |
| `VL-RONGROC-01` | `pulley` | Chưa mở |
| `VL-DIEN-01` | `circuit`, `parallel-circuit` | Chỉ `circuit` |
| `VL-RC-01` | `capacitor` | Chưa mở |
| `HH-KIEM-01` | `alkali-water` | Chưa mở |
| `HH-HNO3-01` | `copper-nitric` | Chưa mở |
| `HH-CHLORINE-01` | `chlorine-bleach` | Chưa mở |

`chemistry` là pilot tương thích thuộc runtime lưu trữ. Cờ `tutor_pilot` chỉ mô tả scope đã có, không có nghĩa live/nguồn/provider được duyệt. Mở thêm pilot cần owner RAG/Verify review nguồn, mapping, tests và revision; không tự đổi audience, quyền `send_llm` hoặc bật provider theo số lượng bài mới.

Phạm vi file giao thoa team: web chỉ đổi nguồn của `practiceGroups`, giữ shape/title/modes; gateway chỉ thay allowlist viết cứng bằng manifest. Không thay UI layout, model khoa học, logic Verify hoặc ingestion/retrieval của task khác.
