"""TUTOR-03 Phase A: mock-provider pilot vs template tutor (pendulum rubric).

No real provider, no cost. Compares, on the same pendulum contexts:
  template  Gateway with llm_enabled=False (production default)
  mock      Gateway with a deterministic mock provider
Acceptance cases: provider success, provider error -> template fallback,
budget exhausted -> template fallback, draft source restriction.
Run from repo root:  python scripts/tutor_pilot_mock.py
"""
import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps/api/src"))
sys.path.insert(0, str(ROOT / "apps/api/tests"))

from lumilab_api.llm_gateway import Gateway
from lumilab_api.llm_providers import Completion, ProviderFailure
from lumilab_api.settings import Settings
from test_cache_correctness import FakeBudget, _context, _gateway, _route

QUESTIONS = [
    ("Khối lượng làm đổi chu kỳ không?", "hint"),
    ("Vì sao phải giữ góc lệch nhỏ khi đo chu kỳ?", "explanation"),
    ("Em đo 10 dao động hết 20,1 giây, chu kỳ là bao nhiêu?", "qa"),
]


def mock_provider(context, fail=False):
    chunk_id = context.sources[0].chunk_id

    class Provider:
        def __init__(self, *args, **kwargs):
            pass

        def generate(self, messages, schema):
            if fail:
                raise ProviderFailure("mock transport failure", retryable=False)
            return Completion({
                "message": "Em hãy giữ chiều dài dây và nơi đo, chỉ thay khối lượng rồi so chu kỳ.",
                "citation_ids": [chunk_id]})
    return Provider


def run():
    results = {"generated_at": datetime.now(UTC).isoformat(),
               "provider": "mock (NOT a real provider)", "cases": []}
    ctx, reg = _context()

    # Template baseline (live off) vs mock success, same contexts/questions.
    for question, mode in QUESTIONS:
        variant = ctx.model_copy(deep=True)
        variant.task.question = question
        variant.task.mode = mode
        settings = Settings(_env_file=None, knowledge_dir=ROOT / "knowledge",
                            llm_enabled=False)
        template = Gateway(settings, reg, [_route()], FakeBudget(),
                           provider_factory=mock_provider(variant)
                           ).generate(variant, session_id=uuid4())
        mock = _gateway(variant, reg, FakeBudget(), mock_provider(variant)
                        ).generate(variant, session_id=uuid4())
        results["cases"].append({
            "question": question, "mode": mode,
            "template": {"source": template.response_source,
                         "reason": template.degraded_reason,
                         "citations": template.output.citation_ids},
            "mock": {"source": mock.response_source, "status": mock.status,
                     "citations": mock.output.citation_ids,
                     "citation_valid": set(mock.output.citation_ids)
                     <= {h.chunk_id for h in variant.sources}},
        })

    # Provider error -> template fallback, no fake success.
    err = _gateway(ctx, reg, FakeBudget(), mock_provider(ctx, fail=True)
                   ).generate(ctx, session_id=uuid4())
    results["provider_error"] = {"source": err.response_source,
                                 "reason": err.degraded_reason}

    # Budget exhausted -> template fallback before any provider call.
    denied = _gateway(ctx, reg, FakeBudget(deny=True), mock_provider(ctx)
                      ).generate(ctx, session_id=uuid4())
    results["budget_exhausted"] = {"source": denied.response_source,
                                    "reason": denied.degraded_reason}

    # Source restriction: real draft sources are never sent to a provider.
    draft_ctx, draft_reg = _context()
    for hit in draft_ctx.sources:
        hit.document.review_status = "draft"
    blocked = _gateway(draft_ctx, draft_reg, FakeBudget(), mock_provider(draft_ctx)
                       ).generate(draft_ctx, session_id=uuid4())
    results["source_restriction"] = {"source": blocked.response_source,
                                      "reason": blocked.degraded_reason}

    out = ROOT / "knowledge/evaluation/results/tutor_pilot_mock.json"
    out.write_text(json.dumps(results, ensure_ascii=False, indent=1),
                   encoding="utf-8")
    print(json.dumps(results, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    run()
