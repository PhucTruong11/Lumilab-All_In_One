"""RAG-B1 experiment: why is ho-cir-01 refused, and what would fix it?

Investigation ONLY — no production code is changed. The production
CompiledIndex.retrieve() logic is replicated here with two knobs:
  - coverage gate (production: 0.4)
  - extra STOP words (production: retrieval_terms.STOP as-is)
Options measured on the SAME dev + held-out sets as RAG-03:
  BASE  production behaviour (replication sanity check vs rag_eval results)
  A     STOP += {cang, giu, lon, nguyen, no, qua} (filler/comparative words)
  B     coverage gate 0.4 -> 0.30
Run from repo root:  python scripts/rag_b1_experiment.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps/api/src"))

import lumilab_api.retrieval_terms as rt
from lumilab_api.data_pipeline import Registry, compile_artifact
from lumilab_api.hybrid_retrieval import CompiledIndex
from lumilab_api.retrieval import Corpus, RetrievalQuery

EXTRA_STOP = {"cang", "giu", "lon", "nguyen", "no", "qua"}


def build_index():
    corpus = Corpus.model_validate_json(
        (ROOT / "knowledge/retrieval/documents.json").read_text(encoding="utf-8"))
    registry = Registry.model_validate_json(
        (ROOT / "knowledge/pipeline/sources.json").read_text(encoding="utf-8"))
    artifact = compile_artifact(corpus, registry, ROOT / "packages/lab-engine",
                                include_drafts=True)
    return CompiledIndex(artifact, registry, min_cosine=0.12, min_bm25=0.05)


def retrieve_param(index, case, coverage_gate):
    """Faithful copy of CompiledIndex.retrieve() with a parameterised gate."""
    from collections import Counter
    query = RetrievalQuery(lab_id=case["lab_id"], query=case["question"],
                           level=case.get("level", "THPT"),
                           retrieval_method="hybrid")
    candidates = index.eligible(query)
    lexical = index.bm25.rank(query.query, set(candidates))
    lexical_scores = {k: s for s, k in lexical}
    semantic = []
    if candidates:
        vector = index.provider.encode([query.query])[0]
        from lumilab_api.vector_index import normalized
        semantic = index.store.rank(normalized(vector), set(candidates),
                                    len(candidates))
    vector_scores = {k: s for s, k in semantic}
    fused = Counter()
    lexical = [(s, k) for s, k in lexical if s >= index.min_bm25
               and index.bm25.coverage(query.query, k) >= coverage_gate]
    semantic = [(s, k) for s, k in semantic if s >= index.min_cosine
                and index.bm25.coverage(query.query, k) >= coverage_gate]
    for ranking in (lexical, semantic):
        for rank, (_, key) in enumerate(ranking):
            if (lexical_scores.get(key, 0) >= index.min_bm25
                    or vector_scores.get(key, 0) >= index.min_cosine):
                fused[key] += 1 / (60 + rank + 1)
    return [k for k, _ in sorted(fused.items(),
                                 key=lambda r: (-r[1], r[0]))[:3]]


def summarize(index, cases, gate):
    ans = [c for c in cases if c["label"] == "ANSWERABLE"]
    ref = [c for c in cases if c["label"] != "ANSWERABLE"]
    hit1 = hit3 = rec3 = mrr = 0.0
    crr = 0
    detail = {}
    for case in cases:
        ranked = retrieve_param(index, case, gate)
        detail[case["id"]] = ranked
        rel = set(case["relevant_chunk_ids"])
        if case["label"] == "ANSWERABLE":
            hit1 += bool(rel & set(ranked[:1]))
            hit3 += bool(rel & set(ranked[:3]))
            rec3 += len(rel & set(ranked[:3])) / len(rel)
            for i, k in enumerate(ranked, 1):
                if k in rel:
                    mrr += 1 / i
                    break
        elif not ranked:
            crr += 1
    n = max(len(ans), 1)
    return {"hit@1": round(hit1 / n, 4), "hit@3": round(hit3 / n, 4),
            "recall@3": round(rec3 / n, 4), "mrr": round(mrr / n, 4),
            "crr": round(crr / max(len(ref), 1), 4)}, detail


def main():
    sets = {}
    for name in ("dev", "heldout"):
        sets[name] = json.loads((ROOT / f"knowledge/evaluation/rag_golden_{name}.json")
                                .read_text(encoding="utf-8"))["cases"]
    index = build_index()
    report = {}
    base_details = {}
    for name, cases in sets.items():
        summary, detail = summarize(index, cases, 0.4)
        report[f"BASE {name}"] = summary
        base_details[name] = detail
        ho = [c for c in cases if c["id"] == "ho-cir-01"]
        if ho:
            print("ho-cir-01 BASE ranked:", detail["ho-cir-01"])
    # Option B: lower coverage gate only.
    for name, cases in sets.items():
        summary, detail = summarize(index, cases, 0.30)
        report[f"B gate=0.30 {name}"] = summary
        changed = {cid: (base_details[name][cid], detail[cid])
                   for cid in detail if detail[cid] != base_details[name][cid]}
        report[f"B changed {name}"] = changed
    # Option A: extended STOP -> rebuild index + artifact with patched vocabulary.
    original_stop = rt.STOP
    rt.STOP = original_stop | EXTRA_STOP
    try:
        index_a = build_index()
        for name, cases in sets.items():
            summary, detail = summarize(index_a, cases, 0.4)
            report[f"A stop+ {name}"] = summary
            changed = {cid: (base_details[name][cid], detail[cid])
                       for cid in detail if detail[cid] != base_details[name][cid]}
            report[f"A changed {name}"] = changed
    finally:
        rt.STOP = original_stop
    out = ROOT / "knowledge/evaluation/results/rag_b1_experiment.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=1),
                   encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
