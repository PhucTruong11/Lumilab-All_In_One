"""Deterministic readings for new Vietnamese curriculum GDPT 2018 labs.

Matches @lumilab/lab-engine/new-curriculum-models.ts:
- pulley: loadMass_kg, pulleyType, liftHeight_m
- alkali-metal: metal, mass_g, waterVolume_ml, mode
- hno3-reaction: concentration, copperMass_g, acidVolume_ml
- chlorine-gas: kmno4Mass_g, hclVolume_ml, stripType
"""
from math import log10
from typing import Any


def pulley(p: dict[str, Any], _time: float) -> dict[str, Any]:
    load_kg = float(p["loadMass_kg"])
    pulley_type = str(p["pulleyType"])
    height_m = float(p["liftHeight_m"])
    g = 9.81
    n = 1 if pulley_type == "fixed" else (4 if pulley_type == "palang_4" else 2)
    load_weight = load_kg * g
    effort_force = load_weight / n
    rope_dist = height_m * n
    work_j = effort_force * rope_dist
    desc = (
        "Ròng rọc cố định: Chỉ đổi hướng của lực kéo, không được lợi về lực (F = P, s = h)."
        if pulley_type == "fixed"
        else "Ròng rọc động (2 nhánh dây đỡ): Được lợi 2 lần về lực (F = P/2), nhưng thiệt 2 lần về đường đi (s = 2h)."
        if pulley_type == "single_movable"
        else "Pa-lăng 4 nhánh dây đỡ: Được lợi 4 lần về lực (F = P/4), thiệt 4 lần về đường đi (s = 4h)."
    )
    return {
        "loadWeight_N": load_weight,
        "effortForce_N": effort_force,
        "ropeDistance_m": rope_dist,
        "liftHeight_m": height_m,
        "work_J": work_j,
        "mechanicalAdvantage": n,
        "description": desc,
    }


def alkali_metal(p: dict[str, Any], _time: float) -> dict[str, Any]:
    metal = str(p["metal"])
    mass_g = float(p["mass_g"])
    volume_ml = float(p["waterVolume_ml"])
    mode = str(p["mode"])
    molar_mass = 22.99 if metal == "na" else 39.10
    moles = mass_g / molar_mass
    h2_moles = moles / 2
    h2_volume = h2_moles * 24790
    conc = moles / (volume_ml / 1000)
    p_oh = -log10(conc) if conc > 0 else 7.0
    ph = min(14.0, max(7.0, 14.0 - p_oh))
    return {
        "metalMoles": moles,
        "h2Moles": h2_moles,
        "h2Volume_ml": h2_volume,
        "pH": ph,
        "indicatorColor": "Hồng cánh sen đậm" if ph > 8.3 else "Không màu",
        "flameColor": "Vàng tươi (589 nm)" if metal == "na" else "Tím nhạt (766 nm)",
        "equation": f"2{metal.upper()} + 2H₂O → 2{metal.upper()}OH + H₂↑",
        "flameHex": "#ffc800" if metal == "na" else "#b28dff",
        "reactionIntensity": "Mạnh" if metal == "na" else "Rất mãnh liệt (Tự bốc cháy)",
        "phenomenon": (
            "Mẩu Na nóng chảy thành viên bi tròn sáng lóa, chạy lướt nhanh trên mặt nước, sủi bọt khí H₂, dung dịch hóa hồng với phenolphthalein."
            if metal == "na"
            else "Mẩu K phản ứng dữ dội, bốc cháy với ngọn lửa màu tím nhạt, nổ lép bép trên mặt nước, dung dịch hóa hồng tím đậm."
        ) if mode == "water_reaction" else (
            "Phép thử ngọn lửa: Hợp chất của Natri làm ngọn lửa đèn khí phát sáng màu VÀNG TƯƠI rực rỡ."
            if metal == "na"
            else "Phép thử ngọn lửa: Hợp chất của Kali làm ngọn lửa phát sáng màu TÍM NHẠT (quan sát rõ qua kính coban)."
        ),
    }


def hno3_reaction(p: dict[str, Any], _time: float) -> dict[str, Any]:
    conc = str(p["concentration"])
    cu_mass = float(p["copperMass_g"])
    cu_moles = cu_mass / 63.546
    is_dilute = conc == "dilute"
    gas_moles = cu_moles * (2 / 3) if is_dilute else cu_moles * 2
    gas_volume = gas_moles * 24790
    return {
        "cuMoles": cu_moles,
        "gasMoles": gas_moles,
        "gasVolume_ml": gas_volume,
        "gasType": "NO" if is_dilute else "NO₂",
        "initialGasColor": "Không màu" if is_dilute else "Nâu đỏ đậm",
        "finalGasColor": "Nâu đỏ (NO₂)",
        "solutionColor": "Xanh lam nhạt (Cu²⁺)" if is_dilute else "Xanh lục đậm rồi xanh lam",
        "equation": (
            "3Cu + 8HNO₃ (loãng) → 3Cu(NO₃)₂ + 2NO↑ + 4H₂O"
            if is_dilute
            else "Cu + 4HNO₃ (đặc) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O"
        ),
        "airOxidationEquation": "2NO + O₂ (không khí) → 2NO₂ (nâu đỏ)" if is_dilute else None,
        "phenomenon": (
            "Mẩu đồng tan dần, sủi bọt khí NO không màu; khi khí thoát lên miệng ống nghiệm gặp không khí lập tức hóa nâu đỏ (NO₂). Dung dịch chuyển màu xanh lam."
            if is_dilute
            else "Phản ứng xảy ra mãnh liệt, tỏa nhiệt mạnh, tạo luồng khí NO₂ màu NÂU ĐỎ cuồn cuộn bay ra, dung dịch chuyển sang màu xanh lục."
        ),
    }


def chlorine_gas(p: dict[str, Any], _time: float) -> dict[str, Any]:
    kmno4_mass = float(p["kmno4Mass_g"])
    strip_type = str(p["stripType"])
    kmno4_moles = kmno4_mass / 158.034
    cl2_moles = kmno4_moles * 2.5
    cl2_volume = cl2_moles * 24790
    is_bleached = strip_type == "wet"
    return {
        "kmno4Moles": kmno4_moles,
        "cl2Moles": cl2_moles,
        "cl2Volume_ml": cl2_volume,
        "gasColor": "Vàng lục nhạt (Khí Cl₂)",
        "isBleached": is_bleached,
        "stripResult": (
            "MẤT MÀU HOÀN TOÀN (Bị tẩy trắng)"
            if is_bleached
            else "GIỮ NGUYÊN MÀU (Không bị tẩy màu)"
        ),
        "prepEquation": "2KMnO₄ + 16HCl (đặc) → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O",
        "bleachEquation": "Cl₂ + H₂O ⇌ HCl + HClO (axit hipoclorơ)",
        "explanation": (
            "Giấy màu ẩm bị mất màu vì khí Cl₂ tác dụng với nước tạo ra axit hipoclorơ (HClO). HClO có tính oxi hóa rất mạnh, phá hủy các hợp chất màu."
            if is_bleached
            else "Khí Cl₂ khô không có tính tẩy màu; chỉ khi có sự hiện diện của nước tạo ra HClO thì tính tẩy màu mới xuất hiện."
        ),
    }
