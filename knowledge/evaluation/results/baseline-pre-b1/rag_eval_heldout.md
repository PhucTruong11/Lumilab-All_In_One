# RAG evaluation — heldout set

Corpus fingerprint: `45725db93c40b71627cf6fb4cfcd9fa4eccf593d946b5cb10ba1d3ee218b7da5` · Embedding: `token-hash-v1-512` · 2026-11-07T11:00:35.328889+00:00
Answerable: 9 · Refusal-expected: 5

| Config | Hit@1 | Hit@3 | Hit@5 | Recall@1 | Recall@3 | Recall@5 | MRR | CRR |
|---|---|---|---|---|---|---|---|---|
| A | 0.6667 | 0.7778 | 0.7778 | 0.6667 | 0.7778 | 0.7778 | 0.7222 | 0.8 |
| B | 0.5556 | 0.7778 | 0.7778 | 0.5556 | 0.7778 | 0.7778 | 0.6481 | 0.8 |
| C | 0.5556 | 0.7778 | 0.7778 | 0.5556 | 0.7778 | 0.7778 | 0.6481 | 0.8 |
| D | 0.6667 | 0.7778 | 0.7778 | 0.6667 | 0.7778 | 0.7778 | 0.7037 | 0.8 |
| REF | 0.6667 | 0.7778 | 0.7778 | 0.6667 | 0.7778 | 0.7778 | 0.7037 | 0.8 |

Failures: {"false_answers": {"A": ["ho-missing-01"], "B": ["ho-missing-01"], "C": ["ho-missing-01"], "D": ["ho-missing-01"], "REF": ["ho-missing-01"]}, "wrong_lab_hits": {"A": [], "B": [], "C": [], "D": [], "REF": []}, "false_refusals": {"A": ["ho-cir-01"], "B": ["ho-cir-01"], "C": ["ho-cir-01"], "D": ["ho-cir-01"], "REF": ["ho-cir-01"]}, "missed_top1": {"A": ["ho-pen-01", "ho-chem-01"], "B": ["ho-pen-01", "ho-pen-03", "ho-chem-01"], "C": ["ho-pen-01", "ho-pen-03", "ho-chem-01"], "D": ["ho-pen-01", "ho-chem-01"], "REF": ["ho-pen-01", "ho-chem-01"]}}