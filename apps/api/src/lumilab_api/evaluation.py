"""Offline, versioned evaluation. Never calls an LLM or downloads a benchmark."""
import argparse
import hashlib
import json
import math
import statistics
import subprocess
from pathlib import Path
from time import perf_counter

from .data_pipeline import compile_artifact, load_registry
from .hybrid_retrieval import CompiledIndex
from .retrieval import Corpus, RetrievalQuery
from .retrieval_terms import PROFILE
from .vector_index import VectorConfig, tokens


def evaluate_retrieval(index: CompiledIndex, cases: list[dict]) -> dict:
    results = []
    for case in cases:
        query = RetrievalQuery(lab_id=case["lab_id"], query=case["question"],
            level=case.get("level", "THPT"), retrieval_method="hybrid")
        eligible = index.eligible(query)
        for method in ("no_rag", "bm25", "vector", "hybrid", "hybrid_tools"):
            start = perf_counter()
            if method == "no_rag":
                ids = []
            elif method == "bm25":
                ranked = index.bm25.rank(query.query, set(eligible))
                ids = [key for score, key in ranked if score >= index.min_bm25
                    and index.bm25.coverage(query.query, key) >= .4][:3]
            elif method == "vector":
                vector = getattr(index.provider, "encode_query", index.provider.encode)([query.query])[0]
                ranked = index.store.rank(vector, set(eligible), len(eligible))
                ids = [key for score, key in ranked if score >= index.min_cosine and
                    (index.provider.semantic or tokens(query.query) & tokens(eligible[key].text))][:3]
            else:
                ids = [hit.chunk_id for hit in index.retrieve(query).hits]
            latency = (perf_counter() - start) * 1000
            relevant = set(case["relevant_document_ids"])
            # All current development cards have one paragraph; document IDs also
            # support multiple chunks later without treating every chunk as a new source.
            found_docs = {index.docs[key].id for key in ids}
            true_positive = len(found_docs & relevant)
            results.append({"case_id": case["id"], "method": method, "retrieved": ids,
                "relevant": sorted(relevant), "hit": bool(true_positive),
                "precision_at_3": true_positive / 3, "recall_at_3": true_positive / len(relevant) if relevant else None,
                "abstained_correctly": not ids if not relevant else None, "latency_ms": round(latency, 3),
                "language": case.get("language", "vi")})
    metrics = {}
    for method in {row["method"] for row in results}:
        selected = [row for row in results if row["method"] == method]
        positives = [row for row in selected if row["relevant"]]
        negatives = [row for row in selected if not row["relevant"]]
        metrics[method] = {"queries":len(selected),
            "hit_rate": statistics.mean(row["hit"] for row in positives) if positives else None,
            "recall_at_3": statistics.mean(row["recall_at_3"] for row in positives) if positives else None,
            "precision_at_3": statistics.mean(row["precision_at_3"] for row in positives) if positives else None,
            "out_of_scope_abstention": statistics.mean(row["abstained_correctly"] for row in negatives) if negatives else None,
            "latency_p50_ms": statistics.median(row["latency_ms"] for row in selected)}
    return {"metrics":metrics,"results":results,
        "limitations":["Development set, not held-out validation; teacher review pending",
          "Single relevant authored card per lab makes ranking easy; not a large-corpus test",
          "hybrid_tools uses the same retrieval, no LLM or tool accuracy is measured",
          "Precision denominator fixed at k=3; duplicate chunks counted once per relevant document"]}


VMLU_SUBJECTS = {"high_school_physics", "high_school_chemistry", "middle_school_physics", "middle_school_chemistry"}


def normalize_vmlu(item: dict) -> dict:
    subject = item.get("subject", "").lower().replace(" ", "_")
    # Legacy official IDs: 04 Chemistry THCS, 06 Physics THCS, 08 Chemistry THPT, 10 Physics THPT.
    inferred = {"04":"middle_school_chemistry","06":"middle_school_physics",
        "08":"high_school_chemistry","10":"high_school_physics"}.get(str(item.get("id", ""))[:2], subject)
    if subject in VMLU_SUBJECTS and inferred != subject:
        raise ValueError("SUBJECT_ID_MISMATCH")
    subject = inferred
    if subject not in VMLU_SUBJECTS:
        return None
    choices = item.get("options", item.get("choices"))
    answer = item.get("answer")
    if (not isinstance(item.get("question"), str) or not item["question"].strip()
            or not isinstance(choices, list) or not 4 <= len(choices) <= 5
            or any(not isinstance(c, str) or not c.strip() for c in choices)
            or answer not in [None, *"ABCDE"[:len(choices)]]):
        raise ValueError("VMLU_CANONICAL_FORMAT_REQUIRED")
    return {"id":str(item["id"]),"subject":subject,"question":item["question"],
        "options":choices,"answer":answer,"level":"THCS" if subject.startswith("middle") else "THPT"}


