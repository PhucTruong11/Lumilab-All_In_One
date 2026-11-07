# Baseline Refresh — PR #13/#15 Impact Audit

**Repository:** `PhucTruong11/Lumilab-All_In_One`, branch `main`
**Old baseline:** `b7e333bbea747bd71dfed00dfc45fa173e5b592f` (Merge PR #12)
**New baseline (owner-approved after drift):** `a05a01364332845fed6d844e61732352fce3c3d9` (Merge PR #15, 2026-11-07T10:35:10Z)
**Method:** full API export of the new HEAD (367 files) diffed file-by-file (SHA256)
against the preserved b7e333bb working copy; corpus and workflow compared directly.

## Baseline path

`b7e333bb` → `02d92f2b` (Merge PR #13, feature/dataset: 93909f5c nine labs +
learning materials, 8bc0d27c CI fix) → `a05a0136` (Merge PR #15,
chore/transfer-llm-bench: d449123b LLM operations runbook + migration ledger,
8b47d612 LLM handoff links). The owner first pinned 02d92f2b, then approved
a05a0136 after Muse stopped at the §0.1 gate a second time.

## Working-copy preservation (PHASE 0)

- Old bundles verified against their SHA256SUMS before any work: PR-A 13/13 OK,
  PR-B 39/39 OK; both left untouched as historical archives.
- Snapshot of the old working copy: `~/workspace/backups/working-copy-b7e333bb-snapshot.tar.gz`.
- New baseline exported to a separate tree `~/workspace/all-in-one-a05a0136`;
  the old tree was never reset or overwritten.

## PR #13 + PR #15 change impact (b7e333bb → a05a0136)

- **37 files changed, 135 files added, 0 repository files removed** (the only
  "removed" paths were Muse's local cache artifacts).
- **Corpus:** `knowledge/retrieval/documents.json` 30 → **36 documents**; six new
  overview docs (`spring-damped`, `inclined-plane`, `pulley`, `alkali-water`,
  `copper-nitric`, `chlorine-bleach`, one doc each); **zero** existing docs
  modified or removed; all 36 remain `review_status = draft`. Data build:
  30 → **36 chunks**; lint flags every doc SOURCE_INDEX_NOT_APPROVED +
  ACADEMIC_REVIEW_REQUIRED (12 also SECOND_INDEPENDENT_SOURCE_PENDING) —
  nothing new is production-eligible.
- **Backend runtime changed:** `readings.py`, `recompute.py`,
  `scientific_checks.py` modified; new `curriculum_readings.py` +
  `test_curriculum_labs.py`. **Driver migration:** pyproject now pins
  `psycopg[binary]>=3.2,<4` and `main.py` requires `postgresql+psycopg://` URLs
  (CI already uses that scheme — coherent). **data_cli interface changed:**
  options now precede the subcommand and `--root` is gone.
- **`retrieval_terms.py`: byte-identical to the b7e333bb baseline** — the B1
  patch has zero interaction with PR #13/#15 (verified by direct diff).
- **CI:** `.github/workflows/ci.yml` is **byte-identical** across the refresh —
  the PR #13 "sua loi CI" commit changed test/source files, not the workflow.
  All earlier CI-readiness conclusions carry over unchanged (details in
  PR13_CI_WORKFLOW_COMPATIBILITY.md).
- **Frontend/lab-engine:** six new labs in `packages/lab-engine/labs/`, catalog +
  schemas updated, new components (CurriculumLab), new e2e specs
  (`curriculum-labs.spec.ts`, `dataset-sync.spec.ts`) and golden data.
- **Docs/tooling (PR #15):** `docs/LLM-RUNBOOK.md`, `docs/MIGRATION-LEDGER.md`,
  `docs/LIVE-LLM-EVALUATION.md`, `docs/LLM-DATA-REVIEW.md`, spec-kit scaffolding
  (`.specify/`, `specs/`), agent skills (`.agents/`, `.claude/`).

## Expected impact on RAG (confirmed in PHASE 2 of the audit)

The six new chunks are same-style overview docs; pre-patch evaluation on the new
corpus reproduced the old baseline's metrics exactly, and post-B1 metrics
reproduced the approved B1 results exactly. Corpus fingerprint changed as
expected: pre-patch `45725db9…`, post-patch `312afd7b…` (full values in the final
audit report). No golden-set edits were made.
