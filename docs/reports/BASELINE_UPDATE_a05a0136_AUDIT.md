# Baseline Update Audit — b7e333bb → a05a0136

**Repository:** `PhucTruong11/Lumilab-All_In_One`, branch `main`
**Old baseline:** `b7e333bbea747bd71dfed00dfc45fa173e5b592f`
**New baseline:** `a05a01364332845fed6d844e61732352fce3c3d9` (Merge PR #15)
**Executor:** Muse (no commit / push / merge / real PR). All results below were
RUN locally by Muse on the exported a05a0136 tree unless marked otherwise.

## Section 1 — Baseline Refresh

- Remote HEAD verified `a05a0136` exactly, twice (before export and at audit end —
  see Section 9 note). Path: b7e333bb → 02d92f2b (PR #13, feature/dataset) →
  a05a0136 (PR #15, LLM docs/runbook). The owner pinned 02d92f2b first; Muse
  stopped at the directive's §0.1 gate when HEAD had already advanced, and the
  owner approved a05a0136.
- Preservation: old bundles SHA256-verified intact (PR-A 13/13, PR-B 39/39);
  old working copy snapshotted to `~/workspace/backups/working-copy-b7e333bb-snapshot.tar.gz`;
  new baseline exported to a separate tree (367 files). Nothing was reset or
  overwritten.
- PR #13/#15 impact (full detail in BASELINE_REFRESH_PR13.md): 37 files changed,
  135 added, 0 removed. Corpus 30 → 36 docs (6 new lab overviews, all draft,
  existing docs untouched). Backend: readings/recompute/scientific_checks
  changed, curriculum_readings added, **psycopg2 → psycopg3 migration**
  (`postgresql+psycopg://` now required), **data_cli CLI changed** (options
  before subcommand, `--root` removed). CI workflow: byte-identical.

## Section 2 — B1 Patch Compatibility

- `retrieval_terms.py` at a05a0136 is **byte-identical** to the b7e333bb
  baseline → zero interaction with PR #13/#15.
- Patch recreated on the new baseline: exactly 2 hunks — `PROFILE`
  `vi-en-science-v3` → `vi-en-science-v4`, and one added STOP line
  `'cang giu lon nguyen no qua '`. No other production file touched.
- Rollback: forward and rollback patches both pass `git apply --check` and
  round-trip byte-exactly on a pristine copy of the new baseline file.

## Section 3 — Corpus Rebuild

- Data lint: runs; all 36 docs flagged SOURCE_INDEX_NOT_APPROVED +
  ACADEMIC_REVIEW_REQUIRED (12 also SECOND_INDEPENDENT_SOURCE_PENDING) —
  governance state unchanged: everything draft, nothing production-eligible.
- Data build (drafts included): **36 chunks**. New labs in retrieval corpus:
  spring-damped, inclined-plane, pulley, alkali-water, copper-nitric,
  chlorine-bleach (1 overview doc each); corpus now spans 17 `lab_id` groups.
- Fingerprints: pre-patch corpus/artifact `45725db93c40b71627cf6fb4cfcd9fa4eccf593d946b5cb10ba1d3ee218b7da5`;
  post-patch `312afd7b10fb9abecad328db1d2414e479f9eaf74f035237fcbedb7cd85be966`
  (the fingerprint incorporates the normalization profile, so it changes with
  the patch by design; the old-baseline post-patch value `abc827a9…` is
  superseded).

## Section 4 — Retrieval Evaluation (production RRF, golden sets unchanged)

Pre-patch on the new corpus reproduced the old baseline exactly; post-patch
reproduced the approved B1 outcome exactly. No regression; no per-case changes
beyond the intended `ho-cir-01` fix.

| Set | State | Hit@1 | Hit@3 | Recall@3 | MRR | CRR |
|---|---|---:|---:|---:|---:|---:|
| Dev (24) | pre-B1, new corpus | 0.8125 | 0.9375 | 0.9375 | 0.875 | 0.625 |
| Dev (24) | post-B1, new corpus | 0.8125 | 0.9375 | 0.9375 | 0.875 | 0.625 |
| Held-out (14) | pre-B1, new corpus | 0.6667 | 0.7778 | 0.7778 | 0.7037 | 0.800 |
| Held-out (14) | post-B1, new corpus | **0.7778** | **0.8889** | **0.8889** | **0.8148** | 0.800 |

Post-patch failure lists: false refusals — none on either set (`ho-cir-01`
fixed); false answers unchanged (dev-wronglab-02/03, dev-missing-03,
ho-missing-01 — the RAG-B2 class, deferred to PHASE VIII). The six new chunks
did not alter any golden case's outcome.

## Section 5 — Regression Results (new tree, post-patch, PR-B files integrated)

| Check | Result |
|---|---|
| pytest, no DB | **648 passed / 12 skipped** |
| pytest, PostgreSQL 18.6 (local, psycopg3 URL) | **658 passed / 2 skipped** (10 PG tests incl. 3 new run-acceptance) |
| Ruff (apps/api + scripts) | Clean (2 style nits in Muse's own experiment script fixed) |
| npm check:web | Pass |
| Vitest | **95 passed** (was 74 — team added curriculum tests) |
| npm build:web | Pass |
| Data lint / build | Pass / 36 chunks |
| Playwright, isolated (own DB `lumilab_e2e`, sequential) | **57 passed / 0 failed** (4.8 min; suite grew from 40) |
| Docker | NOT RUN (no Docker in Muse's environment) — non-blocking per owner |

Environment notes: Muse's VM was replaced between sessions; PostgreSQL was
rebuilt from the pinned `postgresql-binaries` package and `psycopg[binary]`
installed to match the new baseline's pyproject.

## Section 6 — CI Compatibility

Full table in PR13_CI_WORKFLOW_COMPATIBILITY.md. Headline: ci.yml unchanged;
the one known gap is unchanged — the e2e job's PG pytest line still does not
name `test_tutor_run_acceptance_pg.py`. The same minimal 1-line patch is
included, unapplied, in the new PR-B bundle (`ci-changes/`). Local results are
not CI results; GitHub Actions status remains NOT VERIFIED by Muse.

## Section 7 — PR-A / PR-B Repackaging

- New bundles: `PR-A-Production-Patch-a05a0136/` and
  `PR-B-Test-Evidence-a05a0136/` (old bundles untouched as historical archives).
- PR-A: recreated patch + rollback (both apply-checked), post-patch evaluation
  results on the new corpus, fresh B1 experiment output, RAG_B1 + RAG_03 +
  BASELINE_REFRESH reports, README with the same PR title
  `fix(rag): improve Vietnamese science query normalization`.
- PR-B: tests/spec/scripts/golden sets identical in content to the previous
  bundle except: refreshed baseline-pre-b1 results measured on the NEW corpus,
  fresh cache-benchmark and mock-pilot outputs, the two new-baseline reports,
  and the refreshed final report + this audit. The old-corpus `rag_b2_signals.json`
  was deliberately NOT carried over (stale evidence; RAG-B2 re-measurement is a
  PHASE VIII item). Zero production files — verified programmatically;
  destination-path overlap with PR-A = 0; SHA256SUMS regenerated and verified
  for both bundles; merge order remains PR-A first, PR-B second.

## Section 8 — PHASE VIII Scaffold

In `phase8-preparation/` (separate directory; in neither bundle):
`missing_evidence_dev.json` (12 cases), `missing_evidence_heldout.json`
(8 cases) — 20 total, 5 per lab (pendulum/circuit/spring/chemistry), all 11
record fields per case; `MISSING_EVIDENCE_DATASET_DESIGN.md` (incl. the
17-group corpus taxonomy check and the validation protocol),
`EVIDENCE_SUFFICIENCY_DESIGN.md` (SUFFICIENT / LOW_EVIDENCE / NO_EVIDENCE /
WRONG_LAB, decision sketch, LOW_EVIDENCE response template),
`WRONG_LAB_CROSSCHECK_DESIGN.md` (7-step check, decision table, test-case
template; flags spring vs spring-damped as a new terminology-risk pair).
Labels are design intent; held-out is never used for calibration.

## Section 9 — Acceptance Matrix

| # | Gate | Verdict |
|---|---|---|
| 1 | Remote HEAD exact match (a05a0136) | PASS |
| 2 | Working-copy preservation | PASS |
| 3 | PR #13/#15 impact audit | PASS |
| 4 | B1 patch compatibility | PASS |
| 5 | Profile fingerprint | PASS (v4; post-patch corpus fp 312afd7b…) |
| 6 | Artifact fingerprint rebuilt | PASS (36 chunks) |
| 7 | Corpus lint/build | PASS |
| 8 | Dev evaluation re-run | PASS |
| 9 | Held-out evaluation re-run | PASS |
| 10 | PostgreSQL pytest re-run | PASS LOCAL (658/2) |
| 11 | Playwright E2E re-run | PASS LOCAL (57/0) |
| 12 | CI compatibility | PASS (verified by file audit; Actions NOT VERIFIED) |
| 13 | PR-A production isolation (1 file) | PASS |
| 14 | PR-B production isolation (0 files) | PASS |
| 15 | Cross-bundle conflict | PASS (0) |
| 16 | Rollback apply check | PASS |
| 17 | MISSING_EVIDENCE ≥ 15 questions | PASS (20) |
| 18 | Evidence Sufficiency design | PASS |
| 19 | Wrong-lab cross-check design | PASS |
| 20 | Final report complete | PASS (this document) |
| 21 | Git operations | PASS (0 commit / 0 push / 0 merge / 0 real PR) |
| — | Docker acceptance | NOT RUN (non-blocking) |
| — | TUTOR-01/02 on GitHub Actions | PENDING CI (PASS LOCAL only) |
| — | TUTOR-03 live pilot | BLOCKED (unchanged) |

## Section 10 — Owner Decision Required

1. Integrate **PR-A (a05a0136)** first, then **PR-B (a05a0136)** (+ the optional
   1-line CI patch), and confirm CI green — PHASE VII closes only then.
2. Note the baseline-drift pattern: main moved 3 times in ~2 hours during this
   audit cycle. If further merges land before integration, the bundles' baseline
   statement (a05a0136) should be re-checked; the B1 patch itself is insulated
   because `retrieval_terms.py` has been stable across PR #11–#15.
3. PHASE VIII remains un-authorized for implementation; the scaffold is ready
   for review. RAG-B2 re-measurement on the new corpus is one of its inputs.

## Post-audit drift note (added at delivery)

The full audit above was executed against baseline `a05a0136`, verified at start
and during execution. At final delivery, remote main had advanced once more to
`02cebaae46c986020dc54ecac33ac8b5b9b578b6` (Merge PR #16, feature/verifyData,
commit afe936f6 'phan test data', 2026-11-07T11:01:53Z). The bundles in this
delivery are labelled and valid for **a05a0136**. Before integrating, the owner
should re-run `git apply --check` for PR-A against the then-current main and
decide whether a further baseline refresh is wanted; Muse did not silently
re-baseline a fourth time.
