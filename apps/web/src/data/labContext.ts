import type { LabId } from '@lumilab/lab-engine';
import type { Engines } from '../labSession';

export function labContext(engines: Engines, id: LabId) {
  const shared = engines[id].snapshot();
  let facts = '', guidance = '';
  if (id === 'pendulum') {
    const { parameters: p, reading: r } = engines.pendulum.snapshot();
    facts = `L = ${p.length_m.toFixed(2)} m; m = ${p.mass_kg.toFixed(2)} kg; góc thả = ${p.angle_deg}°; T = ${r.period_s === null ? 'không có dao động' : `${r.period_s.toFixed(3)} s`}.`;
    guidance = 'Giữ chiều dài và góc thả, chỉ đổi khối lượng. Ghi hai lượt và so sánh chu kỳ. Ở mô hình lý tưởng, khối lượng không làm đổi chu kỳ; góc lớn dùng mô hình phi tuyến.';
  } else if (id === 'chemistry') {
    const { parameters: p, reading: r } = engines.chemistry.snapshot();
    facts = `${r.equation}\nBazơ đã thêm ${p.baseVolume_ml.toFixed(2)} mL; pH = ${r.pH.toFixed(3)}; chỉ thị ${r.indicatorFraction > 0 ? 'hồng' : 'không màu'}.`;
    guidance = 'Ghi pH ở 24,95; 25,00 và 25,05 mL. So sánh số mol H⁺ với OH⁻ trước và sau tương đương. pH7 vẫn không màu; màu chỉ thị và điểm tương đương không trùng nhau trong mô hình này.';
  } else if (id === 'circuit') {
    const { parameters: p, reading: r } = engines.circuit.snapshot();
    facts = `U nguồn = ${p.voltage_V.toFixed(1)} V; R tổng = ${r.totalResistance_ohm} Ω; I = ${r.current_A === null ? 'chưa đọc: sai cách mắc đồng hồ' : `${r.current_A.toFixed(3)} A`}; U trên R chính = ${r.resistorVoltage_V === null ? '—' : `${r.resistorVoltage_V.toFixed(2)} V`}. Công tắc: ${r.closed ? 'mạch kín' : 'mạch hở'}.`;
    guidance = !r.valid ? 'Kiểm tra ampe kế nối tiếp và vôn kế song song với R chính trước khi đọc số đo.' : 'Giữ U nguồn, thêm điện trở nối tiếp rồi so sánh I. Dùng R tổng, không chỉ R chính, trong I = U nguồn/R tổng. Vôn kế chỉ đo trên R chính.';
  }
  if (id === 'mechanics') {
    const { parameters: p, reading: r, elapsed_s } = engines.mechanics.snapshot();
    facts = `m=${p.mass_kg.toFixed(1)}kg; F=${p.force_N.toFixed(1)}N; t=${elapsed_s.toFixed(2)}s; a=${r.acceleration_m_s2.toFixed(2)}m/s²; v=${r.velocity_m_s.toFixed(2)}m/s; x=${r.position_m.toFixed(2)}m.`;
    guidance = 'Giữ lực, tăng khối lượng và so sánh a=F/m. Nếu F=0, vận tốc vẫn có thể khác0 do vận tốc ban đầu.';
  } else if (id === 'spring') {
    const { parameters: p, reading: r } = engines.spring.snapshot();
    facts = `m=${p.mass_kg.toFixed(1)}kg; k=${p.stiffness_N_m}N/m; x=${r.displacement_m.toFixed(3)}m; T=${r.period_s?.toFixed(3) ?? 'không dao động'}s; E=${r.totalEnergy_J.toFixed(3)}J.`;
    guidance = 'Giữ k, tăng m rồi so sánh T. Với lò xo Hooke lý tưởng, T=2π√(m/k); biên độ khác0 không làm đổi chu kỳ.';
  } else if (id === 'electrochemistry') {
    const { reading: r } = engines.electrochemistry.snapshot();
    facts = `${r.reaction}; E°pin=${r.emf_V.toFixed(2)}V; U phải−trái=${r.meterVoltage_V?.toFixed(2) ?? 'chưa đọc'}V.`;
    guidance = 'Đổi hai điện cực và so dấu U phải−trái. Điện cực có thế khử chuẩn lớn hơn là cathode; E°pin không cho biết dòng điện thực khi chưa có mô hình tải.';
  } else if (id === 'atomic') {
    const { parameters: p, reading: r } = engines.atomic.snapshot();
    facts = `${r.name} (${r.symbol}); Z=${p.protons}; N=${p.neutrons}; số electron=${p.electrons}; A=${r.massNumber}; q/e=${r.charge_e}.`;
    guidance = 'Giữ proton, đổi neutron để thấy số khối thay đổi; đổi electron để thấy điện tích thay đổi. Sơ đồ không mô tả quỹ đạo electron thật hoặc độ bền đồng vị.';
  }
  if (['parallel-circuit', 'capacitor', 'precipitation', 'gas-reaction'].includes(id)) {
    facts = JSON.stringify(shared.reading);
    guidance = id === 'parallel-circuit' ? 'Giữ U, R₁, R₂; so sánh I khi đổi từ nối tiếp sang song song. Kiểm I toàn mạch bằng tổng dòng nhánh ở mạch song song.' : id === 'capacitor' ? 'Thay R hoặc C, quan sát thời gian nạp. Tại t = RC, điện áp nạp đạt khoảng 63,2% U nguồn; khi xả còn 36,8%.' : id === 'precipitation' ? 'Giữ nồng độ 0,1 M, chỉ đổi thể tích một dung dịch. So sánh số mol hai chất và lượng AgCl tạo thành; độ đục chỉ minh họa.' : 'Giữ lượng axit, tăng NaHCO₃ và so lượng CO₂. Khi axit hết, thêm bicarbonat không làm tăng sản phẩm. Thể tích khí theo mô hình lý tưởng 25°C, 1 atm.';
  }
  return { facts, guidance, records: shared.records.length, prediction: shared.notes.prediction, reflection: shared.notes.reflection, modelVersion: engines[id].modelVersion, sources: engines[id].definition.sources };
}
