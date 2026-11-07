# FE-EXPAND-01 — danh sách thực hành và4lab mới

## Phạm vi

Giữ3lab cũ và toàn bộ thay đổi FE-ENGINE-01 chưa commit. Thêm2Lý (Newton II, lò xo ngang) và2Hóa (pin điện hóa chuẩn, cấu tạo nguyên tử). Tổng7lab:4Lý/3Hóa. Mỗi lesson hiện có một lab, thêm lesson lò xo đầy đủ knowledge/formulas/exercise/quiz. Nav Phòng thực hành mở catalog, có tìm kiếm/lọc môn; chọn bài→stage→back catalog. Deep link/session cũ vẫn hợp lệ, nav pause lab.

## Mô hình trước triển khai

- mechanics: hệ quán tính, chuyển động1chiều không ma sát, tổng F không đổi; a=F/m, v=v₀+at, x=v₀t+at²/2. F±10N, m0,5–5kg, v₀±3m/s, t0–10s; clip host ở10s, scene có thước đổi tỉ lệ rõ.
- spring: lò xo ngang Hooke không ma sát/khối lượng, x₀±0,4m, m0,1–2kg,k5–100N/m,v₀=0. x=x₀cos(ωt),v=−ωx₀sin(ωt),ω=√(k/m),T=2π/ω,E=kx₀²/2. Không gravity offset hoặc damping.
- electrochemistry: cặp Zn²⁺/Zn(−0,76V),Cu²⁺/Cu(+0,34V),Ag⁺/Ag(+0,80V) làm tròn; standard activity1,25°C. U phải–trái=E°phải−E°trái, emf=|U|; cùng điện cực E°cell=0. Không tính dòng/tốc độ/lượng chất hay mô phỏng mọi phản ứng. Diễn họa chiều electron khi nối tải, vôn kế lý tưởng không mang dòng tải. Tháo cầu muối khóa số đọc mô phỏng, E°lý thuyết vẫn hiện; không mô phỏng quá độ thật.
- atomic: Z1–18,N0–24,ne0–18; A=Z+N,q/e=Z−ne. Sơ đồ vỏ2,8,8 chỉ minh họa, không quỹ đạo electron thật/đánh giá đồng vị bền. Kéo p/n vào hạt nhân, electron vào vỏ; thao tác trừ/select thay thế.

Sources: OpenStax University Physics1 §5.3/15.1, Chemistry2e §17.3/2.3. Tự viết summary, model/dataset revisions mới, config review=draft chờ T2/T4; không thay KB approved/server P0.

## Thiết kế và checks

Giữ mint/green/purple và stage lớn. Catalog gồm thẻ preview SVG riêng từng bài + môn/chương/mục tiêu, CTA rõ; trongstage back +select thay7tab chen nhau. Sidebar controls/graphs, công thức/giới hạn gọn, sổ tay/phiên dùng engine chung. Physics có run/pause/drag; chemistry có drag/keyboard và biểu đồ so sánh.

Model pure + input guard +7schema allowlist/loader +time-aware reading, lifecycle record/restore phải dùng elapsed_s. Kiểm golden/invariants (F/m, phương trình vận tốc, bảo toàn E, E°sign/same-cell, q/A), schema/default/roundtrip cả7id và old3session. E2E homepage catalog/filter,7lesson→lab,4interactions/graphs/records/session, keyboard/touch/mobile, old regressions đổi entrypoint theo UX mới. Không tests giả đánh dấu teacher/LLM/backend chạy.
