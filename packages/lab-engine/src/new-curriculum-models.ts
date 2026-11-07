/**
 * New Curriculum Models for LumiLab target 9-lab syllabus (SGK GDPT 2018):
 * - Pulley system (VL-RONGROC-01)
 * - Alkali metal with water & flame test (HH-KIEM-01)
 * - Copper with HNO3 dilute & concentrated (HH-HNO3-01)
 * - Chlorine preparation & bleaching (HH-CHLORINE-01)
 */

// --- 1. RÒNG RỌC VÀ PA-LĂNG (VL-RONGROC-01) ---
export type PulleyType = 'fixed' | 'single_movable' | 'palang_4';

export interface PulleyParameters {
  loadMass_kg: number;
  pulleyType: PulleyType;
  liftHeight_m: number;
}

export const defaultPulley: PulleyParameters = {
  loadMass_kg: 2,
  pulleyType: 'single_movable',
  liftHeight_m: 0.5,
};

export function pulleyReading(p: PulleyParameters) {
  const g = 9.81;
  const loadWeight_N = p.loadMass_kg * g;
  const n = p.pulleyType === 'fixed' ? 1 : p.pulleyType === 'palang_4' ? 4 : 2;
  const effortForce_N = loadWeight_N / n;
  const ropeDistance_m = p.liftHeight_m * n;
  const work_J = effortForce_N * ropeDistance_m;

  return {
    loadWeight_N,
    effortForce_N,
    ropeDistance_m,
    liftHeight_m: p.liftHeight_m,
    work_J,
    mechanicalAdvantage: n,
    description:
      p.pulleyType === 'fixed'
        ? 'Ròng rọc cố định: Chỉ đổi hướng của lực kéo, không được lợi về lực (F = P, s = h).'
        : p.pulleyType === 'single_movable'
        ? 'Ròng rọc động (2 nhánh dây đỡ): Được lợi 2 lần về lực (F = P/2), nhưng thiệt 2 lần về đường đi (s = 2h).'
        : 'Pa-lăng 4 nhánh dây đỡ: Được lợi 4 lần về lực (F = P/4), thiệt 4 lần về đường đi (s = 4h).',
  };
}

// --- 2. KIM LOẠI KIỀM VỚI NƯỚC & THỬ MÀU NGỌN LỬA (HH-KIEM-01) ---
export type AlkaliMetal = 'na' | 'k';
export type AlkaliMode = 'water_reaction' | 'flame_test';

export interface AlkaliParameters {
  metal: AlkaliMetal;
  mass_g: number;
  waterVolume_ml: number;
  mode: AlkaliMode;
}

export const defaultAlkali: AlkaliParameters = {
  metal: 'na',
  mass_g: 0.23,
  waterVolume_ml: 100,
  mode: 'water_reaction',
};

export function alkaliReading(p: AlkaliParameters) {
  const molarMass = p.metal === 'na' ? 22.99 : 39.10;
  const moles = p.mass_g / molarMass;
  const h2Moles = moles / 2;
  // 24.79 L/mol at 25 °C and 1 bar (dieu kien chuan theo SGK moi)
  const h2Volume_ml = h2Moles * 24790;
  const concentration_M = moles / (p.waterVolume_ml / 1000);
  const pOH = concentration_M > 0 ? -Math.log10(concentration_M) : 7;
  const pH = Math.min(14, Math.max(7, 14 - pOH));

  return {
    metalMoles: moles,
    h2Moles,
    h2Volume_ml,
    pH,
    indicatorColor: pH > 8.3 ? 'Hồng cánh sen đậm' : 'Không màu',
    flameColor: p.metal === 'na' ? 'Vàng tươi (589 nm)' : 'Tím nhạt (766 nm)',
    equation: `2${p.metal.toUpperCase()} + 2H₂O → 2${p.metal.toUpperCase()}OH + H₂↑`,
    flameHex: p.metal === 'na' ? '#ffc800' : '#b28dff',
    reactionIntensity: p.metal === 'na' ? 'Mạnh' : 'Rất mãnh liệt (Tự bốc cháy)',
    phenomenon:
      p.mode === 'water_reaction'
        ? p.metal === 'na'
          ? 'Mẩu Na nóng chảy thành viên bi tròn sáng lóa, chạy lướt nhanh trên mặt nước, sủi bọt khí H₂, dung dịch hóa hồng với phenolphthalein.'
          : 'Mẩu K phản ứng dữ dội, bốc cháy với ngọn lửa màu tím nhạt, nổ lép bép trên mặt nước, dung dịch hóa hồng tím đậm.'
        : p.metal === 'na'
        ? 'Phép thử ngọn lửa: Hợp chất của Natri làm ngọn lửa đèn khí phát sáng màu VÀNG TƯƠI rực rỡ.'
        : 'Phép thử ngọn lửa: Hợp chất của Kali làm ngọn lửa phát sáng màu TÍM NHẠT (quan sát rõ qua kính coban).',
  };
}

