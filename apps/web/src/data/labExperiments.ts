import { labDefinitions, type LabId, type ParameterMap } from '@lumilab/lab-engine';

// These are starting configurations of existing models, not approved scientific claims.
export interface Experiment<K extends LabId> {
  title: string;
  detail: string;
  question?: string;
  parameters: Partial<ParameterMap[K]>;
}
type Experiments = { [K in LabId]?: Experiment<K>[] };
export const labExperiments: Experiments = {
  pendulum: [
    { title: 'Góc nhỏ', detail: 'Dây 1 m, góc thả 5°', question: 'Ghi chu kỳ T tại đây rồi thử đổi khối lượng xem T có đổi không.', parameters: { length_m: 1, angle_deg: 5 } },
    { title: 'Dây dài', detail: 'Giữ góc 5°, tăng dây lên 2 m', question: 'Dây tăng gấp đôi thì chu kỳ T tăng theo tỉ lệ nào (×2 hay ×√2)?', parameters: { length_m: 2, angle_deg: 5 } },
    { title: 'Góc lớn', detail: 'Dây 1 m, góc thả 60°', question: 'So sánh chu kỳ ở 60° với góc nhỏ 5° khi cùng chiều dài dây 1 m.', parameters: { length_m: 1, angle_deg: 60 } },
  ],
  spring: [
    { title: 'Mốc so sánh', detail: 'm = 0,5 kg; k = 20 N/m', question: 'Kéo vật ra biên rồi thả, ghi chu kỳ T và cơ năng E làm mốc.', parameters: { mass_kg: .5, stiffness_N_m: 20 } },
    { title: 'Tăng khối lượng', detail: 'm = 1 kg; giữ nguyên lò xo', question: 'Khối lượng gấp đôi khiến lò xo dao động nhanh hơn hay chậm hơn?', parameters: { mass_kg: 1, stiffness_N_m: 20 } },
    { title: 'Lò xo cứng hơn', detail: 'm = 0,5 kg; k = 80 N/m', question: 'Độ cứng k tăng gấp 4 lần thì chu kỳ T giảm mấy lần?', parameters: { mass_kg: .5, stiffness_N_m: 80 } },
  ],
  'spring-damped': [
    { title: 'Không có cản', detail: 'Tỉ số cản ζ = 0', question: 'Quan sát đường bao ngang: biên độ và cơ năng có bị hao hụt không?', parameters: { damping_ratio: 0 } },
    { title: 'Cản nhẹ', detail: 'Tỉ số cản ζ = 0,15', question: 'Theo dõi pít-tông giảm chấn và đếm số chu kỳ trước khi biên độ giảm một nửa.', parameters: { damping_ratio: .15 } },
    { title: 'Cản mạnh', detail: 'Tỉ số cản ζ = 0,7', question: 'Cơ năng tiêu tán nhanh ra sao ngay trong nửa chu kỳ đầu tiên?', parameters: { damping_ratio: .7 } },
  ],
  mechanics: [
    { title: 'Giữ nguyên vận tốc', detail: 'F = 0 N; v₀ = 1 m/s', question: 'Khi hợp lực bằng 0, khoảng cách giữa các mốc vị trí theo giây thay đổi thế nào?', parameters: { force_N: 0, initialVelocity_m_s: 1 } },
    { title: 'Tăng tốc', detail: 'F = 4 N; v₀ = 0', question: 'Đặt thêm quả cân lên xe khi giữ F = 4 N để kiểm chứng a = F/m.', parameters: { force_N: 4, initialVelocity_m_s: 0 } },
    { title: 'Lực ngược chiều', detail: 'F = −2 N; v₀ = 2 m/s', question: 'Quan sát thời điểm xe dừng lại tạm thời rồi đổi chiều chuyển động.', parameters: { force_N: -2, initialVelocity_m_s: 2 } },
  ],
  'inclined-plane': [
    { title: 'Dốc thoải', detail: 'α = 10°; μₛ = 0,4', question: 'Vì sao thành phần kéo xuống P∥ chưa thắng được ma sát nghỉ cực đại?', parameters: { angle_deg: 10, static_friction: .4 } },
    { title: 'Không ma sát', detail: 'α = 30°; μₛ = 0', question: 'Khi mặt dốc nhẵn bóng, khối lượng vật có làm đổi gia tốc trượt a không?', parameters: { angle_deg: 30, static_friction: 0 } },
    { title: 'Có ma sát', detail: 'α = 30°; μₛ = 0,4', question: 'So sánh gia tốc và vận tốc cuối dốc với trường hợp không ma sát.', parameters: { angle_deg: 30, static_friction: .4 } },
  ],
  pulley: [
    { title: 'Ròng rọc cố định', detail: '1 nhánh; tải 10 kg; nâng 1 m', question: 'Đổi chiều kéo nhưng lực kế F và đoạn dây kéo s có lợi gì không?', parameters: { strands: 1 } },
    { title: 'Ròng rọc động', detail: '2 nhánh; tải 10 kg; nâng 1 m', question: 'Lực kéo giảm một nửa thì tay cầm lực kế phải kéo dài gấp mấy lần?', parameters: { strands: 2 } },
    { title: 'Pa-lăng', detail: '4 nhánh; tải 10 kg; nâng 1 m', question: 'So sánh công A = F·s ở cả ba cấu hình khi nâng cùng tải lên 1 m.', parameters: { strands: 4 } },
  ],
  circuit: [
    { title: 'Mạch cơ bản', detail: '6 V; R = 20 Ω', question: 'Ghi dòng I làm chuẩn trước khi lắp thêm tải nối tiếp vào mạch.', parameters: { slots: [null, null, null] } },
    { title: 'Thêm bóng đèn', detail: 'Giữ nguồn; thêm bóng 10 Ω', question: 'Bóng đèn sáng lên nhưng dòng I và hiệu điện thế trên R chính đổi thế nào?', parameters: { slots: ['bulb', null, null] } },
    { title: 'Mạch có công tắc', detail: 'Bóng đèn và công tắc đang mở', question: 'Đóng công tắc trên sơ đồ và thử đổi cách mắc đồng hồ để xem điều kiện đọc hợp lệ.', parameters: { slots: ['bulb', 'switchInstalled', null], switchClosed: false } },
  ],
  'parallel-circuit': [
    { title: 'Hai tải nối tiếp', detail: 'R₁ = 20 Ω; R₂ = 30 Ω', question: 'So sánh dòng điện chạy qua hai nhánh và sụt áp trên từng điện trở.', parameters: { topology: 'series' } },
    { title: 'Hai tải song song', detail: 'Giữ nguyên nguồn và hai tải', question: 'Nhánh điện trở nhỏ hơn (R₁ = 20 Ω) có dòng hạt tải chạy nhanh hơn ra sao?', parameters: { topology: 'parallel' } },
    { title: 'Hai nhánh bằng nhau', detail: 'Song song; R₁ = R₂ = 20 Ω', question: 'Điện trở tương đương Rtđ lúc này bằng bao nhiêu phần của một nhánh?', parameters: { topology: 'parallel', resistance2_ohm: 20 } },
  ],
  capacitor: [
    { title: 'Nạp tụ', detail: 'R = 2 kΩ; C = 500 µF', question: 'Sau đúng 1 hằng số thời gian τ = 1 s, điện áp tụ Uc đạt bao nhiêu phần trăm nguồn?', parameters: { mode: 'charge' } },
    { title: 'Phóng điện', detail: 'Cùng R, C; điện áp đầu 6 V', question: 'Quan sát chiều dòng phóng ngược lại và tốc độ giảm dần của điện tích trên bản tụ.', parameters: { mode: 'discharge' } },
    { title: 'Nạp chậm hơn', detail: 'R = 8 kΩ; C = 500 µF', question: 'Tăng R lên gấp 4 lần làm hằng số thời gian τ và đường cong Uc(t) đổi thế nào?', parameters: { mode: 'charge', resistance_ohm: 8000 } },
  ],
  'alkali-water': [
    { title: 'Natri với nước', detail: 'Chọn Na rồi mở quan sát', question: 'Quan sát viên Na nóng chảy chạy trên mặt nước, khí thoát ra và màu phenolphthalein.', parameters: { metal: 'Na', mode: 'water' } },
    { title: 'Kali với nước', detail: 'Đổi kim loại, giữ chế độ nước', question: 'So sánh mức độ mãnh liệt và sắc lửa khi thay Natri bằng Kali.', parameters: { metal: 'K', mode: 'water' } },
    { title: 'Màu ngọn lửa', detail: 'Chọn K; quan sát định tính', question: 'Đưa dây platin vào đèn khí để phân biệt màu phát xạ của Na⁺ và K⁺.', parameters: { metal: 'K', mode: 'flame' } },
  ],
  'copper-nitric': [
    { title: 'Axit loãng', detail: 'Chưa cho khí gặp không khí', question: 'Quan sát màu khí NO vừa sinh ra trong ống kín và màu dung dịch đồng(II).', parameters: { acid: 'dilute', air: false } },
    { title: 'Cho gặp không khí', detail: 'Axit loãng; bật tiếp xúc không khí', question: 'Khi mở nút cho O₂ tiếp xúc, khí không màu ở miệng ống chuyển sang màu gì?', parameters: { acid: 'dilute', air: true } },
    { title: 'Axit đặc', detail: 'Đổi kịch bản axit rồi quan sát', question: 'Vì sao khí thoát ra có màu nâu đỏ đậm ngay từ bề mặt phoi đồng?', parameters: { acid: 'concentrated', air: false } },
  ],
  'chlorine-bleach': [
    { title: 'Giấy khô', detail: 'Thử tính tẩy màu; không có nước', question: 'Khí Cl₂ khô đi qua băng giấy khô có làm mất màu thuốc nhuộm không?', parameters: { mode: 'bleach', damp: false } },
    { title: 'Giấy ẩm', detail: 'Giữ chế độ; thay giấy có nước', question: 'Chất trung gian nào sinh ra khi Cl₂ gặp nước trên giấy ẩm gây tẩy màu?', parameters: { mode: 'bleach', damp: true } },
    { title: 'Nguyên lí tạo clo', detail: 'Quan sát định tính kịch bản tạo khí', question: 'Theo dõi quá trình oxi hóa ion Cl⁻ trong bình điều chế và vai trò cốc NaOH.', parameters: { mode: 'formation', damp: false } },
  ],
};

