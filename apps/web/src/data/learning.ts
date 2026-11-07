import originalLessons from './demo-lessons.json';

export interface Question { id: string; stem: string; options: string[]; correctIndex: number; explanation: string }
export interface Lesson {
  id: string; subjectId: string; chapterId: string; title: string; lead: string;
  knowledge: { title: string; text: string }[];
  formulas: { expression: string; description: string }[];
  exercise: { id: string; prompt: string; unit: string; answer: number; tolerance: number; hint: string; explanation: string };
  quiz: Question[];
}

export const subjects = [
  { id: 'physics', name: 'Vật lí', symbol: '↔', description: 'Từ chuyển động đến những quy luật của tự nhiên.', chapters: [
    { id: 'oscillations', name: 'Dao động cơ học', description: 'Chu kỳ, tần số, con lắc đơn và con lắc lò xo.', lessonIds: ['pendulum', 'spring'] },
    { id: 'mechanics', name: 'Chuyển động và lực', description: 'Định luật II Newton, mặt phẳng nghiêng và máy cơ đơn giản.', lessonIds: ['mechanics', 'pulley'] },
    { id: 'electricity', name: 'Dòng điện và mạch điện', description: 'Định luật Ôm đoạn mạch và quá trình nạp - xả tụ RC.', lessonIds: ['circuit', 'capacitor'] },
  ] },
  { id: 'chemistry', name: 'Hóa học', symbol: '⚗', description: 'Biến đổi của chất và thực nghiệm trực quan.', chapters: [
    { id: 'inorganic', name: 'Hóa học vô cơ thực nghiệm', description: 'Kim loại kiềm, axit nitric oxi hóa mạnh và khí clo.', lessonIds: ['alkali-metal', 'hno3-reaction', 'chlorine-gas'] },
  ] },
];

const pendulumLesson = originalLessons.find(l => l.id === 'pendulum')!;
const circuitLesson = originalLessons.find(l => l.id === 'circuit')!;

const springLesson: Lesson = {
  id: 'spring', subjectId: 'physics', chapterId: 'oscillations', title: 'Con lắc lò xo: nhịp dao động đến từ đâu?', lead: 'Khám phá quan hệ giữa chu kỳ, khối lượng và độ cứng lò xo ngang.',
  knowledge: [
    { title: 'Lực kéo về', text: 'Trong giới hạn đàn hồi, lực kéo về tỉ lệ với độ biến dạng: F = −kx. Con lắc lò xo nằm ngang dao động điều hòa quanh vị trí cân bằng.' },
    { title: 'Chu kỳ dao động', text: 'T = 2π√(m/k). Chu kỳ tỉ lệ thuận với căn bậc hai khối lượng và tỉ lệ nghịch với căn bậc hai độ cứng k; không phụ thuộc biên độ dao động nhỏ.' },
    { title: 'Bảo toàn cơ năng', text: 'Khi bỏ qua ma sát, động năng và thế năng đàn hồi biến thiên tuần hoàn nhưng cơ năng toàn phần E = ½kA² được bảo toàn.' },
  ],
  formulas: [
    { expression: 'T = 2π√(m/k)', description: 'm theo kg, k theo N/m, T theo s.' },
    { expression: 'E = ½kA²', description: 'A theo m, k theo N/m, E theo J.' },
  ],
  exercise: { id: 'spring-period', prompt: 'Một vật 0,5 kg gắn với lò xo ngang có độ cứng 20 N/m. Tính chu kỳ dao động (làm tròn 0,001 s).', unit: 's', answer: 0.993, tolerance: 0.005, hint: 'Dùng công thức T = 2π√(m/k).', explanation: 'T = 2π√(0,5/20) ≈ 0,993 s.' },
  quiz: [
    { id: 'spring-k', stem: 'Tăng độ cứng của lò xo lên 4 lần thì chu kỳ dao động thay đổi thế nào?', options: ['Tăng 2 lần', 'Giảm 2 lần', 'Không đổi', 'Giảm 4 lần'], correctIndex: 1, explanation: 'T tỉ lệ nghịch với căn k nên khi k tăng 4 lần thì T giảm 2 lần.' },
  ],
};

