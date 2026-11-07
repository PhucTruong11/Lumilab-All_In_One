import { activeLabIds, archivedLabIds, labDefinitions, type LabId } from '@lumilab/lab-engine';
export const practiceIds: readonly LabId[] = activeLabIds;
export const archivedPracticeIds: readonly LabId[] = archivedLabIds;
export const practiceInfo: Record<LabId, { chapter: string; lead: string; action: string; label: string }> = {
  pendulum: { chapter: 'Dao động', lead: 'Điều gì làm chu kỳ thay đổi? Kéo quả nặng và thử từng giả thuyết.', action: 'Kéo quả nặng · đo chu kỳ', label: 'Mở lab con lắc' },
  spring: { chapter: 'Dao động', lead: 'Kéo rồi thả vật. So sánh khối lượng, độ cứng và nhịp dao động.', action: 'Thả vật · xem đồ thị x(t)', label: 'Mở lab con lắc lò xo' },
  mechanics: { chapter: 'Chuyển động và lực', lead: 'Đẩy cùng một chiếc xe bằng những lực khác nhau và so sánh gia tốc.', action: 'Kéo lực · đặt quả cân', label: 'Mở lab định luật II Newton' },
  pulley: { chapter: 'Chuyển động và lực', lead: 'Khảo sát lợi về lực và quãng đường kéo dây qua ròng rọc cố định, động và pa-lăng.', action: 'Kéo dây · đo lực F', label: 'Mở lab hệ ròng rọc' },
  circuit: { chapter: 'Dòng điện và mạch điện', lead: 'Tự lắp linh kiện, mắc đồng hồ và đọc số đo ngay trên mạch.', action: 'Lắp mạch · đo I–U', label: 'Mở lab mạch điện' },
  capacitor: { chapter: 'Dòng điện và mạch điện', lead: 'Nạp và xả tụ điện. Khám phá hằng số thời gian qua đồ thị điện áp.', action: 'Đóng mạch · đo U(t)', label: 'Mở lab tụ điện RC' },
  'alkali-metal': { chapter: 'Hóa học vô cơ thực nghiệm', lead: 'Kim loại kiềm tác dụng mãnh liệt với nước và phát màu ngọn lửa đặc trưng.', action: 'Thả Na/K · thử màu lửa', label: 'Mở lab kim loại kiềm' },
  'hno3-reaction': { chapter: 'Hóa học vô cơ thực nghiệm', lead: 'Đồng tác dụng với axit nitric đặc (khí NO₂ nâu đỏ) và loãng (khí NO).', action: 'Chọn nồng độ · quan sát khí', label: 'Mở lab phản ứng HNO₃' },
  'chlorine-gas': { chapter: 'Hóa học vô cơ thực nghiệm', lead: 'Điều chế khí clo và kiểm chứng tính tẩy màu của clo ẩm so với clo khô.', action: 'Điều chế Cl₂ · thử giấy màu', label: 'Mở lab khí clo' },
  chemistry: { chapter: 'Dung dịch và axit–bazơ', lead: 'Thêm từng giọt bazơ. Quan sát màu và pH quanh điểm tương đương.', action: 'Rót dung dịch · xem pH', label: 'Mở lab chuẩn độ' },
  'parallel-circuit': { chapter: 'Dòng điện và mạch điện', lead: 'Chuyển hai điện trở từ nối tiếp sang song song. Theo dõi dòng từng nhánh.', action: 'Kéo linh kiện · đổi cách nối', label: 'Mở lab mạch nối tiếp–song song' },
  precipitation: { chapter: 'Phản ứng tạo kết tủa', lead: 'Rót hai dung dịch để tạo AgCl trắng. Chất nào quyết định lượng kết tủa?', action: 'Rót dung dịch · cân lượng AgCl', label: 'Mở lab kết tủa AgCl' },
  'gas-reaction': { chapter: 'Phản ứng tạo khí', lead: 'Thêm bicarbonat vào axit. Thay lượng chất và so sánh thể tích CO₂.', action: 'Thêm chất · đo CO₂', label: 'Mở lab phản ứng tạo khí' },
  electrochemistry: { chapter: 'Điện hóa', lead: 'Đổi điện cực để khám phá chiều phản ứng và điện áp của pin.', action: 'Lắp điện cực · nối cầu muối', label: 'Mở lab pin điện hóa' },
  atomic: { chapter: 'Cấu tạo nguyên tử', lead: 'Lắp ghép proton, neutron và electron để hiểu nguyên tử, đồng vị và ion.', action: 'Mô hình hạt · so sánh p/n/e', label: 'Mở lab cấu tạo nguyên tử' },
};
export function practiceTitle(id: LabId) { return labDefinitions[id].title; }
