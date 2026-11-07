"""RAG-03 / PHASE VII Stage 4: reproducible retrieval evaluation for Lumilab-All_In_One.

Configs (same corpus, golden set, ground truth for all):
  A   BM25-only            (production lexical gates)
  B   Vector-only          (hash embedding, production vector gates)
  C   Weighted fusion      lexical 0.3 / vector 0.7 (experimental, not production)
  D   Weighted fusion      lexical 0.5 / vector 0.5 (experimental, not production)
  REF Production hybrid    CompiledIndex.retrieve() — RRF rank fusion, top-3 cap

Production has NO linear lexical/vector weights (verified in
hybrid_retrieval.py): C/D are min-max normalised score fusions evaluated
offline so the requested weightings can be compared honestly.

Metrics on ANSWERABLE cases: Hit@k, Recall@k (k=1,3,5), MRR.
On refusal-expected cases (WRONG_LAB / OUT_OF_SCOPE / MISSING_EVIDENCE):
Correct Refusal Rate (empty result = correct refusal) plus failure lists.

Run from repo root:
  python scripts/rag_evaluation.py
Outputs: knowledge/evaluation/results/rag_eval_<set>.{json,csv,md}
"""
import csv
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps/api/src"))

from lumilab_api.data_pipeline import Registry, compile_artifact
from lumilab_api.hybrid_retrieval import CompiledIndex
from lumilab_api.retrieval import Corpus, RetrievalQuery
from lumilab_api.vector_index import normalized

TOPN = 5


def build_index():
    corpus = Corpus.model_validate_json(
        (ROOT / "knowledge/retrieval/documents.json").read_text(encoding="utf-8"))
    registry = Registry.model_validate_json(
        (ROOT / "knowledge/pipeline/sources.json").read_text(encoding="utf-8"))
    artifact = compile_artifact(corpus, registry, ROOT / "packages/lab-engine",
                                include_drafts=True)
    index = CompiledIndex(artifact, registry, min_cosine=0.12, min_bm25=0.05)
    return index, artifact["fingerprint"]


def _norm(scores: dict) -> dict:
    if not scores:
        return {}
    lo, hi = min(scores.values()), max(scores.values())
    if hi == lo:
        return {k: 1.0 for k in scores}
    return {k: (v - lo) / (hi - lo) for k, v in scores.items()}


def rank_configs(index: CompiledIndex, case: dict):
    query = RetrievalQuery(lab_id=case["lab_id"], query=case["question"],
                           level=case.get("level", "THPT"),
                           retrieval_method="hybrid")
    eligible = index.eligible(query)
    keys = set(eligible)
    lexical = [(s, k) for s, k in index.bm25.rank(case["question"], keys)
               if s >= index.min_bm25
               and index.bm25.coverage(case["question"], k) >= .4]
    vector = index.provider.encode([case["question"]])[0]
    semantic = [(s, k) for s, k in index.store.rank(normalized(vector), keys, len(keys))
                if s >= index.min_cosine
                and index.bm25.coverage(case["question"], k) >= .4]
    bm = {k: s for s, k in lexical}
    vm = {k: s for s, k in semantic}
    a = [k for _, k in sorted(lexical, key=lambda r: (-r[0], r[1]))[:TOPN]]
    b = [k for _, k in sorted(semantic, key=lambda r: (-r[0], r[1]))[:TOPN]]

    def weighted(w_lex, w_vec):
        bn, vn = _norm(bm), _norm(vm)
        fused = {k: w_lex * bn.get(k, 0.0) + w_vec * vn.get(k, 0.0)
                 for k in set(bn) | set(vn)}
        return [k for k, _ in sorted(fused.items(), key=lambda r: (-r[1], r[0]))[:TOPN]]

    ref = [hit.chunk_id for hit in index.retrieve(query).hits]
    return {"A": a, "B": b, "C": weighted(0.3, 0.7), "D": weighted(0.5, 0.5),
            "REF": ref}


def metrics(ranked: list, relevant: set) -> dict:
    out = {}
    for k in (1, 3, 5):
        top = ranked[:k]
        out[f"hit@{k}"] = 1.0 if relevant & set(top) else 0.0
        out[f"recall@{k}"] = len(relevant & set(top)) / len(relevant) if relevant else 0.0
    rr = 0.0
    for i, key in enumerate(ranked, 1):
        if key in relevant:
            rr = 1.0 / i
            break
    out["mrr"] = rr
    return out