const mechanicsLesson: Lesson = {
  id: 'mechanics', subjectId: 'physics', chapterId: 'mechanics', title: 'Định luật II Newton & Mặt phẳng nghiêng', lead: 'Liên hệ giữa lực, khối lượng, ma sát và gia tốc chuyển động.',
  knowledge: [
    { title: 'Định luật II Newton', text: 'Gia tốc của một vật cùng hướng với hợp lực tác dụng và có độ lớn tỉ lệ thuận với hợp lực, tỉ lệ nghịch với khối lượng: a = F_net / m.' },
    { title: 'Lực ma sát trượt', text: 'Khi vật chuyển động trên bề mặt phẳng, lực ma sát trượt cản trở chuyển động: F_ms = μ·N, với N là áp lực lên bề mặt.' },
    { title: 'Mặt phẳng nghiêng', text: 'Thành phần trọng lực kéo vật xuống dốc là P·sin(α), áp lực nén vuông góc là N = P·cos(α). Gia tốc khi trượt xuống: a = g·(sin α − μ·cos α).' },
  ],
  formulas: [
    { expression: 'ΣF = ma', description: 'F theo N, m theo kg, a theo m/s².' },
    { expression: 'a = (F − μmg)/m', description: 'Chuyển động có ma sát trên mặt phẳng ngang.' },
  ],
  exercise: { id: 'force', prompt: 'Vật 2 kg chịu lực kéo 6 N, bỏ qua ma sát. Tính độ lớn gia tốc.', unit: 'm/s²', answer: 3, tolerance: 0.01, hint: 'a = F/m.', explanation: 'a = 6 / 2 = 3 m/s².' },
  quiz: [
    { id: 'force-direction', stem: 'Gia tốc của vật cùng hướng với đại lượng nào?', options: ['Vận tốc ban đầu', 'Hợp lực tác dụng', 'Quãng đường', 'Trọng lượng'], correctIndex: 1, explanation: 'Theo định luật II Newton, gia tốc luôn cùng hướng với hợp lực.' },
  ],
};

const pulleyLesson: Lesson = {
  id: 'pulley', subjectId: 'physics', chapterId: 'mechanics', title: 'Hệ ròng rọc cơ học & Pa-lăng', lead: 'Cân bằng lực, lợi về lực và định luật bảo toàn công trong máy cơ đơn giản.',
  knowledge: [
    { title: 'Ròng rọc cố định', text: 'Ròng rọc cố định chỉ đổi hướng của lực kéo, không cho lợi về lực (lực kéo F = P, quãng đường kéo s = h).' },
    { title: 'Ròng rọc động', text: 'Ròng rọc động cho lợi 2 lần về lực (F = P/2), nhưng thiệt 2 lần về đường đi (s = 2h).' },
    { title: 'Hệ pa-lăng và định luật về công', text: 'Pa-lăng gồm n đoạn dây nâng cho lợi n lần về lực (F = P/n) nhưng quãng đường kéo tăng n lần (s = n·h). Không một máy cơ đơn giản nào cho ta lợi về công: A = F·s = P·h.' },
  ],
  formulas: [
    { expression: 'F = P / n', description: 'P = mg, n là số đoạn dây chịu tải.' },
    { expression: 'A = F · s = P · h', description: 'Định luật về công (khi bỏ qua ma sát và trọng lượng ròng rọc).' },
  ],
  exercise: { id: 'pulley-force', prompt: 'Dùng một ròng rọc động (n = 2) lý tưởng để nâng vật nặng 40 kg (g = 9,81 m/s²). Tính lực kéo cần thiết.', unit: 'N', answer: 196.2, tolerance: 0.5, hint: 'P = m·g; F = P / 2.', explanation: 'Trọng lượng P = 40 × 9,81 = 392,4 N. Lực kéo F = 392,4 / 2 = 196,2 N.' },
  quiz: [
    { id: 'pulley-work', stem: 'Dùng pa-lăng được lợi 4 lần về lực thì công thực hiện thay đổi thế nào?', options: ['Tăng 4 lần', 'Giảm 4 lần', 'Không đổi', 'Tăng 2 lần'], correctIndex: 2, explanation: 'Theo định luật về công, không máy cơ đơn giản nào cho lợi về công.' },
  ],
};