def import_vmlu(path: Path, manifest: Path, output: Path):
    permission = json.loads(manifest.read_text(encoding="utf-8"))
    raw = path.read_bytes()
    if not (permission.get("rights_status") == "approved" and permission.get("reviewer")
            and permission.get("reviewed_at") and "evaluate" in permission.get("allowed_uses", [])
            and permission.get("sha256") == hashlib.sha256(raw).hexdigest()):
        raise ValueError("BENCHMARK_RIGHTS_OR_HASH_REQUIRED")
    rows = []
    for line in raw.decode("utf-8").splitlines():
        if not line.strip():
            continue
        item = normalize_vmlu(json.loads(line))
        if item is not None:
            rows.append(item)
    if len({row["id"] for row in rows}) != len(rows) or not rows:
        raise ValueError("EMPTY_OR_DUPLICATE_BENCHMARK")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"benchmark_sha256": permission["sha256"], "split":"evaluation_only", "cases":rows}, ensure_ascii=False, indent=2), encoding="utf-8")


def grade_predictions(cases: list[dict], predictions: list[dict]) -> dict:
    # Provider outputs are supplied from separately authorized runs, not generated here.
    expected = {row["id"]: row for row in cases}
    rows = []
    seen = set()
    for item in predictions:
        key = (item["id"], item["configuration"])
        if key in seen or item["configuration"] not in {"no_rag", "rag", "rag_tools"} or item["id"] not in expected:
            raise ValueError("Invalid or duplicate prediction")
        for field in ("input_tokens", "output_tokens", "cost_usd", "latency_ms"):
            if field in item and (isinstance(item[field], bool) or not isinstance(item[field], (int, float))
                    or not math.isfinite(item[field]) or item[field] < 0):
                raise ValueError("Invalid measured telemetry")
        seen.add(key)
        row = expected[item["id"]]
        rows.append({**item,"correct": item.get("answer") == row.get("answer") if row.get("answer") else None})
    return {"results":rows,"missing_predictions":len(expected)*3-len(rows),
        "llm_accuracy_measured":any(row["correct"] is not None for row in rows),
        "metrics": {mode: {
            "predictions": len([row for row in rows if row["configuration"] == mode]),
            "accuracy": statistics.mean(row["correct"] for row in rows
                if row["configuration"] == mode and row["correct"] is not None)
                if any(row["configuration"] == mode and row["correct"] is not None for row in rows) else None,
            **{field: sum(row[field] for row in rows if row["configuration"] == mode)
                if any(row["configuration"] == mode for row in rows) and
                    all(field in row for row in rows if row["configuration"] == mode) else None
                for field in ("input_tokens", "output_tokens", "cost_usd")},
            "latency_p50_ms": statistics.median(row["latency_ms"] for row in rows
                if row["configuration"] == mode and "latency_ms" in row)
                if any(row["configuration"] == mode and "latency_ms" in row for row in rows) else None,
        } for mode in ("no_rag", "rag", "rag_tools")},
        "note":"Open-answer factuality/citations require the teacher rubric; no fabricated scores."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["retrieval", "import-vmlu", "grade"])
    parser.add_argument("--input", type=Path)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--predictions", type=Path)
    parser.add_argument("--output", type=Path, default=Path(".local/evaluation/report.json"))
    parser.add_argument("--min-cosine", type=float, default=.82)
    parser.add_argument("--cases", type=Path, default=Path("knowledge/evaluation/retrieval-dev.json"))
    args = parser.parse_args()
    if args.command == "import-vmlu":
        if args.input is None or args.manifest is None:
            parser.error("import-vmlu requires input and manifest")
        import_vmlu(args.input, args.manifest, args.output)
        return
    if args.command == "grade":
        if args.input is None or args.predictions is None:
            parser.error("grade requires input cases and predictions")
        report = grade_predictions(json.loads(args.input.read_text(encoding="utf-8"))["cases"],
            [json.loads(line) for line in args.predictions.read_text(encoding="utf-8").splitlines()])
    else:
        corpus = Corpus.model_validate_json(Path("knowledge/retrieval/documents.json").read_text(encoding="utf-8"))
        registry = load_registry(Path("knowledge/pipeline/sources.json"))
        provider = VectorConfig.from_env().provider()
        start = perf_counter()
        artifact = compile_artifact(corpus, registry, Path("packages/lab-engine"), include_drafts=True, provider=provider)
        index = CompiledIndex(artifact, registry, provider=provider,
            min_cosine=args.min_cosine if provider.semantic else .12)
        cases = json.loads(args.cases.read_text(encoding="utf-8"))["cases"]
        report = evaluate_retrieval(index, cases)
        report.update(cases_sha256=hashlib.sha256(args.cases.read_bytes()).hexdigest(),cases_path=str(args.cases),min_cosine=index.min_cosine, min_bm25=index.min_bm25, lexical_coverage=.4, embedding_id=provider.id, index_fingerprint=artifact["fingerprint"],
            corpus_revision=corpus.revision, build_seconds=round(perf_counter()-start,3),
            model_accuracy_status="NOT_RUN", llm_calls=0)
    report["git_sha"] = subprocess.check_output(["git","rev-parse","HEAD"],text=True).strip()
    report["working_tree_dirty"] = bool(subprocess.check_output(["git","status","--porcelain"],text=True))
    report["retrieval_profile"] = PROFILE
    report["prompt_version"] = "not-applicable-retrieval-only"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report.get("metrics",{}),ensure_ascii=False))


if __name__ == "__main__":
    main()