def evaluate(index, cases):
    configs = ["A", "B", "C", "D", "REF"]
    answerable = [c for c in cases if c["label"] == "ANSWERABLE"]
    refusal = [c for c in cases if c["label"] != "ANSWERABLE"]
    agg = {cfg: {"hit@1": 0, "hit@3": 0, "hit@5": 0, "recall@1": 0,
                 "recall@3": 0, "recall@5": 0, "mrr": 0} for cfg in configs}
    crr = {cfg: 0 for cfg in configs}
    rows = []
    for case in cases:
        ranked = rank_configs(index, case)
        relevant = set(case["relevant_chunk_ids"])
        row = {"id": case["id"], "label": case["label"], "lab_id": case["lab_id"],
               "question": case["question"], "relevant": sorted(relevant)}
        for cfg in configs:
            row[cfg] = ranked[cfg]
            if case["label"] == "ANSWERABLE":
                m = metrics(ranked[cfg], relevant)
                for key in agg[cfg]:
                    agg[cfg][key] += m[key]
            else:
                if not ranked[cfg]:
                    crr[cfg] += 1
        rows.append(row)
    n = max(len(answerable), 1)
    summary = {cfg: {k: round(v / n, 4) for k, v in agg[cfg].items()}
               for cfg in configs}
    for cfg in configs:
        summary[cfg]["crr"] = round(crr[cfg] / max(len(refusal), 1), 4)
    failures = {
        "false_answers": {cfg: [r["id"] for r in rows
                                if r["label"] != "ANSWERABLE" and r[cfg]]
                          for cfg in configs},
        "wrong_lab_hits": {cfg: [r["id"] for r in rows
                                 if r["label"] == "WRONG_LAB" and r[cfg]]
                           for cfg in configs},
        "false_refusals": {cfg: [r["id"] for r in rows
                                 if r["label"] == "ANSWERABLE" and not r[cfg]]
                           for cfg in configs},
        "missed_top1": {cfg: [r["id"] for r in rows
                              if r["label"] == "ANSWERABLE" and r[cfg]
                              and r[cfg][0] not in r["relevant"]]
                        for cfg in configs},
    }
    return summary, rows, failures, len(answerable), len(refusal)


def main():
    index, fingerprint = build_index()
    outdir = ROOT / "knowledge/evaluation/results"
    outdir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(UTC).isoformat()
    for name in ("dev", "heldout"):
        data = json.loads((ROOT / f"knowledge/evaluation/rag_golden_{name}.json")
                          .read_text(encoding="utf-8"))
        summary, rows, failures, n_ans, n_ref = evaluate(index, data["cases"])
        payload = {"set": name, "generated_at": stamp,
                   "corpus_fingerprint": fingerprint,
                   "embedding_id": index.provider.id,
                   "config": {"min_cosine": index.min_cosine,
                              "min_bm25": index.min_bm25,
                              "note": "C/D weighted score fusion (experimental); "
                                      "REF = production RRF via CompiledIndex.retrieve (top-3)"},
                   "answerable_cases": n_ans, "refusal_cases": n_ref,
                   "summary": summary, "failures": failures, "rows": rows}
        (outdir / f"rag_eval_{name}.json").write_text(
            json.dumps(payload, ensure_ascii=False, indent=1), encoding="utf-8")
        with open(outdir / f"rag_eval_{name}.csv", "w", newline="",
                  encoding="utf-8") as fh:
            w = csv.writer(fh)
            w.writerow(["id", "label", "lab_id", "relevant", "A", "B", "C", "D", "REF"])
            for r in rows:
                w.writerow([r["id"], r["label"], r["lab_id"], "|".join(r["relevant"]),
                            "|".join(r["A"]), "|".join(r["B"]), "|".join(r["C"]),
                            "|".join(r["D"]), "|".join(r["REF"])])
        lines = [f"# RAG evaluation — {name} set", "",
                 f"Corpus fingerprint: `{fingerprint}` · Embedding: `{index.provider.id}` · {stamp}",
                 f"Answerable: {n_ans} · Refusal-expected: {n_ref}", "",
                 "| Config | Hit@1 | Hit@3 | Hit@5 | Recall@1 | Recall@3 | Recall@5 | MRR | CRR |",
                 "|---|---|---|---|---|---|---|---|---|"]
        for cfg in ("A", "B", "C", "D", "REF"):
            s = summary[cfg]
            lines.append(f"| {cfg} | {s['hit@1']} | {s['hit@3']} | {s['hit@5']} | "
                         f"{s['recall@1']} | {s['recall@3']} | {s['recall@5']} | "
                         f"{s['mrr']} | {s['crr']} |")
        lines += ["", "Failures: " + json.dumps(failures, ensure_ascii=False)]
        (outdir / f"rag_eval_{name}.md").write_text("\n".join(lines), encoding="utf-8")
        print(f"== {name}: ans={n_ans} ref={n_ref}")
        for cfg in ("A", "B", "C", "D", "REF"):
            s = summary[cfg]
            print(f"  {cfg}: Hit@1={s['hit@1']} Hit@3={s['hit@3']} R@3={s['recall@3']} "
                  f"MRR={s['mrr']} CRR={s['crr']}")
        print("  failures:", json.dumps(failures, ensure_ascii=False))


if __name__ == "__main__":
    main()
