"""PHASE VII Stage 5: reproducible cache benchmark with a fixed-latency mock.

Mock provider only — no real provider, no cost. Reports cold vs warm latency,
hit rate and provider calls saved for the production Gateway cache
(in-memory LRU 128, TTL 600s, 1 worker).

Run from repo root:  python scripts/cache_benchmark.py
"""
import json
import statistics
import sys
import time
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps/api/src"))
sys.path.insert(0, str(ROOT / "apps/api/tests"))

from test_cache_correctness import FakeBudget, _context, _gateway

MOCK_LATENCY_MS = 120
QUESTIONS = 40


def pct(values, q):
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, int(q * len(ordered)))]


def main():
    ctx, reg = _context()
    state = {"calls": 0}
    chunk_id = ctx.sources[0].chunk_id

    class SlowProvider:
        def __init__(self, *args, **kwargs):
            pass

        def generate(self, messages, schema):
            state["calls"] += 1
            time.sleep(MOCK_LATENCY_MS / 1000)
            from lumilab_api.llm_providers import Completion
            return Completion({"message": "Em hãy giữ chiều dài rồi thay khối lượng.",
                               "citation_ids": [chunk_id]})

    gw = _gateway(ctx, reg, FakeBudget(), SlowProvider)
    session = uuid4()
    variants = []
    for i in range(QUESTIONS):
        variant = ctx.model_copy(deep=True)
        variant.task.question = f"Khối lượng làm đổi chu kỳ không? (câu {i})"
        variants.append(variant)

    cold, warm = [], []
    for variant in variants:  # cold pass: every question is a cache miss
        start = time.perf_counter()
        answer = gw.generate(variant, session_id=session)
        cold.append((time.perf_counter() - start) * 1000)
        assert answer.response_source == "llm", answer.response_source
    calls_after_cold = state["calls"]
    hits = 0
    for variant in variants:  # warm pass: every question should hit the cache
        start = time.perf_counter()
        answer = gw.generate(variant, session_id=session)
        warm.append((time.perf_counter() - start) * 1000)
        hits += answer.response_source == "cache"
    report = {
        "generated_at": datetime.now(UTC).isoformat(),
        "provider": f"mock fixed latency {MOCK_LATENCY_MS}ms (NOT a real provider)",
        "questions": QUESTIONS, "cache": {"type": "in-memory LRU", "capacity": 128,
                                          "ttl_seconds": 600},
        "cold_ms": {"p50": round(statistics.median(cold), 2),
                    "p95": round(pct(cold, .95), 2)},
        "warm_ms": {"p50": round(statistics.median(warm), 2),
                    "p95": round(pct(warm, .95), 2)},
        "cache_hit_rate_warm_pass": hits / QUESTIONS,
        "provider_calls_cold_pass": calls_after_cold,
        "provider_calls_saved_warm_pass": hits,
        "speedup_p50": round(statistics.median(cold) / max(statistics.median(warm), 1e-9), 1),
    }
    out = ROOT / "knowledge/evaluation/results/cache_benchmark.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
