"""Copy draft chemistry activities into the web task catalog."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "knowledge/learning/nine-labs/learning-dataset.json"
TARGET = ROOT / "apps/web/src/data/chemistry-tasks.json"
FIELDS = ("id", "title", "runtime_id", "initial_state", "actions", "expected_result", "feedback_on_failure")

QUALITATIVE_TASKS = [
    {
        "id": "HH-KIEM-01-A-1",
        "title": "So sánh phản ứng kim loại kiềm với nước và màu ngọn lửa",
        "runtime_id": "alkali-water",
        "initial_state": "Đặt lại về thí nghiệm kim loại kiềm với nước.",
        "actions": "Quan sát Na phản ứng với nước, sau đó chuyển sang thử màu ngọn lửa Kali (K).",
        "expected_result": "Na nóng chảy thành viên tròn chạy trên mặt nước sinh bọt khí H₂; ngọn lửa K có màu tím đặc trưng.",
        "feedback_on_failure": "Chọn đúng kim loại (Na hoặc K) và chế độ quan sát tương ứng.",
        "cases": [
            {"parameters": {"metal": "Na", "mode": "water", "observed": True}, "elapsed_s": 0},
            {"parameters": {"metal": "K", "mode": "flame", "observed": True}, "elapsed_s": 0},
        ],
    },
    {
        "id": "HH-NITRIC-01-A-1",
        "title": "So sánh Cu tác dụng với HNO₃ đặc và loãng",
        "runtime_id": "copper-nitric",
        "initial_state": "Đặt lại về thí nghiệm Cu tác dụng với HNO₃.",
        "actions": "Quan sát Cu phản ứng với HNO₃ đặc (sinh khí NO₂ nâu đỏ), sau đó chuyển sang HNO₃ loãng (sinh khí NO không màu hóa nâu ngoài không khí).",
        "expected_result": "HNO₃ đặc phản ứng mãnh liệt sinh khí NO₂ màu nâu đỏ; HNO₃ loãng sinh khí NO không màu chuyển nâu khi gặp không khí.",
        "feedback_on_failure": "Chọn kịch bản axit đặc/loãng và mở quan sát.",
        "cases": [
            {"parameters": {"acid": "concentrated", "air": True, "observed": True}, "elapsed_s": 0},
            {"parameters": {"acid": "dilute", "air": True, "observed": True}, "elapsed_s": 0},
        ],
    },
    {
        "id": "HH-CLO-01-A-1",
        "title": "Khảo sát tính tẩy màu của khí clo trong điều kiện ẩm",
        "runtime_id": "chlorine-bleach",
        "initial_state": "Đặt lại về thí nghiệm điều chế và tính chất của clo.",
        "actions": "Quan sát khí clo tiếp xúc với giấy màu ẩm (bị mất màu do HClO), sau đó so sánh với giấy màu khô đối chứng (không mất màu).",
        "expected_result": "Khí clo ẩm làm mất màu giấy quỳ/giấy màu do tạo axit hipoclorơ (HClO) có tính oxi hóa mạnh; khí clo khô không làm mất màu.",
        "feedback_on_failure": "Đổi trạng thái giấy ẩm/khô để đối chiếu hiện tượng tẩy màu.",
        "cases": [
            {"parameters": {"mode": "bleach", "damp": True, "observed": True}, "elapsed_s": 0},
            {"parameters": {"mode": "bleach", "damp": False, "observed": True}, "elapsed_s": 0},
        ],
    },
]


def main():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    quantitative_tasks = [
        {key: activity[key] for key in FIELDS}
        | {
            "cases": [
                {
                    "parameters": case["parameters"],
                    "elapsed_s": case.get("elapsed_s", 0),
                }
                for case in activity["cases"]
            ]
        }
        for lab in data["labs"]
        if lab["practice_id"].startswith("HH-")
        for activity in lab["activities"]
    ]
    tasks = quantitative_tasks + QUALITATIVE_TASKS
    TARGET.write_text(
        json.dumps({"source_revision": data["revision"], "tasks": tasks}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(tasks)} chemistry tasks to {TARGET}")


if __name__ == "__main__":
    main()

