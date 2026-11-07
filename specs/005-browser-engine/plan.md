# FE-ENGINE-01 — kế hoạch thực hiện

1. Giữ nguyên3science model/legacy/server contracts; tách config browser khỏi catalog server. Tái sử dụng Ajv đang có, khai báo đúng runtime dependency trong engine, không thêm UI stack.
2. Schema definition/session, allowlist/version, engine pure typed, subscribe/snapshot immutable, lifecycle và lưu/khôi phục input atomic.
3. Provider React giữ3engine, host clock/pause khi rời lab, chuyển điều khiển/sổ tay và Canvas sang engine. Giữ thao tác cũ và đồ thị từ cùng model.
4. Nối flow dự đoán/ghi/giải thích→library/Lumi, search, activity import/export→lab, quiz retry, route hash/back-forward; states lỗi/empty/loading, focus/mobile và lỗi chart độc lập.
5. Soạn docs v0.1/12mục/specA–D/5skilldraft, phân biệt implemented/planned. Host Cloud Run proposal, templates chưa kích hoạt; không account/billing/provider calls.
6. Unit/schema/golden/legacy, E2E/session/roundtrip/failed-storage/chart/mobile/touch, ảnh QA, docs links/skill mirror và handoff.

Kết quả và ranh giới ở `docs/VALIDATION.md`, `docs/coordination/HANDOFF-FE-ENGINE-01.md`. Không dùng kế hoạch để chứng minh backend/cloud đã chạy.