const capacitorLesson: Lesson = {
  id: 'capacitor', subjectId: 'physics', chapterId: 'electricity', title: 'Quá trình nạp - xả tụ điện (Mạch RC)', lead: 'Quan sát sự biến thiên điện áp và dòng điện theo thời gian nạp và xả.',
  knowledge: [
    { title: 'Hằng số thời gian τ', text: 'Hằng số thời gian τ = R·C đặc trưng cho tốc độ nạp hoặc xả của tụ. Sau thời gian t = τ, điện áp nạp đạt khoảng 63,2% điện áp nguồn.' },
    { title: 'Quá trình xả tụ', text: 'Khi ngắt nguồn và nối tụ qua điện trở, điện tích phóng qua R, điện áp tụ giảm dần theo hàm mũ: U_c(t) = U₀·e^(−t/τ).' },
  ],
  formulas: [
    { expression: 'τ = R · C', description: 'R theo Ω, C theo F, τ theo s.' },
    { expression: 'U_c(t) = U · (1 − e^(−t/τ))', description: 'Điện áp tụ trong quá trình nạp từ điện áp 0.' },
  ],
  exercise: { id: 'rc-time', prompt: 'Mạch RC gồm R = 2000 Ω và C = 500 µF. Tính hằng số thời gian τ.', unit: 's', answer: 1.0, tolerance: 0.01, hint: 'Đổi 500 µF = 0,0005 F; τ = R · C.', explanation: 'τ = 2000 × 0,0005 = 1,0 s.' },
  quiz: [
    { id: 'rc-rate', stem: 'Tăng điện trở R trong mạch RC làm cho thời gian nạp đầy tụ:', options: ['Nhanh hơn', 'Lâu hơn (chậm hơn)', 'Không đổi', 'Điện áp giảm'], correctIndex: 1, explanation: 'Tăng R làm tăng τ = RC, dòng nạp nhỏ hơn nên tụ nạp chậm hơn.' },
  ],
};

const alkaliLesson: Lesson = {
  id: 'alkali-metal', subjectId: 'chemistry', chapterId: 'inorganic', title: 'Kim loại kiềm tác dụng với nước & Thử màu ngọn lửa', lead: 'Phản ứng mãnh liệt của Na, K với nước sinh khí H₂ và màu quang phổ đặc trưng.',
  knowledge: [
    { title: 'Kim loại kiềm tác dụng với nước', text: 'Các kim loại nhóm IA (Na, K) có tính khử rất mạnh. Khi tiếp xúc với nước, chúng khử nước giải phóng H₂: 2M + 2H₂O → 2MOH + H₂↑. Phản ứng tỏa nhiệt mạnh làm kim loại nóng chảy thành giọt tròn chạy trên mặt nước; K tỏa nhiệt đủ làm H₂ bốc cháy ngọn lửa tím.' },
    { title: 'Nhận biết môi trường kiềm', text: 'Dung dịch sản phẩm MOH chứa ion OH⁻ làm quỳ tím hóa xanh hoặc phenolphtalein chuyển sang màu hồng tím đặc trưng.' },
    { title: 'Thử màu ngọn lửa (Flame test)', text: 'Khi đốt hợp chất kim loại kiềm trên ngọn lửa đèn khí Bunsen không màu, các electron bị kích thích phát xạ bức xạ đặc trưng: Natri phát ánh sáng màu vàng chói (bước sóng 589 nm), Kali phát ánh sáng tím hoa cà (766 nm).' },
  ],
  formulas: [
    { expression: '2Na + 2H₂O → 2NaOH + H₂↑', description: 'Natri tác dụng mãnh liệt với nước.' },
    { expression: '2K + 2H₂O → 2KOH + H₂↑', description: 'Kali phản ứng rất mãnh liệt, bốc cháy ngọn lửa tím.' },
  ],
  exercise: { id: 'na-mol', prompt: 'Cho 2,3 g Na (M = 23 g/mol) phản ứng hoàn toàn với nước dư. Tính thể tích khí H₂ thoát ra ở đktc 25°C, 1 bar (dùng 24,79 L/mol).', unit: 'L', answer: 1.2395, tolerance: 0.05, hint: 'n(Na) = 2,3/23 = 0,1 mol. n(H₂) = n(Na)/2 = 0,05 mol. V = 0,05 × 24,79 L.', explanation: 'V(H₂) = 0,05 × 24,79 = 1,2395 L.' },
  quiz: [
    { id: 'na-flame', stem: 'Khi đưa hợp chất của Natri vào ngọn lửa không màu, ngọn lửa nhuốm màu gì?', options: ['Màu đỏ tươi', 'Màu vàng tươi', 'Màu tím hoa cà', 'Màu xanh lục'], correctIndex: 1, explanation: 'Ion Na⁺ phát xạ ánh sáng màu vàng tươi đặc trưng ở vạch 589 nm.' },
  ],
};

