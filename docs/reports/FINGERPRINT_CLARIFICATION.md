# Fingerprint Clarification — Response to Independent Review Issue 2

**Question raised:** the audit uses one fingerprint value while calling it both a
profile fingerprint and a corpus fingerprint. Clarify the three identities:
profile, corpus/artifact, evaluation.

## What the system actually computes (from source)

There is exactly **one** fingerprint in the retrieval system. In
`apps/api/src/lumilab_api/data_pipeline.py`:

- `digest(value)` = SHA-256 over canonical JSON (`sort_keys`, compact
  separators, `ensure_ascii=False`).
- The build artifact is a dict with keys: `schema_version`
  (`retrieval-artifact-1.0`), `corpus_revision`, `registry_revision`,
  `registry_hash`, `embedding_id`, `semantic`, `include_drafts`, `commercial`,
  `tokenizer`, `max_tokens`, `bm25`, `chunks`, `vectors`.
- `artifact["fingerprint"] = digest(artifact)` — a single combined hash of the
  entire artifact. At load time `CompiledIndex` recomputes the digest and
  rejects the artifact on mismatch (`hybrid_retrieval.py`).

## The three identities, kept separate

1. **Profile identity — a version string, not a hash.** The normalization
   profile is `PROFILE = 'vi-en-science-v3'` (baseline) → `'vi-en-science-v4'`
   (after RAG-B1) in `retrieval_terms.py`. The system does **not** compute a
   separate profile fingerprint. The profile influences the artifact only
   through tokenization: it decides which tokens enter the BM25 postings and
   the token-hash vectors.
2. **Corpus/artifact fingerprint — the single combined hash above.** Values on
   baseline a05a0136 (36 chunks): pre-B1
   `45725db93c40b71627cf6fb4cfcd9fa4eccf593d946b5cb10ba1d3ee218b7da5`;
   post-B1 `312afd7b10fb9abecad328db1d2414e479f9eaf74f035237fcbedb7cd85be966`.
   Earlier wording that called the post-patch value a "profile fingerprint" was
   imprecise; it is the combined artifact fingerprint in both cases.
3. **Evaluation identity — a tuple, recorded per run.** Each RAG-03 evaluation
   result records: `corpus_fingerprint` (= the artifact fingerprint of the
   index under test), `embedding_id` (`token-hash-v1-512`), the gate config
   (`min_cosine 0.12`, `min_bm25 0.05`, production RRF via
   `CompiledIndex.retrieve`), and the golden set. The evaluation JSON does not
   hash the golden file itself, so for full reproducibility the golden files
   are pinned here by SHA-256: dev `rag_golden_dev.json` =
   `5849d19144e0e1fc308a0691f170fbc3e4ae27d6347808113be9413befe0f398`;
   held-out `rag_golden_heldout.json` =
   `5f1e51cdeed38b5df774b81543f0dd88646d1adecc1ebe85f95feb5ebb8b7790`.
   (The repo's own `evaluation.py` does record `cases_sha256`; the RAG-03
   harness identifies its sets by name and case counts — 24 dev / 14 held-out.)

## Proof that the B1 delta moves only the BM25 component

Both artifacts were rebuilt on the identical a05a0136 corpus, toggling only
`retrieval_terms.py`:

- Chunk `content_hash` sets: **identical** (36/36) — no document or chunk text
  changed.
- `vectors`: **identical** — the token-hash embedding of the chunk texts did
  not change.
- `bm25`: **differs** — the six added stopwords (`cang giu lon nguyen no qua`)
  are excluded from the postings, which is precisely the approved B1 mechanism.

So the fingerprint change 45725db9… → 312afd7b… is fully explained by the
normalization-profile change acting through BM25 construction; corpus content
is provably untouched.
