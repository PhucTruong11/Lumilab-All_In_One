# RAG evaluation — heldout set

Corpus fingerprint: `312afd7b10fb9abecad328db1d2414e479f9eaf74f035237fcbedb7cd85be966` · Embedding: `token-hash-v1-512` · 2026-11-07T11:01:09.543066+00:00
Answerable: 9 · Refusal-expected: 5

| Config | Hit@1 | Hit@3 | Hit@5 | Recall@1 | Recall@3 | Recall@5 | MRR | CRR |
|---|---|---|---|---|---|---|---|---|
| A | 0.7778 | 0.8889 | 0.8889 | 0.7778 | 0.8889 | 0.8889 | 0.8333 | 0.8 |
| B | 0.5556 | 0.8889 | 0.8889 | 0.5556 | 0.8889 | 0.8889 | 0.7037 | 0.8 |
| C | 0.5556 | 0.8889 | 0.8889 | 0.5556 | 0.8889 | 0.8889 | 0.7037 | 0.8 |
| D | 0.7778 | 0.8889 | 0.8889 | 0.7778 | 0.8889 | 0.8889 | 0.8148 | 0.8 |
| REF | 0.7778 | 0.8889 | 0.8889 | 0.7778 | 0.8889 | 0.8889 | 0.8148 | 0.8 |

Failures: {"false_answers": {"A": ["ho-missing-01"], "B": ["ho-missing-01"], "C": ["ho-missing-01"], "D": ["ho-missing-01"], "REF": ["ho-missing-01"]}, "wrong_lab_hits": {"A": [], "B": [], "C": [], "D": [], "REF": []}, "false_refusals": {"A": [], "B": [], "C": [], "D": [], "REF": []}, "missed_top1": {"A": ["ho-pen-01", "ho-chem-01"], "B": ["ho-pen-01", "ho-pen-03", "ho-cir-01", "ho-chem-01"], "C": ["ho-pen-01", "ho-pen-03", "ho-cir-01", "ho-chem-01"], "D": ["ho-pen-01", "ho-chem-01"], "REF": ["ho-pen-01", "ho-chem-01"]}}