"""Draft numerical and qualitative models for the agreed curriculum."""
from math import cos, exp, inf, pi, sin, sqrt, tan

GRAVITY = 9.81


def damped_spring(p, t):
    natural = sqrt(p["stiffness_N_m"] / p["mass_kg"])
    decay = p["damping_ratio"] * natural
    omega = natural * sqrt(1 - p["damping_ratio"] ** 2)
    initial = p["displacement_m"]
    amplitude = initial * exp(-decay * t)
    x = amplitude * (cos(omega * t) + decay / omega * sin(omega * t))
    v = -amplitude * natural ** 2 / omega * sin(omega * t)
    return dict(time_s=t, displacement_m=x, velocity_m_s=v,
                envelope_m=abs(amplitude) * natural / omega,
                period_s=2 * pi / omega if initial else None,
                energy_J=(p["stiffness_N_m"] * x ** 2 + p["mass_kg"] * v ** 2) / 2)


def incline(p, t):
    angle = p["angle_deg"] * pi / 180
    weight = p["mass_kg"] * GRAVITY
    normal, downhill = weight * cos(angle), weight * sin(angle)
    stationary = tan(angle) <= p["static_friction"] + 1e-12
    friction = downhill if stationary else 0.8 * p["static_friction"] * normal
    acceleration = (downhill - friction) / p["mass_kg"]
    arrival = sqrt(10 / acceleration) if acceleration > 0 else inf
    travel = min(t, arrival)
    if stationary:
        state = "Đứng yên"
    elif t == 0:
        state = "Sẵn sàng trượt"
    else:
        state = "Đến cuối dốc" if t >= arrival else "Đang trượt"
    return dict(state=state, time_s=travel, normal_N=normal, downhill_N=downhill,
                friction_N=friction, acceleration_m_s2=acceleration,
                velocity_m_s=acceleration * travel, position_m=min(5, acceleration * travel ** 2 / 2))


def pulley(p, _t):
    weight = p["mass_kg"] * GRAVITY
    return dict(weight_N=weight, pull_N=weight / p["strands"],
                rope_m=p["lift_m"] * p["strands"], work_J=weight * p["lift_m"])


def _observation(product, appearance, equation, detail):
    return dict(product=product, appearance=appearance, equation=equation, detail=detail)


def _pending():
    return _observation(None, None, None, "Chọn điều kiện, dự đoán hiện tượng rồi quan sát.")


def alkali(p, _t):
    if not p["observed"]:
        return _pending()
    metal = p["metal"]
    if p["mode"] == "flame":
        return _observation(metal + "⁺", "Vàng" if metal == "Na" else "Tím nhạt", None,
                            "Màu minh họa của ion trong phép thử ngọn lửa riêng.")
    return _observation(metal + "OH và H₂", "Bọt khí",
                        f"2{metal} + 2H₂O → 2{metal}OH + H₂",
                        "Hydrogen thoát ra và dung dịch có tính kiềm.")


def nitric(p, _t):
    if not p["observed"]:
        return _pending()
    if p["acid"] == "concentrated":
        return _observation("NO₂", "Nâu đỏ", "Cu + 4HNO₃ → Cu(NO₃)₂ + 2NO₂ + 2H₂O",
                            "Kịch bản đại diện cho đồng với axit đặc. Sản phẩm khí chính của mô hình là NO₂.")
    detail = ("NO ban đầu không màu. Khi gặp oxygen, một phần có thể chuyển thành NO₂: "
              "2NO + O₂ → 2NO₂." if p["air"] else
              "Kịch bản đại diện cho đồng với axit loãng. Khí NO ban đầu không màu.")
    return _observation("NO", "Có thể chuyển nâu đỏ" if p["air"] else "Không màu",
                        "3Cu + 8HNO₃ → 3Cu(NO₃)₂ + 2NO + 4H₂O", detail)


def chlorine(p, _t):
    if not p["observed"]:
        return _pending()
    if p["mode"] == "formation":
        return _observation("Cl₂", "Minh họa oxi hóa", "2Cl⁻ → Cl₂ + 2e⁻",
                            "Hai ion chloride nhường hai electron để tạo một phân tử clo.")
    if p["damp"]:
        return _observation("HOCl", "Giấy màu nhạt rõ", "Cl₂ + H₂O ⇌ HCl + HOCl",
                            "HOCl tạo trong môi trường có nước và oxi hóa chất màu trong mô hình.")
    return _observation(None, "Không thấy tẩy màu rõ", None,
                        "Đối chứng dùng giấy khô trong điều kiện khô. Kết luận giới hạn trong kịch bản này.")
