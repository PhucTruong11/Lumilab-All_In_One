"""Characterization tests for hybrid-retrieval abstention on the golden sets.

These tests pin the CURRENT measured behavior as a floor, established by the
RAG-01/RAG-02 audit at main 8f18b041 (2026-11-08):

- Every negative case (WRONG_LAB / MISSING_EVIDENCE / OUT_OF_SCOPE) that
  abstains today must keep abstaining.
- The aggregate out-of-scope abstention rate must not regress below the
  measured baseline (dev 0.625, held-out 0.8).
- KNOWN_FALSE_POSITIVES lists the negative cases that currently return hits
  despite having no supporting evidence (RAG-01, confirmed). If a future
  sufficiency mechanism makes one of them abstain, this test fails on
  purpose: move the case id out of KNOWN_FALSE_POSITIVES in the same change
  that fixes it, so the improvement is recorded, not silent.
"""
import json
from pathlib import Path

from lumilab_api.data_pipeline import Registry, compile_artifact
from lumilab_api.hybrid_retrieval import CompiledIndex
from lumilab_api.retrieval import Corpus, RetrievalQuery

ROOT = Path(__file__).resolve().parents[3]

# RAG-01 confirmed false positives at main 8f18b041 (hybrid, hash REF config).
KNOWN_FALSE_POSITIVES = {
    "dev-wronglab-02",   # spring-stiffness question, pendulum scope
    "dev-wronglab-03",   # pendulum question, circuit scope
    "dev-missing-03",    # buffer-solution question; no buffer card exists
    "ho-missing-01",     # damped spring in oil; no damping card exists
}

BASELINE_ABSTENTION = {"rag_golden_dev": 0.625, "rag_golden_heldout": 0.8}


def _index() -> CompiledIndex:
    corpus = Corpus.model_validate_json(
        (ROOT / "knowledge/retrieval/documents.json").read_text(encoding="utf-8"))
    registry = Registry.model_validate_json(
        (ROOT / "knowledge/pipeline/sources.json").read_text(encoding="utf-8"))
    artifact = compile_artifact(corpus, registry, ROOT / "packages/lab-engine",
                                include_drafts=True)
    return CompiledIndex(artifact, registry)


def _cases(name: str) -> list[dict]:
    data = json.loads((ROOT / f"knowledge/evaluation/{name}.json").read_text(encoding="utf-8"))
    return data["cases"]


def test_negative_cases_abstain_or_are_known_false_positives():
    index = _index()
    for name in BASELINE_ABSTENTION:
        negatives = [c for c in _cases(name) if c["label"] != "ANSWERABLE"]
        assert negatives, f"{name}: golden set lost its negative cases"
        for case in negatives:
            response = index.retrieve(RetrievalQuery(
                lab_id=case["lab_id"], query=case["question"],
                level=case.get("level", "THPT"), retrieval_method="hybrid"))
            if case["id"] in KNOWN_FALSE_POSITIVES:
                assert response.hits, (
                    f"{case['id']} now abstains: record the RAG-01 improvement by "
                    "removing it from KNOWN_FALSE_POSITIVES")
            else:
                assert not response.hits, (
                    f"{case['id']} regressed: negative case now returns "
                    f"{[h.document.id for h in response.hits]}")


def test_abstention_rate_does_not_regress_below_baseline():
    index = _index()
    for name, baseline in BASELINE_ABSTENTION.items():
        negatives = [c for c in _cases(name) if c["label"] != "ANSWERABLE"]
        abstained = 0
        for case in negatives:
            response = index.retrieve(RetrievalQuery(
                lab_id=case["lab_id"], query=case["question"],
                level=case.get("level", "THPT"), retrieval_method="hybrid"))
            abstained += not response.hits
        rate = abstained / len(negatives)
        assert rate >= baseline, f"{name}: abstention {rate:.3f} < baseline {baseline}"
