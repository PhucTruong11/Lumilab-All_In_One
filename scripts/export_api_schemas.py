"""Export the provider/data boundaries from Pydantic; run --check in CI."""
import argparse
import json
from pathlib import Path

from lumilab_api.data_pipeline import Registry
from lumilab_api.recompute import RecomputeInput
from lumilab_api.retrieval import Corpus, RetrievalResponse
from lumilab_api.system_info import PracticeMap, SystemInfo, WebBuildInfo
from lumilab_api.tutor_context import TutorOutput, TutorTask
from lumilab_api.tutor_routes import TutorRequest, TutorResponse
from lumilab_api.verifier import VerificationResult

ROOT = Path(__file__).resolve().parents[1]
MODELS = {"source-registry": Registry, "tutor-request": TutorRequest, "tutor-response": TutorResponse, "recompute-input": RecomputeInput, "verification-result": VerificationResult,
          "retrieval-corpus": Corpus, "retrieval-response": RetrievalResponse,
          "tutor-task": TutorTask, "tutor-output": TutorOutput,
          "practice-map": PracticeMap, "system-info": SystemInfo, "web-build-info": WebBuildInfo}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    for name, model in MODELS.items():
        path = ROOT / "packages/contracts/schemas" / (name + ".schema.json")
        value = json.dumps(model.model_json_schema(), ensure_ascii=False, indent=2) + "\n"
        if args.check:
            if not path.is_file() or path.read_text(encoding="utf-8") != value:
                raise SystemExit("Stale API schema: " + str(path.relative_to(ROOT)))
        else:
            path.write_text(value, encoding="utf-8")
    print(f"Validated {len(MODELS)} generated API/data schemas" if args.check
          else f"Exported {len(MODELS)} API/data schemas")


if __name__ == "__main__":
    main()
