const gravity = 9.81;
export interface DampedSpringParameters {
  mass_kg: number;
  stiffness_N_m: number;
  displacement_m: number;
  damping_ratio: number;
}
export function dampedSpringReading(p: DampedSpringParameters, t: number) {
  const natural = Math.sqrt(p.stiffness_N_m / p.mass_kg);
  const decay = p.damping_ratio * natural;
  const frequency = natural * Math.sqrt(1 - p.damping_ratio ** 2);
  const envelope = p.displacement_m * Math.exp(-decay * t);
  const x = envelope * (Math.cos(frequency * t) + decay / frequency * Math.sin(frequency * t));
  const v = -envelope * natural ** 2 / frequency * Math.sin(frequency * t);
  return { time_s: t, displacement_m: x, velocity_m_s: v,
    envelope_m: Math.abs(envelope) * natural / frequency,
    period_s: p.displacement_m === 0 ? null : 2 * Math.PI / frequency,
    energy_J: (p.stiffness_N_m * x ** 2 + p.mass_kg * v ** 2) / 2 };
}

export interface InclineParameters { mass_kg: number; angle_deg: number; static_friction: number }
export function inclineReading(p: InclineParameters, t: number) {
  const angle = p.angle_deg * Math.PI / 180;
  const normal = p.mass_kg * gravity * Math.cos(angle);
  const downhill = p.mass_kg * gravity * Math.sin(angle);
  const stationary = Math.tan(angle) <= p.static_friction + 1e-12;
  const friction = stationary ? downhill : 0.8 * p.static_friction * normal;
  const acceleration = (downhill - friction) / p.mass_kg;
  const arrival = acceleration > 0 ? Math.sqrt(10 / acceleration) : Infinity;
  const travelTime = Math.min(t, arrival);
  return { state: stationary ? 'Đứng yên' : t === 0 ? 'Sẵn sàng trượt' : t >= arrival ? 'Đến cuối dốc' : 'Đang trượt',
    time_s: travelTime, normal_N: normal, downhill_N: downhill, friction_N: friction,
    acceleration_m_s2: acceleration, velocity_m_s: acceleration * travelTime,
    position_m: Math.min(5, 0.5 * acceleration * travelTime ** 2) };
}

export interface PulleyParameters { mass_kg: number; strands: 1 | 2 | 4; lift_m: number }
export function pulleyReading(p: PulleyParameters) {
  const weight = p.mass_kg * gravity;
  return { weight_N: weight, pull_N: weight / p.strands, rope_m: p.lift_m * p.strands, work_J: weight * p.lift_m };
}

export interface AlkaliParameters { metal: 'Na' | 'K'; mode: 'water' | 'flame'; observed: boolean }
export interface NitricParameters { acid: 'dilute' | 'concentrated'; air: boolean; observed: boolean }
export interface ChlorineParameters { mode: 'formation' | 'bleach'; damp: boolean; observed: boolean }
interface Observation { product: string | null; appearance: string | null; equation: string | null; detail: string }
function pending(): Observation {
  return { product: null, appearance: null, equation: null, detail: 'Chọn điều kiện, dự đoán hiện tượng rồi quan sát.' };
}
export function alkaliReading(p: AlkaliParameters): Observation {
  if (!p.observed) return pending();
  if (p.mode === 'flame') return {
    product: p.metal + '⁺', appearance: p.metal === 'Na' ? 'Vàng' : 'Tím nhạt', equation: null,
    detail: 'Màu minh họa của ion trong phép thử ngọn lửa riêng.',
  };
  return { product: p.metal + 'OH và H₂', appearance: 'Bọt khí',
    equation: `2${p.metal} + 2H₂O → 2${p.metal}OH + H₂`,
    detail: 'Hydrogen thoát ra và dung dịch có tính kiềm.' };
}
export function nitricReading(p: NitricParameters): Observation {
  if (!p.observed) return pending();
  if (p.acid === 'concentrated') return {
    product: 'NO₂', appearance: 'Nâu đỏ', equation: 'Cu + 4HNO₃ → Cu(NO₃)₂ + 2NO₂ + 2H₂O',
    detail: 'Kịch bản đại diện cho đồng với axit đặc. Sản phẩm khí chính của mô hình là NO₂.',
  };
  return { product: 'NO', appearance: p.air ? 'Có thể chuyển nâu đỏ' : 'Không màu',
    equation: '3Cu + 8HNO₃ → 3Cu(NO₃)₂ + 2NO + 4H₂O',
    detail: p.air ? 'NO ban đầu không màu. Khi gặp oxygen, một phần có thể chuyển thành NO₂: 2NO + O₂ → 2NO₂.'
      : 'Kịch bản đại diện cho đồng với axit loãng. Khí NO ban đầu không màu.' };
}
export function chlorineReading(p: ChlorineParameters): Observation {
  if (!p.observed) return pending();
  if (p.mode === 'formation') return { product: 'Cl₂', appearance: 'Minh họa oxi hóa',
    equation: '2Cl⁻ → Cl₂ + 2e⁻', detail: 'Hai ion chloride nhường hai electron để tạo một phân tử clo.' };
  return p.damp ? { product: 'HOCl', appearance: 'Giấy màu nhạt rõ', equation: 'Cl₂ + H₂O ⇌ HCl + HOCl',
    detail: 'HOCl tạo trong môi trường có nước và oxi hóa chất màu trong mô hình.' }
    : { product: null, appearance: 'Không thấy tẩy màu rõ', equation: null,
      detail: 'Đối chứng dùng giấy khô trong điều kiện khô. Kết luận giới hạn trong kịch bản này.' };
}
