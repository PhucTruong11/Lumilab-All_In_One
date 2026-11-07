import { practiceMapping } from '@lumilab/contracts';
import { activeLabIds, archivedLabIds, isLabId, labDefinitions, type LabId } from '@lumilab/lab-engine';
export const practiceIds: readonly LabId[] = activeLabIds;
export const archivedPracticeIds: readonly LabId[] = archivedLabIds;
function runtimeId(id: string): LabId {
  if (!isLabId(id)) throw new Error('Practice references an unsupported runtime');
  return id;
}
export const practiceGroups: readonly { primary: LabId; title: string; modes: readonly LabId[] }[] =
  practiceMapping.practices.map(item => ({ primary: runtimeId(item.primary), title: item.title,
    modes: item.runtime_ids.map(runtimeId) }));
export const practiceInfo: Record<LabId, { chapter: string; lead: string; action: string; label: string }> = {
  pendulum: { chapter: 'Dao động', lead: 'Điều gì làm chu kỳ thay đổi? Kéo quả nặng và thử từng giả thuyết.', action: 'Kéo quả nặng · đo chu kỳ', label: 'Mở lab con lắc' },
  spring: { chapter: 'Dao động', lead: 'Kéo rồi thả vật. So sánh khối lượng, độ cứng và nhịp dao động.', action: 'Thả vật · xem đồ thị x(t)', label: 'Mở lab con lắc lò xo' },
  mechanics: { chapter: 'Chuyển động và lực', lead: 'Đẩy cùng một chiếc xe bằng những lực khác nhau và so sánh gia tốc.', action: 'Kéo lực · đặt quả cân', label: 'Mở lab định luật II Newton' },
  circuit: { chapter: 'Dòng điện và mạch điện', lead: 'Tự lắp linh kiện, mắc đồng hồ và đọc số đo ngay trên mạch.', action: 'Lắp mạch · đo I–U', label: 'Mở lab mạch điện' },
  chemistry: { chapter: 'Dung dịch và axit–bazơ', lead: 'Thêm từng giọt bazơ. Quan sát màu và pH quanh điểm tương đương.', action: 'Rót dung dịch · xem pH', label: 'Mở lab chuẩn độ' },
  'parallel-circuit': { chapter: 'Dòng điện và mạch điện', lead: 'Chuyển hai điện trở từ nối tiếp sang song song. Theo dõi dòng từng nhánh.', action: 'Kéo linh kiện · đổi cách nối', label: 'Mở lab mạch nối tiếp–song song' },
  capacitor: { chapter: 'Dòng điện và mạch điện', lead: 'Nạp và xả tụ điện. Khám phá hằng số thời gian qua đồ thị điện áp.', action: 'Đóng mạch · đo U(t)', label: 'Mở lab tụ điện RC' },
  precipitation: { chapter: 'Phản ứng tạo kết tủa', lead: 'Rót hai dung dịch để tạo AgCl trắng. Chất nào quyết định lượng kết tủa?', action: 'Rót dung dịch · cân lượng AgCl', label: 'Mở lab kết tủa AgCl' },
  'gas-reaction': { chapter: 'Phản ứng tạo khí', lead: 'Thêm bicarbonat vào axit. Thay lượng chất và so sánh thể tích CO₂.', action: 'Thêm chất · đo CO₂', label: 'Mở lab phản ứng tạo khí' },
  electrochemistry: { chapter: 'Điện hóa', lead: 'Đổi điện cực để khám phá chiều phản ứng và điện áp của pin.', action: 'Lắp điện cực · nối cầu muối', label: 'Mở lab pin điện hóa' },
  atomic: { chapter: 'Cấu tạo nguyên tử', lead: 'Lắp ghép proton, neutron và electron để hiểu nguyên tử, đồng vị và ion.', action: 'Mô hình hạt · so sánh p/n/e', label: 'Mở lab cấu tạo nguyên tử' },
  'spring-damped': { chapter: 'Dao động', lead: 'Thay độ cản để quan sát biên độ và cơ năng giảm dần.', action: 'Đổi điều kiện · ghi kết quả', label: 'Mở lab Con lắc lò xo tắt dần' },
  'inclined-plane': { chapter: 'Chuyển động và lực', lead: 'Đổi góc nghiêng và ma sát để tìm ngưỡng trượt.', action: 'Đổi điều kiện · ghi kết quả', label: 'Mở lab Newton II và mặt phẳng nghiêng' },
  'pulley': { chapter: 'Chuyển động và lực', lead: 'Đếm nhánh dây đỡ để so lực kéo và quãng đường kéo.', action: 'Đổi điều kiện · ghi kết quả', label: 'Mở lab Ròng rọc và pa-lăng' },
  'alkali-water': { chapter: 'Hóa học vô cơ', lead: 'Tách hiện tượng phản ứng với nước khỏi màu nhận biết ion.', action: 'Đổi điều kiện · ghi kết quả', label: 'Mở lab Na, K tác dụng với nước và màu ngọn lửa' },
  'copper-nitric': { chapter: 'Hóa học vô cơ', lead: 'So sánh sản phẩm khí chính trong hai kịch bản đại diện.', action: 'Đổi điều kiện · ghi kết quả', label: 'Mở lab Đồng với HNO₃: NO và NO₂' },
  'chlorine-bleach': { chapter: 'Hóa học vô cơ', lead: 'Xem nguyên lí tạo clo rồi so sánh giấy màu khô và ẩm.', action: 'Đổi điều kiện · ghi kết quả', label: 'Mở lab Clo và tính tẩy màu trong điều kiện ẩm' },
};
export function practiceTitle(id: LabId) { return labDefinitions[id].title; }
