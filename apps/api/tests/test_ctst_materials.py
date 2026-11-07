"""Authored corpus integration: citations, retrieval and fail-closed review gates."""
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from lumilab_api.data_pipeline import compile_artifact, lint_corpus, load_registry
from lumilab_api.hybrid_retrieval import CompiledIndex
from lumilab_api.main import create_app
from lumilab_api.retrieval import Corpus, RetrievalQuery
from lumilab_api.scientific_checks import equation_is_balanced
from lumilab_api.settings import Settings

ROOT = Path(__file__).resolve().parents[3]
KNOWLEDGE = ROOT / "knowledge"
AUDIT = json.loads((KNOWLEDGE / "pipeline/ctst-references.json").read_text(encoding="utf-8"))
CASES = json.loads((KNOWLEDGE / "evaluation/retrieval-ctst.json").read_text(encoding="utf-8"))["cases"]


@pytest.fixture(scope="module")
def bundle():
    corpus = Corpus.model_validate_json((KNOWLEDGE / "retrieval/documents.json").read_text(encoding="utf-8"))
    registry = load_registry(KNOWLEDGE / "pipeline/sources.json")
    artifact = compile_artifact(corpus, registry, ROOT / "packages/lab-engine", include_drafts=True)
    return corpus, registry, artifact, CompiledIndex(artifact, registry)


def test_citations_have_audited_pages_without_fabricating_publication_or_review(bundle):
    corpus, registry, _, _ = bundle
    documents = {d.id: d for d in corpus.documents}
    books = {b["id"]: b for b in AUDIT["books"]}
    authored = {d.id for d in corpus.documents if d.id.startswith("ctst-")}
    assert authored == {m["document_id"] for m in AUDIT["mappings"]}
    for mapping in AUDIT["mappings"]:
        doc, book = documents[mapping["document_id"]], books[mapping["book_id"]]
        assert mapping["reader_page"] in book["viewer_pages"]
        assert book["publication_year"] is None  # copyright/registration year is not print year
        assert book["rights_status"] == "pending" and book["allowed_uses"] == []
        assert doc.origin == "project-authored" and doc.external_material_use == "reference-only"
        assert doc.provenance.source_id == "lumilab-authored"
        assert doc.provenance.curriculum_status == mapping["curriculum_status"] == "pending"
        assert doc.review_status == "draft" and doc.reviewer is doc.reviewed_at is None
        assert mapping["teacher_reviewer"] is None
        assert str(doc.references[0].url) == book["url"] + f'#page={mapping["reader_page"]}'
        assert mapping["printed_pages"] in doc.references[0].label
        assert len({r.authority for r in doc.references}) >= 2
    assert not registry.source("lumilab-authored").permits("send_llm", draft=True)
    assert all(not registry.source(name).permits("index", draft=True)
               for name in ("osbooks-physics", "osbooks-chemistry-bundle"))


@pytest.mark.parametrize("case", CASES, ids=[c["id"] for c in CASES])
def test_authored_cards_retrievable_in_their_lab_and_level_only(bundle, case):
    _, _, _, index = bundle
    query = RetrievalQuery(lab_id=case["lab_id"], level=case["level"],
                           query=case["question"], retrieval_method="hybrid")
    hits = index.retrieve(query).hits
    found = {hit.document.id for hit in hits}
    if case["relevant_document_ids"]:
        assert set(case["relevant_document_ids"]) & found
        assert all(h.document.lab_id == query.lab_id and h.document.provenance.level == query.level for h in hits)
        assert all(h.document.review_status == "draft" for h in hits)
    else:
        assert not hits
    assert not index.retrieve(query.model_copy(update={"include_drafts": False})).hits
    assert not index.retrieve(query.model_copy(update={"commercial": True})).hits


@pytest.mark.parametrize("question", ["Tế bào thực vật có cấu trúc gì?", "Giá vàng ngày mai tăng hay giảm?"])
def test_hash_similarity_cannot_restore_low_coverage_outside_hits(bundle, question):
    assert not bundle[3].retrieve(RetrievalQuery(lab_id="pendulum", query=question)).hits


def test_quantitative_examples_and_reaction_metadata_match_supported_models(bundle):
    corpus, _, _, _ = bundle
    cards = {d.id: d for d in corpus.documents}
    config = json.loads((ROOT / "packages/lab-engine/labs/gas-reaction/lab.json").read_text(encoding="utf-8"))
    gas = cards["ctst-carbonate-gas"]
    assert "bicarbonateMass_g" in config["parameter_schema"]["properties"]
    assert gas.provenance.equation == {
        "reactants": {"NaHCO3": 1, "HCl": 1}, "products": {"NaCl": 1, "CO2": 1, "H2O": 1}}
    assert "CaCO3" not in gas.text
    for doc in cards.values():
        equation = doc.provenance.equation if doc.provenance else None
        if equation:
            assert equation_is_balanced(equation["reactants"], equation["products"])
    assert "10,00 mL NaOH" in cards["ctst-titration-direction"].assumptions[1]
    assert "25 mL acid" in cards["ctst-titration-direction"].assumptions[1]


def test_strict_build_does_not_publish_draft_cards(bundle):
    corpus, registry, _, _ = bundle
    assert lint_corpus(corpus, registry, ROOT / "packages/lab-engine", strict=True)
    assert compile_artifact(corpus, registry, ROOT / "packages/lab-engine")["chunks"] == []


def test_http_hybrid_preserves_citations_and_draft_label(bundle, tmp_path):
    _, _, artifact, _ = bundle
    path = tmp_path / "index.json"
    path.write_text(json.dumps(artifact, ensure_ascii=False), encoding="utf-8")
    settings = Settings(_env_file=None, knowledge_dir=KNOWLEDGE,
        contracts_dir=ROOT / "packages/contracts", runtime_lab_dir=ROOT / "packages/lab-engine",
        database_url=None, llm_enabled=False, rag_enabled=False, rag_artifact_path=path,
        rag_min_cosine=.12)
    with TestClient(create_app(settings)) as client:
        case = next(c for c in CASES if c["id"] == "ctst-retrieval-titration-direction")
        payload = {"lab_id": case["lab_id"], "level": case["level"],
                   "query": case["question"], "retrieval_method": "hybrid"}
        response = client.post("/api/v1/retrieval/query", json=payload)
        assert response.status_code == 200
        body = response.json()
        hit = next(h for h in body["hits"] if h["document"]["id"] == "ctst-titration-direction")
        assert hit["document"]["review_status"] == "draft"
        assert "15–18" in hit["document"]["references"][0]["label"]
        assert "#page=19" in hit["document"]["references"][0]["url"]
        assert "VERIFIED" not in response.text
        strict = client.post("/api/v1/retrieval/query", json=payload | {"include_drafts": False})
        assert strict.status_code == 200 and strict.json()["status"] == "NO_MATCH"
