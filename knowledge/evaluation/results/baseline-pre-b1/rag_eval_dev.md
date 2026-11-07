# RAG evaluation — dev set

Corpus fingerprint: `45725db93c40b71627cf6fb4cfcd9fa4eccf593d946b5cb10ba1d3ee218b7da5` · Embedding: `token-hash-v1-512` · 2026-11-07T11:00:35.328889+00:00
Answerable: 16 · Refusal-expected: 8

| Config | Hit@1 | Hit@3 | Hit@5 | Recall@1 | Recall@3 | Recall@5 | MRR | CRR |
|---|---|---|---|---|---|---|---|---|
| A | 0.8125 | 0.9375 | 0.9375 | 0.7812 | 0.9375 | 0.9375 | 0.875 | 0.625 |
| B | 0.75 | 0.9375 | 0.9375 | 0.7188 | 0.9375 | 0.9375 | 0.8438 | 0.75 |
| C | 0.8125 | 0.9375 | 0.9375 | 0.7812 | 0.9375 | 0.9375 | 0.875 | 0.625 |
| D | 0.8125 | 0.9375 | 0.9375 | 0.7812 | 0.9375 | 0.9375 | 0.875 | 0.625 |
| REF | 0.8125 | 0.9375 | 0.9375 | 0.7812 | 0.9375 | 0.9375 | 0.875 | 0.625 |

Failures: {"false_answers": {"A": ["dev-wronglab-02", "dev-wronglab-03", "dev-missing-03"], "B": ["dev-wronglab-02", "dev-missing-03"], "C": ["dev-wronglab-02", "dev-wronglab-03", "dev-missing-03"], "D": ["dev-wronglab-02", "dev-wronglab-03", "dev-missing-03"], "REF": ["dev-wronglab-02", "dev-wronglab-03", "dev-missing-03"]}, "wrong_lab_hits": {"A": ["dev-wronglab-02", "dev-wronglab-03"], "B": ["dev-wronglab-02"], "C": ["dev-wronglab-02", "dev-wronglab-03"], "D": ["dev-wronglab-02", "dev-wronglab-03"], "REF": ["dev-wronglab-02", "dev-wronglab-03"]}, "false_refusals": {"A": [], "B": [], "C": [], "D": [], "REF": []}, "missed_top1": {"A": ["dev-pen-mass-01", "dev-pen-mass-02", "dev-pen-measure-01"], "B": ["dev-pen-mass-02", "dev-pen-measure-01", "dev-pen-limits-02", "dev-cir-ohm-01"], "C": ["dev-pen-mass-02", "dev-pen-measure-01", "dev-pen-limits-02"], "D": ["dev-pen-mass-01", "dev-pen-mass-02", "dev-pen-measure-01"], "REF": ["dev-pen-mass-01", "dev-pen-mass-02", "dev-pen-measure-01"]}}