const hno3Lesson: Lesson = {
  id: 'hno3-reaction', subjectId: 'chemistry', chapterId: 'inorganic', title: 'Kim loại tác dụng với axit HNO₃ sinh NO₂ / NO', lead: 'Tính oxi hóa rất mạnh của axit nitric và sự phụ thuộc sản phẩm khử vào nồng độ.',
  knowledge: [
    { title: 'Tính oxi hóa của HNO₃', text: 'Axit nitric là chất oxi hóa rất mạnh. Khi phản ứng với kim loại như đồng (Cu), nitơ (+5) trong HNO₃ bị khử xuống các mức oxi hóa thấp hơn thay vì sinh khí H₂.' },
    { title: 'Ảnh hưởng của nồng độ axit', text: 'Với Cu tác dụng HNO₃ đặc: sinh khí nitơ đioxit NO₂ màu nâu đỏ, mùi hắc độc hại. Với HNO₃ loãng: sinh khí nitơ monoxit NO không màu, khí này gặp oxi không khí ở miệng ống nghiệm lập tức hóa nâu đỏ tạo NO₂.' },
    { title: 'Màu dung dịch và an toàn', text: 'Dung dịch thu được có màu xanh đặc trưng của ion Cu²⁺. Trong thực nghiệm, miệng ống nghiệm luôn phải nút bằng bông tẩm dung dịch kiềm (NaOH) để hấp thụ khí NO/NO₂ độc hại.' },
  ],
  formulas: [
    { expression: 'Cu + 4HNO₃(đặc) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O', description: 'NO₂ là chất khí màu nâu đỏ.' },
    { expression: '3Cu + 8HNO₃(loãng) → 3Cu(NO₃)₂ + 2NO↑ + 4H₂O', description: 'NO không màu, hóa nâu đỏ ngoài không khí: 2NO + O₂ → 2NO₂.' },
  ],
  exercise: { id: 'cu-no2', prompt: 'Hòa tan hết 6,4 g Cu (M = 64 g/mol) trong HNO₃ đặc dư. Tính số mol khí NO₂ sinh ra.', unit: 'mol', answer: 0.2, tolerance: 0.01, hint: 'n(Cu) = 0,1 mol. Theo tỉ lệ phương trình, n(NO₂) = 2 · n(Cu).', explanation: 'n(Cu) = 6,4 / 64 = 0,1 mol. n(NO₂) = 0,1 × 2 = 0,2 mol.' },
  quiz: [
    { id: 'hno3-gas-color', stem: 'Khí NO₂ thoát ra khi cho Cu tác dụng với HNO₃ đặc có màu gì?', options: ['Không màu', 'Màu vàng lục', 'Màu nâu đỏ', 'Màu tím đậm'], correctIndex: 2, explanation: 'NO₂ là chất khí màu nâu đỏ đặc trưng và có mùi hắc độc hại.' },
  ],
};

