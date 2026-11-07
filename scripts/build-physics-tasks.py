"""Copy the nine draft physics activities into the small web task catalog."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "knowledge/learning/nine-labs/learning-dataset.json"
TARGET = ROOT / "apps/web/src/data/physics-tasks.json"
FIELDS = ("id", "title", "runtime_id", "initial_state", "actions", "expected_result", "feedback_on_failure")


def main():
    data = json.loads(SOURCE.read_text(encoding="utf-8"))
    tasks = [
        {key: activity[key] for key in FIELDS}
        | {"cases": [{"parameters": case["parameters"], "elapsed_s": case.get("elapsed_s", 0)}
                     for case in activity["cases"]]}
        for lab in data["labs"] if lab["practice_id"].startswith("VL-")
        for activity in lab["activities"]
    ]
    if len(tasks) != 9 or len({task["id"] for task in tasks}) != len(tasks):
        raise ValueError("Expected nine distinct physics activities; review the task catalog mapping")
    TARGET.write_text(json.dumps({"source_revision": data["revision"], "tasks": tasks},
                                 ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
