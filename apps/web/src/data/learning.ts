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
    { id: 'oscillations', name: 'Dao động', description: 'Chu kỳ, tần số và con lắc đơn.', lessonIds: ['pendulum', 'spring'] },
    { id: 'electricity', name: 'Dòng điện và mạch điện', description: 'Định luật Ôm và cách mắc dụng cụ đo.', lessonIds: ['circuit', 'parallel-circuit', 'capacitor'] },
    { id: 'mechanics', name: 'Chuyển động và lực', description: 'Vận tốc, gia tốc và hợp lực.', lessonIds: ['mechanics'] },
  ] },
  { id: 'chemistry', name: 'Hóa học', symbol: '⚗', description: 'Hiểu sự biến đổi của chất qua từng quan sát.', chapters: [
    { id: 'solutions', name: 'Dung dịch và axit–bazơ', description: 'Nồng độ, trung hòa và chuẩn độ.', lessonIds: ['chemistry'] },
    { id: 'precipitation', name: 'Phản ứng tạo kết tủa', description: 'Dung dịch, chất giới hạn và kết tủa.', lessonIds: ['precipitation'] },
    { id: 'gas-reactions', name: 'Phản ứng tạo khí', description: 'Axit, bicarbonat và lượng CO₂.', lessonIds: ['gas-reaction'] },
  ] },
];