// --- 3. KIM LOẠI TÁC DỤNG VỚI AXIT NITRIC (HH-HNO3-01) ---
export type Hno3Concentration = 'dilute' | 'concentrated';

export interface Hno3Parameters {
  concentration: Hno3Concentration;
  copperMass_g: number;
  acidVolume_ml: number;
}

export const defaultHno3: Hno3Parameters = {
  concentration: 'dilute',
  copperMass_g: 0.64,
  acidVolume_ml: 20,
};

export function hno3Reading(p: Hno3Parameters) {
  const cuMoles = p.copperMass_g / 63.546;
  const isDilute = p.concentration === 'dilute';
  const gasMoles = isDilute ? cuMoles * (2 / 3) : cuMoles * 2;
  const gasVolume_ml = gasMoles * 24790;

  return {
    cuMoles,
    gasMoles,
    gasVolume_ml,
    gasType: isDilute ? 'NO' : 'NO₂',
    initialGasColor: isDilute ? 'Không màu' : 'Nâu đỏ đậm',
    finalGasColor: 'Nâu đỏ (NO₂)',
    solutionColor: isDilute ? 'Xanh lam nhạt (Cu²⁺)' : 'Xanh lục đậm rồi xanh lam',
    equation: isDilute
      ? '3Cu + 8HNO₃ (loãng) → 3Cu(NO₃)₂ + 2NO↑ + 4H₂O'
      : 'Cu + 4HNO₃ (đặc) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O',
    airOxidationEquation: isDilute ? '2NO + O₂ (không khí) → 2NO₂ (nâu đỏ)' : null,
    phenomenon: isDilute
      ? 'Mẩu đồng tan dần, sủi bọt khí NO không màu; khi khí thoát lên miệng ống nghiệm gặp không khí lập tức hóa nâu đỏ (NO₂). Dung dịch chuyển màu xanh lam.'
      : 'Phản ứng xảy ra mãnh liệt, tỏa nhiệt mạnh, tạo luồng khí NO₂ màu NÂU ĐỎ cuồn cuộn bay ra, dung dịch chuyển sang màu xanh lục.',
  };
}

// --- 4. ĐIỀU CHẾ VÀ TÍNH TẨY MÀU CỦA KHÍ CLO (HH-CHLORINE-01) ---
export type ChlorineStrip = 'dry' | 'wet';

export interface ChlorineParameters {
  kmno4Mass_g: number;
  hclVolume_ml: number;
  stripType: ChlorineStrip;
}

export const defaultChlorine: ChlorineParameters = {
  kmno4Mass_g: 1.58,
  hclVolume_ml: 20,
  stripType: 'wet',
};

export function chlorineReading(p: ChlorineParameters) {
  const kmno4Moles = p.kmno4Mass_g / 158.034;
  const cl2Moles = kmno4Moles * 2.5;
  const cl2Volume_ml = cl2Moles * 24790;
  const isBleached = p.stripType === 'wet';

  return {
    kmno4Moles,
    cl2Moles,
    cl2Volume_ml,
    gasColor: 'Vàng lục nhạt (Khí Cl₂)',
    isBleached,
    stripResult: isBleached
      ? 'MẤT MÀU HOÀN TOÀN (Bị tẩy trắng)'
      : 'GIỮ NGUYÊN MÀU (Không bị tẩy màu)',
    prepEquation: '2KMnO₄ + 16HCl (đặc) → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O',
    bleachEquation: 'Cl₂ + H₂O ⇌ HCl + HClO (axit hipoclorơ)',
    explanation: isBleached
      ? 'Giấy màu ẩm bị mất màu vì khí Cl₂ tác dụng với nước tạo ra axit hipoclorơ (HClO). HClO có tính oxi hóa rất mạnh, phá hủy các hợp chất màu.'
      : 'Khí Cl₂ khô không có tính tẩy màu; chỉ khi có sự hiện diện của nước tạo ra HClO thì tính tẩy màu mới xuất hiện.',
  };
}