const chlorineLesson: Lesson = {
  id: 'chlorine-gas', subjectId: 'chemistry', chapterId: 'inorganic', title: 'Điều chế và thử tính tẩy màu của khí Clo', lead: 'Phản ứng oxi hóa khử điều chế Cl₂ trong phòng thí nghiệm và cơ chế tẩy màu của clo ẩm.',
  knowledge: [
    { title: 'Điều chế Cl₂ trong phòng thí nghiệm', text: 'Cho axit clohiđric đặc tác dụng với chất oxi hóa mạnh như KMnO₄ hoặc MnO₂: 2KMnO₄ + 16HCl(đặc) → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O. Khí clo thu được có màu vàng lục, mùi xốc và độc.' },
    { title: 'Tính tẩy màu của khí clo ẩm', text: 'Khí clo khô KHÔNG có tính tẩy màu. Khi có mặt nước, clo phản ứng thuận nghịch tạo axit hipoclorơ: Cl₂ + H₂O ⇌ HCl + HClO. Axit HClO có tính oxi hóa rất mạnh, phá hủy các chất màu hữu cơ nên làm mất màu cánh hoa hoặc giấy màu ẩm.' },
    { title: 'An toàn phòng thí nghiệm', text: 'Khí clo rất độc, phá hủy niêm mạc hô hấp. Bình thu khí clo luôn được đậy bằng bông tẩm dung dịch kiềm (NaOH) để giữ khí clo dư thừa: Cl₂ + 2NaOH → NaCl + NaClO + H₂O.' },
  ],
  formulas: [
    { expression: '2KMnO₄ + 16HCl(đặc) → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O', description: 'Điều chế khí clo trong phòng thí nghiệm.' },
    { expression: 'Cl₂ + H₂O ⇌ HCl + HClO', description: 'HClO (axit hipoclorơ) là tác nhân oxi hóa gây tẩy màu.' },
  ],
  exercise: { id: 'cl2-mol', prompt: 'Điều chế khí clo từ 31,6 g KMnO₄ (M = 158 g/mol) với lượng dư HCl đặc. Tính số mol khí Cl₂ thu được.', unit: 'mol', answer: 0.5, tolerance: 0.02, hint: 'n(KMnO₄) = 31,6 / 158 = 0,2 mol. Theo phương trình 2 mol KMnO₄ sinh 5 mol Cl₂.', explanation: 'n(Cl₂) = 0,2 × (5/2) = 0,5 mol.' },
  quiz: [
    { id: 'cl2-bleach', stem: 'Chất nào trực tiếp gây ra tính tẩy màu khi cho khí clo tiếp xúc với giấy màu ẩm?', options: ['Khí Cl₂ nguyên chất', 'Axit HCl', 'Axit hipoclorơ HClO', 'Khí oxi O₂'], correctIndex: 2, explanation: 'HClO có tính oxi hóa rất mạnh, làm phá hủy cấu trúc hợp chất màu hữu cơ.' },
  ],
};

export const lessons: Lesson[] = [
  pendulumLesson,
  springLesson,
  mechanicsLesson,
  pulleyLesson,
  circuitLesson,
  capacitorLesson,
  alkaliLesson,
  hno3Lesson,
  chlorineLesson,
];

export const lessonById = (id: string) => lessons.find(lesson => lesson.id === id)!;
export const legacyLabLink = (id: string) => id === 'circuit';

export function downloadText(name: string, text: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob(type === 'application/json' ? [text] : ['\uFEFF', text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readLocal<T>(key: string, fallback: T, valid: (value: unknown) => value is T): T {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) || 'null'); return valid(value) ? value : fallback; }
  catch { return fallback; }
}