// Draft illustrations, not an asserted sequence for a particular SGK edition.
const added: Lesson[] = [
  { id: 'mechanics', subjectId: 'physics', chapterId: 'mechanics', title: 'Lực thay đổi chuyển động thế nào?', lead: 'Liên hệ hợp lực với gia tốc trong một tình huống đơn giản.',
    knowledge: [{ title: 'Vận tốc và gia tốc', text: 'Gia tốc mô tả sự thay đổi vận tốc theo thời gian. Vận tốc thay đổi về độ lớn hoặc hướng đều có thể tạo gia tốc.' }, { title: 'Hợp lực', text: 'Trong hệ quy chiếu quán tính, gia tốc của vật cùng hướng với hợp lực. Mô hình ở đây xét vật có khối lượng không đổi.' }],
    formulas: [{ expression: 'ΣF = ma', description: 'Hợp lực theo N, m theo kg, a theo m/s².' }, { expression: 'a = Δv/Δt', description: 'Gia tốc trung bình; các vận tốc phải xét theo cùng hệ quy chiếu.' }],
    exercise: { id: 'force', prompt: 'Vật có khối lượng 2 kg chịu hợp lực 6 N trong hệ quy chiếu quán tính. Tính độ lớn gia tốc.', unit: 'm/s²', answer: 3, tolerance: .01, hint: 'Dùng a = ΣF/m.', explanation: 'a = 6/2 = 3 m/s², cùng hướng với hợp lực.' },
    quiz: [{ id: 'force-direction', stem: 'Trong hệ quy chiếu quán tính, gia tốc cùng hướng với đại lượng nào?', options: ['Vận tốc trong mọi trường hợp', 'Hợp lực', 'Trọng lực trong mọi trường hợp', 'Quãng đường'], correctIndex: 1, explanation: 'Theo ΣF = ma với m dương, gia tốc cùng hướng hợp lực.' }] },
  { id: 'electrochemistry', subjectId: 'chemistry', chapterId: 'electrochemistry', title: 'Electron đi đâu trong pin điện hóa?', lead: 'Nhận biết quá trình oxi hóa và khử trong pin galvanic.',
    knowledge: [{ title: 'Oxi hóa và khử', text: 'Oxi hóa là quá trình nhường electron; khử là quá trình nhận electron.' }, { title: 'Hai điện cực', text: 'Trong pin galvanic, oxi hóa xảy ra ở anode và khử ở cathode. Electron đi qua mạch ngoài từ anode sang cathode; không nhầm với chiều dòng điện quy ước.' }],
    formulas: [{ expression: 'E°pin = E°cathode − E°anode', description: 'Dùng các thế khử chuẩn, cùng đơn vị V, trong điều kiện chuẩn tương ứng. Không áp dụng trực tiếp cho mọi nồng độ.' }],
    exercise: { id: 'cell-potential', prompt: 'Cho thế khử chuẩn cathode là 0,34 V và anode là −0,76 V. Tính suất điện động chuẩn của pin.', unit: 'V', answer: 1.1, tolerance: .01, hint: 'Lấy 0,34 trừ (−0,76).', explanation: 'E°pin = 0,34 − (−0,76) = 1,10 V.' },
    quiz: [{ id: 'oxidation', stem: 'Quá trình oxi hóa là gì?', options: ['Nhận electron', 'Nhường electron', 'Luôn tạo kết tủa', 'Luôn tạo khí'], correctIndex: 1, explanation: 'Oxi hóa là quá trình nhường electron.' }] },
  { id: 'atomic', subjectId: 'chemistry', chapterId: 'atomic', title: 'Bên trong một nguyên tử', lead: 'Đọc số proton, neutron và electron từ kí hiệu nguyên tử.',
    knowledge: [{ title: 'Hạt cấu tạo', text: 'Hạt nhân chứa proton và neutron. Electron nằm ngoài hạt nhân; nguyên tử trung hòa có số electron bằng số proton.' }, { title: 'Số khối và số hiệu nguyên tử', text: 'Số hiệu nguyên tử Z là số proton. Số khối A là tổng số proton và neutron; A không phải nguyên tử khối trung bình.' }],
    formulas: [{ expression: 'N = A − Z', description: 'N là số neutron, A là số khối, Z là số proton.' }, { expression: 'ne = Z (nguyên tử trung hòa)', description: 'Không áp dụng cho ion đã nhận hoặc mất electron.' }],
    exercise: { id: 'neutrons', prompt: 'Nguyên tử có số khối A = 23 và số hiệu nguyên tử Z = 11. Hạt nhân có bao nhiêu neutron?', unit: 'neutron', answer: 12, tolerance: 0, hint: 'Tính N = A − Z.', explanation: 'N = 23 − 11 = 12 neutron.' },
    quiz: [{ id: 'atomic-number', stem: 'Số hiệu nguyên tử Z cho biết điều gì?', options: ['Số neutron', 'Tổng proton và neutron', 'Số proton', 'Khối lượng tính theo kg'], correctIndex: 2, explanation: 'Z là số proton trong hạt nhân.' }] },
];
const springLesson: Lesson = {
  id: 'spring', subjectId: 'physics', chapterId: 'oscillations', title: 'Con lắc lò xo: nhịp dao động đến từ đâu?', lead: 'Khám phá quan hệ giữa chu kỳ, khối lượng và độ cứng lò xo ngang.',
  knowledge: [
    { title: 'Lực kéo về', text: 'Trong giới hạn Hooke, lực đàn hồi ngược chiều li độ: F = −kx. Mô hình dùng lò xo ngang không ma sát, vật được thả từ nghỉ.' },
    { title: 'Chu kỳ và năng lượng', text: 'Với biên độ khác0, T = 2π√(m/k). Tăng khối lượng làm T tăng; tăng độ cứng làm T giảm. Đổi biên độ không làm đổi chu kỳ trong mô hình Hooke lý tưởng. Tại vị trí cân bằng khi thả từ nghỉ, vật đứng yên nên không đo được chu kỳ dao động.' },
    { title: 'Cách kiểm tra bằng lab', text: 'Giữ độ cứng, kéo vật đến cùng li độ rồi thay khối lượng và ghi hai lượt. Tiếp theo giữ khối lượng, đổi độ cứng. So sánh đồ thị x(t) và số đo T.' },
  ],
  formulas: [
    { expression: 'T = 2π√(m/k)', description: 'm theo kg, k theo N/m, T theo s; dao động có biên độ khác0.' },
    { expression: 'x(t) = x₀cos(√(k/m)t)', description: 'Thả từ li độx₀ với vận tốc ban đầu0; x theo m, t theo s.' },
    { expression: 'E = ½kx₀²', description: 'Tổng động năng và thế năng bảo toàn khi không ma sát; E theo J.' },
  ],
  exercise: { id: 'spring-period', prompt: 'Một vật0,5kg gắn với lò xo ngang có độ cứng20N/m, dao động lý tưởng với biên độ0,2m. Tính chu kỳ, làm tròn đến0,001s.', unit: 's', answer: .993, tolerance: .005, hint: 'Dùng T=2π√(m/k); biên độ không xuất hiện trong công thức chu kỳ của lò xo Hooke.', explanation: 'T=2π√(0,5/20)≈0,993s. Nếu tăng khối lượng lên2kg và giữ k, chu kỳ tăng2lần.' },
  quiz: [
    { id: 'spring-mass', stem: 'Giữ k, tăng khối lượng4lần thì chu kỳ lò xo lý tưởng có biên độ khác0 thay đổi thế nào?', options: ['Tăng2lần', 'Tăng4lần', 'Giảm2lần', 'Không đổi'], correctIndex: 0, explanation: 'T tỉ lệ√m, nên √4=2.' },
    { id: 'spring-stiffness', stem: 'Giữ m, tăng độ cứng4lần thì chu kỳ lò xo lý tưởng thay đổi thế nào?', options: ['Tăng2lần', 'Giảm2lần', 'Giảm4lần', 'Không đổi'], correctIndex: 1, explanation: 'T tỉ lệ1/√k, nên T mới bằng một nửa.' },
  ],
};
const reactionNetworkLessons: Lesson[] = [
  { id: 'parallel-circuit', subjectId: 'physics', chapterId: 'electricity', title: 'Hai điện trở: nối tiếp hay song song?', lead: 'Đọc dòng nhánh và điện trở tương đương khi đổi cách nối.',
    knowledge: [{ title: 'Nối tiếp', text: 'Dòng điện đi lần lượt qua hai điện trở nên có cùng cường độ. Điện áp nguồn bằng tổng điện áp hai điện trở.' }, { title: 'Song song', text: 'Hai nhánh nối cùng hai nút nên có cùng điện áp. Dòng nguồn bằng tổng dòng qua hai nhánh. Giữ điện áp nguồn, điện trở tương đương song song nhỏ hơn từng điện trở.' }],
    formulas: [{ expression: 'Rnt = R₁ + R₂; I = U/Rnt', description: 'Nguồn, dây và công tắc lý tưởng; mạch kín.' }, { expression: 'Rss = R₁R₂/(R₁ + R₂); I = I₁ + I₂', description: 'Hai điện trở song song; I₁ = U/R₁, I₂ = U/R₂.' }],
    exercise: { id: 'parallel-resistance', prompt: 'Hai điện trở 20 Ω và 30 Ω mắc song song với nguồn lý tưởng 6 V, mạch kín. Tính dòng điện toàn mạch.', unit: 'A', answer: .5, tolerance: .001, hint: 'Tính Rss = 20×30/(20+30), sau đó I = 6/Rss.', explanation: 'Rss = 12 Ω, I = 6/12 = 0,5 A. Dòng nhánh là 0,3 A và 0,2 A.' },
    quiz: [{ id: 'parallel-voltage', stem: 'Hai điện trở mắc song song có đại lượng nào bằng nhau?', options: ['Dòng điện trong mọi trường hợp', 'Điện áp hai đầu', 'Công suất trong mọi trường hợp', 'Điện trở'], correctIndex: 1, explanation: 'Hai nhánh nối chung hai nút nên cùng điện áp.' }] },
  { id: 'capacitor', subjectId: 'physics', chapterId: 'electricity', title: 'Tụ điện nạp và xả thế nào?', lead: 'Quan sát quá trình RC lý tưởng bằng điện áp theo thời gian.',
    knowledge: [{ title: 'Hằng số thời gian', text: 'Tích RC đặc trưng tốc độ nạp/xả. Tăng R hoặc C làm biến đổi chậm hơn. Đổi thông số trong lab bắt đầu lại quá trình từ t = 0.' }, { title: 'Điều kiện đầu', text: 'Chế độ nạp bắt đầu từ tụ chưa tích điện. Chế độ xả bắt đầu từ tụ có điện áp bằng U nguồn và ngắt nguồn. Dòng xả âm theo chiều tham chiếu của dòng nạp. Đây là bài mở rộng, cần giáo viên đối chiếu chương trình.' }],
    formulas: [{ expression: 'τ = RC; Uc = U(1 − e^(−t/τ))', description: 'Nạp từ Uc(0)=0. C đổi từ µF sang F; τ theo s.' }, { expression: 'Uc = Ue^(−t/τ); E = ½CUc²', description: 'Xả từ Uc(0)=U; tụ lý tưởng, không rò.' }],
    exercise: { id: 'rc-time', prompt: 'R = 1000 Ω, C = 1000 µF. Tính hằng số thời gian của mạch RC.', unit: 's', answer: 1, tolerance: .001, hint: '1000 µF = 0,001 F. Nhân R với C theo đơn vị SI.', explanation: 'τ = 1000×0,001 = 1 s. Sau 1 s, tụ nạp đạt khoảng 63,2% U.' },
    quiz: [{ id: 'rc-capacitance', stem: 'Giữ R, tăng C hai lần thì τ thay đổi ra sao?', options: ['Giảm hai lần', 'Không đổi', 'Tăng hai lần', 'Tăng bốn lần'], correctIndex: 2, explanation: 'τ = RC nên tỉ lệ thuận với C.' }] },
  { id: 'precipitation', subjectId: 'chemistry', chapterId: 'precipitation', title: 'Dung dịch trong suốt tạo kết tủa trắng', lead: 'Tìm chất giới hạn trong phản ứng AgNO₃–NaCl.',
    knowledge: [{ title: 'Tạo chất ít tan', text: 'Khi trộn dung dịch AgNO₃ với NaCl, AgCl trắng ít tan được tạo thành. Lab dùng mô hình phản ứng hoàn toàn theo tỉ lệ mol 1:1, bỏ qua độ tan còn lại.' }, { title: 'Chất giới hạn', text: 'Lượng AgCl tính từ số mol nhỏ hơn của hai chất. Chỉ thêm chất đã dư sẽ không làm tăng kết tủa trong mô hình. Độ đục trên hình là minh họa lượng sản phẩm, không phải đo quang.' }, { title: 'An toàn', text: 'Muối bạc và chất thải chứa bạc cần được xử lý đúng quy định trong phòng thí nghiệm. Không tự làm theo hình minh họa tại nhà.' }],
    formulas: [{ expression: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃', description: 'Dung dịch nước, nồng độ cố định 0,1 mol/L.' }, { expression: 'n = CV; mAgCl = min(nAgNO₃, nNaCl) × 143,32', description: 'V theo L, n theo mol, m theo g. Khối lượng mol dùng trong mô hình 143,32 g/mol.' }],
    exercise: { id: 'precipitate-mass', prompt: 'Trộn 10 mL AgNO₃ 0,1 M với 20 mL NaCl 0,1 M. Giả sử phản ứng hoàn toàn, M(AgCl)=143,32 g/mol. Tính khối lượng AgCl.', unit: 'g', answer: .14332, tolerance: .0001, hint: 'Tính mol từng chất, chọn số nhỏ hơn theo tỉ lệ 1:1.', explanation: 'nAgNO₃=0,001 mol; nNaCl=0,002 mol. AgNO₃ giới hạn; m=0,001×143,32=0,14332 g.' },
    quiz: [{ id: 'excess-salt', stem: 'AgNO₃ đã hết. Thêm NaCl tạo thêm AgCl trong mô hình này không?', options: ['Có, luôn tăng', 'Không', 'Tùy màu cốc', 'Tăng gấp đôi'], correctIndex: 1, explanation: 'Cần cả hai chất phản ứng; AgNO₃ đã hết nên không tạo thêm AgCl.' }] },
  { id: 'gas-reaction', subjectId: 'chemistry', chapterId: 'gas-reactions', title: 'Axit và bicarbonat: CO₂ đến từ đâu?', lead: 'Thay lượng chất và dự đoán thể tích khí ở cùng điều kiện.',
    knowledge: [{ title: 'Phản ứng sinh khí', text: 'HCl phản ứng với NaHCO₃ tạo NaCl, nước và CO₂. Mô hình xét sản phẩm cuối khi phản ứng hoàn toàn, không tính tốc độ sủi bọt hoặc khí hòa tan.' }, { title: 'Lượng chất và điều kiện khí', text: 'Tỉ lệ HCl:NaHCO₃:CO₂ bằng 1:1:1. Thể tích khí phụ thuộc số mol, nhiệt độ và áp suất. Lab dùng khí lý tưởng tại 25°C và 1 atm; không dùng 22,4 L/mol ở điều kiện này.' }, { title: 'An toàn', text: 'Khí sinh ra có thể gây tăng áp trong bình kín. Hình ảnh chỉ minh họa, không hướng dẫn tự làm thí nghiệm ngoài phòng học.' }],
    formulas: [{ expression: 'HCl + NaHCO₃ → NaCl + H₂O + CO₂↑', description: 'HCl cố định 0,1 M, NaHCO₃ tinh khiết theo mô hình.' }, { expression: 'nCO₂ = min(CV, m/84,0066); V = nRT/P', description: 'Vaxit theo L; khí tại 298,15 K, 1 atm. R = 0,082057366 L·atm/(mol·K).' }],
    exercise: { id: 'gas-moles', prompt: 'Cho 25 mL HCl 0,1 M phản ứng với 0,42 g NaHCO₃ (M=84,0066 g/mol). Giả sử phản ứng hoàn toàn, tính số mol CO₂.', unit: 'mol', answer: .0025, tolerance: .00001, hint: 'So 0,1×0,025 mol HCl với 0,42/84,0066 mol NaHCO₃.', explanation: 'HCl có 0,0025 mol và là chất giới hạn. Theo tỉ lệ 1:1 tạo 0,0025 mol CO₂.' },
    quiz: [{ id: 'gas-condition', stem: 'Cùng số mol CO₂, giữ áp suất và tăng nhiệt độ tuyệt đối thì thể tích khí lý tưởng?', options: ['Giảm', 'Không đổi', 'Tăng', 'Luôn bằng 22,4 L'], correctIndex: 2, explanation: 'V = nRT/P nên tăng theo nhiệt độ tuyệt đối khi n, P cố định.' }] },
];
export const lessons: Lesson[] = [...originalLessons, ...added.filter(item => item.id === 'mechanics'), springLesson, ...reactionNetworkLessons];
export const lessonById = (id: string) => lessons.find(lesson => lesson.id === id)!;
export const legacyLabLink = (id: string) => id === 'circuit' || id === 'chemistry';

export function downloadText(name: string, text: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob(type === 'application/json' ? [text] : ['\uFEFF', text], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readLocal<T>(key: string, fallback: T, valid: (value: unknown) => value is T): T {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) || 'null'); return valid(value) ? value : fallback; }
  catch { return fallback; }
}
