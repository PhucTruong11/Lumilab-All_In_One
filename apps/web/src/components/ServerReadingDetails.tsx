import type { PreviewValue } from '../api';

const fields: Record<string, [string, string?]> = {
  period_s: ['Chu kỳ', 's'], frequency_hz: ['Tần số', 'Hz'], energy_j: ['Cơ năng', 'J'],
  max_speed_m_s: ['Tốc độ lớn nhất', 'm/s'], pH: ['pH'], hydrogen_mol_L: ['Nồng độ ion H⁺', 'mol/L'],
  indicatorFraction: ['Mức đổi màu chỉ thị'], salt: ['Muối tạo thành'], totalVolume_ml: ['Tổng thể tích', 'mL'],
  equation: ['Phương trình phản ứng'], acidMoles: ['Số mol axit', 'mol'], baseMoles: ['Số mol bazơ', 'mol'],
  saltMoles: ['Số mol muối', 'mol'], remainingAcidMoles: ['Số mol axit còn lại', 'mol'],
  remainingBaseMoles: ['Số mol bazơ còn lại', 'mol'], equivalenceVolume_ml: ['Thể tích tại điểm tương đương', 'mL'],
  stage: ['Giai đoạn phản ứng'], valid: ['Cách mắc hợp lệ'], closed: ['Công tắc'],
  totalResistance_ohm: ['Tổng điện trở', 'Ω'], current_A: ['Dòng điện', 'A'],
  resistorVoltage_V: ['Điện áp trên điện trở', 'V'], power_W: ['Công suất', 'W'],
  bulbPower_W: ['Công suất bóng đèn', 'W'], acceleration_m_s2: ['Gia tốc', 'm/s²'],
  velocity_m_s: ['Vận tốc', 'm/s'], position_m: ['Vị trí', 'm'], kineticEnergy_J: ['Động năng', 'J'],
  omega_rad_s: ['Tần số góc', 'rad/s'], displacement_m: ['Li độ', 'm'], force_N: ['Lực', 'N'],
  potentialEnergy_J: ['Thế năng', 'J'], totalEnergy_J: ['Cơ năng', 'J'], voltage_V: ['Hiệu điện thế', 'V'],
  emf_V: ['Suất điện động', 'V'], meterVoltage_V: ['Điện áp đo', 'V'],
  anodeSide: ['Vị trí anode'], cathodeSide: ['Vị trí cathode'], anode: ['Anode'], cathode: ['Cathode'],
  exchangedElectrons: ['Số electron trao đổi'], reaction: ['Phản ứng'], electronDirection: ['Chiều electron'],
  symbol: ['Kí hiệu nguyên tố'], name: ['Tên nguyên tố'], atomicNumber: ['Số hiệu nguyên tử'],
  massNumber: ['Số khối'], charge_e: ['Điện tích', 'e'], species: ['Loại hạt'], shells: ['Electron theo lớp'],
  equivalentResistance_ohm: ['Điện trở tương đương', 'Ω'], totalCurrent_A: ['Dòng toàn mạch', 'A'],
  branch1Current_A: ['Dòng nhánh 1', 'A'], branch2Current_A: ['Dòng nhánh 2', 'A'],
  resistor1Voltage_V: ['Điện áp điện trở 1', 'V'], resistor2Voltage_V: ['Điện áp điện trở 2', 'V'],
  totalPower_W: ['Tổng công suất', 'W'], topology: ['Cách mắc'], elapsed_s: ['Thời gian', 's'],
  timeConstant_s: ['Hằng số thời gian', 's'], capacitorVoltage_V: ['Điện áp tụ', 'V'],
  charge_C: ['Điện tích tụ', 'C'], silverMoles: ['Số mol AgNO₃', 'mol'],
  chlorideMoles: ['Số mol NaCl', 'mol'], precipitateMoles: ['Số mol AgCl tạo thành', 'mol'],
  precipitateMass_g: ['Khối lượng AgCl', 'g'], remainingSilverMoles: ['Số mol AgNO₃ còn lại', 'mol'],
  remainingChlorideMoles: ['Số mol NaCl còn lại', 'mol'], hasPrecipitate: ['Có kết tủa'],
  limitingReagent: ['Chất giới hạn'], ionicEquation: ['Phương trình ion'],
  bicarbonateMoles: ['Số mol NaHCO₃', 'mol'], reactionMoles: ['Số mol phản ứng', 'mol'],
  carbonDioxideVolume_ml: ['Thể tích CO₂ lý thuyết ở 25°C, 1 atm', 'mL'],
  remainingBicarbonateMoles: ['Số mol NaHCO₃ còn lại', 'mol'], hasGas: ['Có khí tạo thành'],
  time_s: ['Thời gian mô phỏng', 's'], envelope_m: ['Đường bao biên độ', 'm'],
  energy_J: ['Cơ năng', 'J'], state: ['Trạng thái'], normal_N: ['Phản lực', 'N'],
  downhill_N: ['Thành phần trọng lực dọc dốc', 'N'], friction_N: ['Lực ma sát', 'N'],
  weight_N: ['Trọng lượng', 'N'], pull_N: ['Lực kéo', 'N'], rope_m: ['Dây cần kéo', 'm'],
  work_J: ['Công nâng tải', 'J'], product: ['Sản phẩm'], appearance: ['Hiện tượng'],
  detail: ['Giải thích của mô hình'],
};

const numberFormat = new Intl.NumberFormat('vi-VN', { maximumSignificantDigits: 5 });
const terms: Record<string, string> = {
  equivalent: 'Vừa đủ', acid: 'Axit dư', base: 'Bazơ dư', equivalence: 'Điểm tương đương',
  series: 'Nối tiếp', parallel: 'Song song', left: 'Bên trái', right: 'Bên phải',
};

function displayValue(key: string, value: PreviewValue, unit?: string) {
  if (value == null) return '—';
  if (typeof value === 'boolean') {
    if (key === 'closed') return value ? 'Đóng' : 'Mở';
    return value ? 'Có' : 'Không';
  }
  if (Array.isArray(value)) return value.map(item => numberFormat.format(item)).join(' · ') || '—';
  const shown = typeof value === 'number' ? numberFormat.format(value) : terms[value] || value;
  return unit ? `${shown} ${unit}` : shown;
}

export function ServerReadingDetails({ reading }: { reading: Record<string, PreviewValue> }) {
  return <dl>{Object.entries(reading).map(([key, value]) => {
    const [label, unit] = fields[key] || [key];
    return <div key={key}><dt>{label}</dt><dd>{displayValue(key, value, unit)}</dd></div>;
  })}</dl>;
}
