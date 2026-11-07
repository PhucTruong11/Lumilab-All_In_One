from datetime import UTC, datetime
from uuid import uuid4

import pytest
from pydantic import ValidationError

from lumilab_api.recompute import RecomputeInput
from lumilab_api.retrieval import Document, Hit, RetrievalResponse
from lumilab_api.session_routes import StoredRun
from lumilab_api.tutor_context import (
    PREVIEW_NOTICE,
    TutorContextError,
    TutorOutput,
    TutorTask,
    build_tutor_context,
    generate_tutor_reply,
)
from lumilab_api.verifier import VerificationResult


@pytest.fixture
def inputs():
    session_id, run_id = uuid4(), uuid4()
    run = StoredRun(
        run_id=run_id, lab_id="circuit", saved_at=datetime.now(UTC),
        input=RecomputeInput(model_version="v1", dataset_version="draft-v1", parameters={}),
        result=VerificationResult(
            status="INSUFFICIENT_DATA", code="REVIEWED_EVIDENCE_REQUIRED", layer="evidence",
            model_version="v1", dataset_version="draft-v1", request_id="fixture",
            preview={"current_A": 0.5},
        ),
    )
    document = Document(
        id="circuit-note", lab_id="circuit", title="Điện trở", text="Ghi chú tự biên soạn.",
        keywords=["điện trở"], review_status="draft", reviewer=None, reviewed_at=None,
        origin="project-authored", external_material_use="reference-only",
        references=[{"label": "Fixture", "url": "https://example.org/source"}],
        assumptions=["Test fixture"],
    )
    retrieved = RetrievalResponse(
        corpus_revision="v1", status="FOUND",
        hits=[Hit(chunk_id="circuit-note:0", document=document)],
    )

    class Repository:
        calls = []

        def read_owned_run(self, owner, requested_run):
            self.calls.append((owner, requested_run))
            return run if (owner, requested_run) == (session_id, run_id) else None

    task = TutorTask(lab_id="circuit", question="Điện trở ảnh hưởng thế nào?", run_id=run_id)
    return task, retrieved, Repository(), session_id, run


class FakeProvider:
    live = False

    def __init__(self, output):
        self.output = output
        self.calls = 0

    def generate(self, context):
        self.calls += 1
        return self.output


def test_context_reads_only_owned_run_and_preserves_draft(inputs):
    task, retrieved, repository, session_id, stored = inputs
    context = build_tutor_context(task, retrieved, session_id=session_id, repository=repository)
    assert repository.calls == [(session_id, stored.run_id)]
    assert context.run.review_status == "draft"
    assert context.run.status == "INSUFFICIENT_DATA"
    assert context.run.notice == PREVIEW_NOTICE
    assert context.sources[0].document.review_status == "draft"
    assert "untrusted" in context.source_policy
    context.run.preview["current_A"] = 999
    assert stored.result.preview["current_A"] == 0.5
    with pytest.raises(TutorContextError, match="Owned run"):
        build_tutor_context(task, retrieved, session_id=uuid4(), repository=repository)


def test_client_request_cannot_inject_facts_preview_or_review_status():
    for field, value in [("facts", {}), ("preview", {}), ("review_status", "reviewed")]:
        with pytest.raises(ValidationError):
            TutorTask.model_validate({"lab_id": "circuit", "question": "?", field: value})


def test_context_rejects_wrong_lab_or_non_draft_run(inputs):
    task, retrieved, repository, session_id, stored = inputs
    retrieved.hits[0].document.lab_id = "pendulum"
    with pytest.raises(TutorContextError, match="Source lab"):
        build_tutor_context(task, retrieved, session_id=session_id, repository=repository)
    retrieved.hits[0].document.lab_id = "circuit"
    stored.result.status = "VERIFIED"
    with pytest.raises(TutorContextError, match="draft preview"):
        build_tutor_context(task, retrieved, session_id=session_id, repository=repository)


def test_gateway_keeps_preview_outside_provider_output(inputs):
    task, retrieved, repository, session_id, _ = inputs
    context = build_tutor_context(task, retrieved, session_id=session_id, repository=repository)
    provider = FakeProvider(TutorOutput(
        message="Em hãy thay đổi riêng điện trở và quan sát dòng điện.",
        citation_ids=["circuit-note:0"], follow_up="Em đã giữ nguyên những yếu tố nào?",
    ))
    reply = generate_tutor_reply(context, provider)
    assert reply.status == "DRAFT_GUIDANCE"
    assert reply.run.preview == {"current_A": 0.5}
    assert reply.notice == PREVIEW_NOTICE
    assert provider.calls == 1
    assert reply.sources[0].document.review_status == "draft"


@pytest.mark.parametrize("message,citations", [
    ("Kết quả là 5 A.", ["circuit-note:0"]),
    ("VERIFIED", ["circuit-note:0"]),
    ("Dữ liệu đã xác minh.", ["circuit-note:0"]),
    ("Thử lại nhé.", ["invented:0"]),
    ("Thử lại nhé.", []),
])
def test_gateway_rejects_numeric_override_and_bad_citation(inputs, message, citations):
    task, retrieved, repository, session_id, _ = inputs
    context = build_tutor_context(task, retrieved, session_id=session_id, repository=repository)
    reply = generate_tutor_reply(context, FakeProvider(TutorOutput(
        message=message, citation_ids=citations,
    )))
    assert reply.status == "FALLBACK"
    assert reply.run.preview == {"current_A": 0.5}


def test_missing_source_and_live_provider_do_not_generate(inputs):
    task, retrieved, repository, session_id, _ = inputs
    provider = FakeProvider(TutorOutput(message="x", citation_ids=[]))
    provider.live = True
    context = build_tutor_context(task, retrieved, session_id=session_id, repository=repository)
    assert generate_tutor_reply(context, provider).status == "FALLBACK"
    assert provider.calls == 0
    retrieved.hits = []
    retrieved.status = "NO_MATCH"
    context = build_tutor_context(task, retrieved, session_id=session_id, repository=repository)
    assert generate_tutor_reply(context, provider).status == "NEEDS_SOURCE"
    assert provider.calls == 0


def test_provider_cannot_mutate_server_evidence_or_add_output_fields(inputs):
    task, retrieved, repository, session_id, _ = inputs
    context = build_tutor_context(task, retrieved, session_id=session_id, repository=repository)

    class MutatingProvider:
        live = False

        def generate(self, received):
            received.run.preview["current_A"] = 999
            return TutorOutput.model_construct(
                message="Em hãy thử lại.", citation_ids=["circuit-note:0"], follow_up=None,
            )

    assert generate_tutor_reply(context, MutatingProvider()).run.preview["current_A"] == 0.5
    assert context.run.preview["current_A"] == 0.5
    with pytest.raises(ValidationError):
        TutorOutput.model_validate({
            "message": "x", "citation_ids": [], "facts": {"current_A": 999},
        })
