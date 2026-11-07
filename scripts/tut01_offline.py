"""Exercise the authored Tutor cases offline against the real retrieval and gateway."""

import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path
from uuid import UUID

from lumilab_api.data_pipeline import compile_artifact, load_registry
from lumilab_api.hybrid_retrieval import CompiledIndex
from lumilab_api.llm_gateway import Gateway
from lumilab_api.retrieval import Corpus, RetrievalQuery
from lumilab_api.settings import Settings
from lumilab_api.tutor_context import TutorTask, build_tutor_context
from lumilab_api.tutor_routes import TutorRequest
from lumilab_api.vector_index import HashEmbedding


class OfflineOnly:
    @staticmethod
    def unavailable(*args, **kwargs):
        raise RuntimeError("Offline evaluation cannot read runs or contact providers")

    reserve = read_owned_run = unavailable


def evaluate_case(case, mode, index, gateway):
    request = TutorRequest.model_validate(case["input"])
    include_drafts = request.include_drafts and mode == "authored"
    retrieval = index.retrieve(RetrievalQuery(
        lab_id=request.lab_id,
        query=request.question,
        level=request.level,
        include_drafts=include_drafts,
        retrieval_method="hybrid",
    ))
    session_id = UUID(int=1)
    task = TutorTask.model_validate(request.model_dump(exclude={"history", "include_drafts", "level"}))
    context = build_tutor_context(task, retrieval, session_id=session_id, repository=OfflineOnly())
    answer = gateway.generate(context, session_id=session_id, history=request.history)
    sources = {hit.chunk_id: hit.document for hit in context.sources}
    expected = case["execution"]["expected_offline"]
    checks = {
        "pilot_scope": (request.lab_id in gateway.pilot_runtime_ids) == case["execution"]["pilot_scope"],
        "fallback_reason": answer.degraded_reason in expected,
        "offline_template": answer.response_source == "template" and answer.attempts == answer.guard_attempts == 0,
        "citation_ids": set(answer.output.citation_ids) <= sources.keys(),
        "source_scope": all(
            doc.lab_id == request.lab_id
            and doc.provenance is not None
            and doc.provenance.level == request.level
            and (include_drafts or doc.review_status == "reviewed")
            for doc in sources.values()
        ),
    }
    return {
        "id": case["id"],
        "runtime_id": request.lab_id,
        "pilot_scope": request.lab_id in gateway.pilot_runtime_ids,
        "expected_offline": expected,
        "retrieval_status": retrieval.status,
        "sources": {chunk_id: doc.review_status for chunk_id, doc in sources.items()},
        "response_status": answer.status,
        "degraded_reason": answer.degraded_reason,
        "citation_ids": answer.output.citation_ids,
        "failed_checks": [name for name, passed in checks.items() if not passed],
    }


def run(baseline_sha):
    settings = Settings(
        _env_file=None, llm_enabled=False, llm_event_cap=0, prompt_guard_enabled=False,
        knowledge_dir=Path("knowledge"), contracts_dir=Path("packages/contracts"),
        runtime_lab_dir=Path("packages/lab-engine"), rag_min_cosine=.82, rag_min_bm25=.05,
    )
    dataset_path = settings.knowledge_dir / "learning/nine-labs/learning-dataset.json"
    corpus_path = settings.knowledge_dir / "retrieval/documents.json"
    registry_path = settings.knowledge_dir / "pipeline/sources.json"
    dataset = json.loads(dataset_path.read_text(encoding="utf-8"))
    corpus = Corpus.model_validate_json(corpus_path.read_text(encoding="utf-8"))
    registry = load_registry(registry_path)
    cases = [case for lab in dataset["labs"] for case in lab["tutor_cases"]]
    if not cases or len({case["id"] for case in cases}) != len(cases):
        raise ValueError("Tutor cases must have unique IDs and cannot be empty")
    offline = OfflineOnly()
    gateway = Gateway(
        settings, registry, [], offline, provider_factory=offline.unavailable, guard_factory=offline.unavailable,
    )
    provider = HashEmbedding()
    modes = {}
    for mode in ("authored", "reviewed_only"):
        artifact = compile_artifact(
            corpus, registry, settings.runtime_lab_dir, include_drafts=mode == "authored", provider=provider,
        )
        index = CompiledIndex(
            artifact, registry, provider=provider, min_cosine=settings.rag_min_cosine, min_bm25=settings.rag_min_bm25,
        )
        rows = [evaluate_case(case, mode, index, gateway) for case in cases]
        modes[mode] = {
            "fingerprint": artifact["fingerprint"],
            "chunks": len(artifact["chunks"]),
            "passed": sum(not row["failed_checks"] for row in rows),
            "pilot_reasons": dict(Counter(row["degraded_reason"] for row in rows if row["pilot_scope"])),
            "other_reasons": dict(Counter(row["degraded_reason"] for row in rows if not row["pilot_scope"])),
            "cases": rows,
        }
    return {
        "baseline_sha": baseline_sha,
        "dataset_revision": dataset["revision"],
        "corpus_revision": corpus.revision,
        "registry_revision": registry.revision,
        "input_hashes": {
            path.as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in (dataset_path, corpus_path, registry_path)
        },
        "embedding": provider.id,
        "case_count": len(cases),
        "pilot_case_count": sum(row["pilot_scope"] for row in modes["authored"]["cases"]),
        "live_provider_attempts": 0,
        "semantic_review": "NOT_RUN",
        "scope": "Direct Python integration with authored requests. No HTTP, session database, or owned runs.",
        "modes": modes,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline-sha", required=True, help="Git SHA of the input checkout")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    receipt = run(args.baseline_sha)
    args.output.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for name, mode in receipt["modes"].items():
        print(f"{name}: {mode['passed']}/{receipt['case_count']} checks passed, {mode['pilot_reasons']}")
    return int(any(mode["passed"] != receipt["case_count"] for mode in receipt["modes"].values()))


if __name__ == "__main__":
    raise SystemExit(main())
