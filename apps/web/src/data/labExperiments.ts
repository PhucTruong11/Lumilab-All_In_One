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
  chemistry: [
    { title: 'Trước tương đương', detail: '25 mL HCl 0,1 M + 20 mL NaOH 0,1 M', question: 'Khi còn dư axit, giấy quỳ tím và chỉ thị phenolphthalein cho màu gì?', parameters: { acid: 'hcl', base: 'naoh', baseVolume_ml: 20 } },
    { title: 'Điểm tương đương', detail: '25 mL HCl 0,1 M + 25 mL NaOH 0,1 M', question: 'Tại đúng 25 mL bazơ, số mol H⁺ và OH⁻ bằng nhau khiến pH nhảy vọt tới giá trị nào?', parameters: { acid: 'hcl', base: 'naoh', baseVolume_ml: 25 } },
    { title: 'Dư bazơ kiềm', detail: '25 mL HCl 0,1 M + 30 mL NaOH 0,1 M', question: 'Quan sát màu hồng của phenolphthalein và màu xanh của giấy quỳ tím khi dư OH⁻.', parameters: { acid: 'hcl', base: 'naoh', baseVolume_ml: 30 } },
  ],
  precipitation: [
    { title: 'Dư NaCl', detail: '15 mL AgNO₃ 0,1 M + 25 mL NaCl 0,1 M', question: 'Chất nào phản ứng hết trước và quyết định khối lượng kết tủa AgCl?', parameters: { silverVolume_ml: 15, chlorideVolume_ml: 25 } },
    { title: 'Tỉ lệ 1 : 1 vừa đủ', detail: '25 mL AgNO₃ 0,1 M + 25 mL NaCl 0,1 M', question: 'Khi cả hai chất đều hết, thêm tiếp NaCl có làm tăng khối lượng kết tủa không?', parameters: { silverVolume_ml: 25, chlorideVolume_ml: 25 } },
    { title: 'Dư AgNO₃', detail: '40 mL AgNO₃ 0,1 M + 25 mL NaCl 0,1 M', question: 'So sánh khối lượng AgCl thu được với trường hợp vừa đủ 25 mL : 25 mL.', parameters: { silverVolume_ml: 40, chlorideVolume_ml: 25 } },
  ],
  'gas-reaction': [
    { title: 'Thiếu NaHCO₃', detail: '25 mL HCl 0,1 M + 0,10 g NaHCO₃', question: 'Khi NaHCO₃ là chất giới hạn, thể tích khí CO₂ tỉ lệ thuận với đại lượng nào?', parameters: { acidVolume_ml: 25, bicarbonateMass_g: 0.1 } },
    { title: 'Gần tỉ lệ 1 : 1', detail: '25 mL HCl 0,1 M + 0,21 g NaHCO₃', question: 'Quan sát lượng khí CO₂ thu được khi số mol hai chất xấp xỉ 2,5 mmol.', parameters: { acidVolume_ml: 25, bicarbonateMass_g: 0.21 } },
    { title: 'Dư NaHCO₃', detail: '25 mL HCl 0,1 M + 0,42 g NaHCO₃', question: 'Vì sao thêm tiếp NaHCO₃ vượt quá 0,21 g không làm tăng thêm thể tích CO₂?', parameters: { acidVolume_ml: 25, bicarbonateMass_g: 0.42 } },
  ],
  electrochemistry: [
    { title: 'Pin Daniell Zn – Cu', detail: 'Cực trái Zn, cực phải Cu, đóng cầu muối', question: 'Quan sát chiều electron ở mạch ngoài và chiều dịch chuyển của ion K⁺, NO₃⁻.', parameters: { left: 'zn', right: 'cu', bridgeConnected: true } },
    { title: 'Pin Zn – Ag', detail: 'Thay cực phải bằng Ag để tăng thế chuẩn', question: 'Khi thay Cu bằng Ag có thế khử chuẩn lớn hơn, suất điện động E°pin tăng lên bao nhiêu?', parameters: { left: 'zn', right: 'ag', bridgeConnected: true } },
    { title: 'Ngắt cầu muối', detail: 'Mở cầu muối KNO₃ giữa hai nửa pin', question: 'Vì sao khi nhấc cầu muối ra, vôn kế không đo được hiệu điện thế mạch kín?', parameters: { left: 'zn', right: 'cu', bridgeConnected: false } },
  ],
  atomic: [
    { title: 'Cacbon-12 trung hòa', detail: '6 proton, 6 neutron, 6 electron', question: 'Quan sát sự phân bố 6 electron vào hai lớp vỏ K (2) và L (4).', parameters: { protons: 6, neutrons: 6, electrons: 6 } },
    { title: 'Đồng vị Cacbon-14', detail: '6 proton, 8 neutron, 6 electron', question: 'Thêm 2 neutron vào hạt nhân có làm thay đổi số hiệu nguyên tử Z và kí hiệu hóa học không?', parameters: { protons: 6, neutrons: 8, electrons: 6 } },
    { title: 'Cation Natri Na⁺', detail: '11 proton, 12 neutron, 10 electron', question: 'Khi nguyên tử Na nhường 1 electron ở lớp M ngoài cùng, điện tích q/e bằng bao nhiêu?', parameters: { protons: 11, neutrons: 12, electrons: 10 } },
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
  chemistry: 'Kéo khóa buret để nhỏ dung dịch, hoặc kéo giấy quỳ tím nhúng vào bình để thử pH.',
  precipitation: 'Kéo lọ AgNO₃ hoặc NaCl vào cốc để nhỏ giọt và quan sát kết tủa AgCl hình thành.',
  'gas-reaction': 'Kéo lọ HCl hoặc NaHCO₃ vào bình để quan sát bọt khí CO₂ thoát ra và thu vào ống đong.',
  electrochemistry: 'Bấm chọn kim loại điện cực hoặc đóng/ngắt cầu muối KNO₃ để quan sát dòng e⁻ và ion.',
  atomic: 'Kéo hạt proton, neutron vào hạt nhân và electron vào lớp vỏ, hoặc chọn mẫu đồng vị/ion.',
};