export function experimentParameters<K extends LabId>(id: K, experiment: Experiment<K>): ParameterMap[K] {
  return { ...labDefinitions[id].defaults, ...experiment.parameters } as ParameterMap[K];
}

export const timedLabIds: readonly LabId[] = ['pendulum', 'spring', 'spring-damped', 'mechanics', 'inclined-plane', 'capacitor'];

export const manipulationHints: Partial<Record<LabId, string>> = {
  pendulum: 'Kéo quả nặng để đổi góc và chiều dài dây. Dùng phím mũi tên khi chọn canvas.',
  spring: 'Kéo vật sang trái hoặc phải để đặt li độ. Chọn vật rồi dùng phím mũi tên cũng được.',
  mechanics: 'Kéo mũi tên để đổi lực, kéo xe để đặt vận tốc đầu hoặc thêm quả cân lên xe.',
  'inclined-plane': 'Kéo tay nắm đầu dốc để đổi góc. Dùng phím lên/xuống để chỉnh từng độ.',
  pulley: 'Kéo tải lên hoặc xuống để đặt độ cao. Chọn tải rồi dùng phím lên/xuống để chỉnh.',
  circuit: 'Kéo linh kiện vào ô trống. Hoặc chọn linh kiện bằng Enter rồi chọn ô để gắn.',
  'parallel-circuit': 'Kéo R₁ sang R₂ để hoán đổi; đổi cách nối để so sánh hai mạch.',
};
