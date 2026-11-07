# Owner-Controlled Integration & Docker Preparation Report

**Directive:** OWNER-CONTROLLED INTEGRATION & DOCKER PREPARATION (ZERO COMMIT /
ZERO PUSH / ZERO AUTOMATIC MERGE). Muse prepared and verified only; the Owner
executes. No bundle was modified during this review; no Docker command was run;
no patch was applied to any repository.

**Designated review baseline:** `02cebaae` · **Bundle baseline:** `a05a0136`
**Actual remote HEAD at review time:** `86a417b7aa58f719fd2abc4ad8a68f51369a3657`
(Merge PR #14, feature/ui-ux, 2026-11-07T12:28:59Z) — **differs from the
designated baseline.** Per §5 of the directive, baseline-dependent conclusions
below stop at `02cebaae`; the `02cebaae → 86a417b7` delta (PR #17 Docker
tooling, then PR #14 UI/UX) is **NOT VERIFIED** except where a specific file
check is stated.

## 1. PR-A — content and production-file verification — PASS

Bundle `PR-A-Production-Patch-a05a0136/` (12 files): forward patch, rollback
patch, post-patch evaluation results (dev + held-out, json/md/csv), the B1
experiment output, two reports (RAG_B1, RAG_03), README with PR title
`fix(rag): improve Vietnamese science query normalization`, manifest, checksums.
The patch touches exactly **one** production file,
`apps/api/src/lumilab_api/retrieval_terms.py`, in two hunks: `PROFILE`
`vi-en-science-v3` → `vi-en-science-v4`, and one added STOP string
`'cang giu lon nguyen no qua '`. Reference documents in the bundle are
documentation, not source changes.

## 2. PR-B — content and zero-production-file verification — PASS

Bundle `PR-B-Test-Evidence-a05a0136/` (37 files): 3 backend test files, 1
Playwright spec, 4 scripts, 2 golden sets, pre-B1 baseline results measured on
the 36-document corpus, fresh mock benchmark/pilot outputs, 21 reports, README,
manifest, checksums. Payload scan: no file under any production source path;
the only `.py` files are tests and evaluation/benchmark scripts. Zero
production source-code changes — PASS. Destination-path overlap with PR-A: 0.

## 3. Checksum verification — PASS

Re-verified today against the unmodified bundles: PR-A `SHA256SUMS.txt`
**12/12 OK**; PR-B **37/37 OK**. (Archive-level verification from fresh zip
extractions was also run in the preceding review step with the same result.)

## 4. Baseline drift and patch compatibility

- `a05a0136 → 02cebaae` (PR #16): verified directly — 10 files changed, zero
  overlap with bundle destinations; `retrieval_terms.py`, `ci.yml`,
  `knowledge/retrieval/documents.json` untouched; corpus fingerprint
  `312afd7b…` unaffected. **PASS.**
- Patch applicability at the review baseline: because PR #16 did not touch
  `retrieval_terms.py`, its `02cebaae` version equals the pristine `a05a0136`
  baseline. On a scratch copy of that version, the bundle's forward patch
  applies and the rollback patch then applies — **PASS (non-destructive)**.
  The same apply test was also run earlier against the live file at `dae69ff0`
  (PR #17) with PASS; re-run `git apply --check` at actual merge time.
- `02cebaae → 86a417b7` (PR #17 + PR #14): **NOT VERIFIED** as a full delta
  (the connector offers no PR file-list tool). Known from targeted checks:
  PR #17 left `retrieval_terms.py` and `documents.json` unchanged and changed
  `ci.yml` additively (+3 check steps, +1 docker job); PR #14 is UI/UX-themed.
  A scoped file check of PR #14 against PR-B's e2e/web destinations is
  recommended before merging PR-B (see §10).

## 5. PR-C isolation — PASS

`PR-C-CI-Patch-Proposal/` stands alone (patch + CI_READINESS.md + README
marked NOT APPROVED). Neither bundle contains the CI patch or the readiness
file; the shared manifest mentions PR-C only in an explanatory note. The
GitHub Actions workflow is untouched by all three packages.

## 6. PHASE VIII separation — PASS

`phase8-preparation/` exists only in Muse's working tree: 20 MISSING_EVIDENCE
cases intact (12 dev + 8 held-out) plus 3 design documents and the generator.
Neither bundle contains any scaffold artifact (no `missing_evidence_*.json`,
no sufficiency/wrong-lab design docs). Two PR-B reports merely *discuss*
deferred work (`PHASE8_HANDOFF.md`, `RAG_B2_MISSING_EVIDENCE_INVESTIGATION.md`)
— they are part of PR-B's approved report set and implement nothing. No
Evidence Sufficiency or Wrong-Lab implementation exists or is authorized.

## 7. Docker configuration inspection — INSPECTED (NOT RUN)

Inspected from source in the `a05a0136` tree; no Docker command was executed.

- **Compose** (`docker/compose.yml`, project `lumilab-b-dev`): `db`
  postgres:17-alpine on 127.0.0.1:15434 with named volume `postgres_data` and a
  pg_isready healthcheck; `api` built from `docker/api.Dockerfile` on
  127.0.0.1:8002, env forces `LUMILAB_LLM_ENABLED=false`,
  `LUMILAB_LLM_EVENT_CAP=0`, `LUMILAB_RAG_ENABLED=false`, depends on db
  healthy, healthcheck on `/ready`; `web` built from `docker/web.Dockerfile`
  on 127.0.0.1:5175, depends on api healthy, healthcheck `/healthz`; `chroma`
  (chromadb 1.3.0, volume `chroma_data`) only under the `rag` profile.
- **Migration:** the api container's command runs
  `python -m lumilab_api.run_schema` before uvicorn at every start — schema
  application is automatic and part of container startup; no separate manual
  migration step exists in this stack.
- **Retrieval index:** `api.Dockerfile` builds it at image build time
  (`data_cli build --include-drafts` → `/workspace/retrieval-index/index.json`,
  exposed via `LUMILAB_RAG_ARTIFACT_PATH`). Consequence: **the index is baked
  into the api image** — after PR-A merges, the api image must be rebuilt or
  the running system keeps the pre-B1 fingerprint. Verify the Dockerfile's
  exact data_cli argument order at build time (the CLI's options/subcommand
  ordering changed between baselines).
- **api.Dockerfile:** python:3.13-slim; copies apps/api, knowledge, contracts,
  lab-engine labs/schemas; installs `docker/requirements-api.lock` plus the
  api package; runs as non-root `appuser`.
- **web.Dockerfile:** node:24-alpine multi-stage; `npm ci` from the lockfile;
  `npm run build:web`; nginx serves the dist with `docker/nginx.conf`
  (proxies /api to the api service).
- **Start-LumiLab.ps1** (`scripts/Start-LumiLab.ps1`): verifies Docker CLI and
  daemon, validates the compose config, runs
  `docker compose up -d --build --wait web`, then checks `/healthz` = 200 and
  that `/api/v1/labs` and `/api/v1/runtime-labs` return non-empty catalogs.
  It never removes volumes.
- **Cache behaviour:** Docker layer caching applies; the api image's pip and
  index layers rebuild when `requirements-api.lock`, `apps/api`, or
  `knowledge` change. PR-A changes `apps/api` → the copy, install, and
  index-build layers rebuild; base layers are reused.

## 8. Manual Docker rebuild & verification runbook (Owner executes)

1. **Pre-build checks:** Docker Desktop/daemon running
   (`docker info`); from the repo root,
   `docker compose -f docker/compose.yml config --quiet` exits 0; ports
   5175/8002/15434 free; confirm no `.env` overrides LLM/RAG flags (compose
   defaults keep them off).
2. **What to rebuild:** after PR-A → **api image only** (source + baked index
   change). Web image rebuild is needed only if web sources change (not in
   PR-A/PR-B). `db` and `chroma` are pulled images, never built.
3. **Commands, in order** (either path):
   - Script path: `pwsh scripts/Start-LumiLab.ps1` (builds, starts, waits for
     health, verifies catalogs), or
   - Manual path: `docker compose -f docker/compose.yml build api` →
     `docker compose -f docker/compose.yml up -d` →
     `docker compose -f docker/compose.yml ps` (all healthy).
4. **Migration:** none manual — `run_schema` executes inside the api start
   command; watch `docker compose logs api` for schema success before the
   uvicorn start line.
5. **Index verification (expected 36 chunks):**
   `docker compose -f docker/compose.yml exec api python -c "import json;d=json.load(open('/workspace/retrieval-index/index.json'));print(len(d['chunks']), d['fingerprint'])"`
   → expect `36` and, after PR-A,
   `312afd7b10fb9abecad328db1d2414e479f9eaf74f035237fcbedb7cd85be966`
   (before PR-A: `45725db9…`).
6. **Health checks:** `http://127.0.0.1:8002/ready` → 200;
   `http://127.0.0.1:5175/healthz` → 200; `/api/v1/labs` via 5175 returns a
   non-empty catalog; open a lab page in the browser.
7. **Tests (host, from repo root):** backend
   `python -m pytest apps/api/tests` (expect the suite green; PG tests skip
   without a DB); with the compose DB up and
   `LUMILAB_DATABASE_URL=postgresql+psycopg://lumilab:<pw>@127.0.0.1:15434/lumilab`
   the PG tests execute; frontend `npm run check:web`, `npm run test:unit`,
   `npm run build:web`; E2E `npm run test:e2e` with the same DB URL exported.
8. **PASS criteria:** all services healthy; index = 36 chunks with the
   expected fingerprint for the code state; /ready and /healthz 200; catalog
   non-empty; test suites green with the same counts class as the local audit
   (totals will differ on newer HEADs — judge failures, not totals).
9. **Rollback / recovery:** code rollback per §9, then rebuild the api image
   (the baked index follows the code). Stack stop that preserves data:
   `docker compose -f docker/compose.yml down` (no `-v`).
10. **Destructive — extra caution, never without a separate Owner decision:**
    `docker compose down -v` (deletes `postgres_data` and `chroma_data`),
    `docker volume rm`, `docker system prune --volumes`, pointing the stack
    at a non-dev env file or database.

## 9. Manual PR integration & rollback runbook (Owner executes)

**PR-A:** branch from current main → `git apply --check` the bundle patch →
apply → run the local gates (pytest, ruff, data build: expect fingerprint
`312afd7b…`) → open the PR with the bundle README's title → confirm CI
(frontend, backend, e2e, docker, quality-gate at current HEAD) → merge.
**PR-B:** only after PR-A is merged: branch → copy `files/` payload to the
manifest destinations → verify no production path is touched
(`git status --porcelain` review) → open PR with the bundle title → CI →
merge. **PR-C:** stays HOLD; if ever approved, it is its own PR changing only
`ci.yml` by one line.
**Rollback:** PR-A — revert the merge commit, or apply
`rag-b1-option-a-ROLLBACK.patch` (byte-exact restore of the file), then
rebuild the api image so the baked index returns to `45725db9…`. PR-B —
revert the merge commit (purely additive files; no runtime impact). Either
rollback leaves the database untouched.

## 10. Outstanding risks & Owner decisions

- **HEAD drift (NOT VERIFIED beyond 02cebaae):** main is at `86a417b7`
  (PR #14, UI/UX). Before merging PR-B, run one scoped check of PR #14's
  files against PR-B's destinations (chiefly `tests/e2e/` and web sources);
  PR-A's target file was verified unchanged as late as `dae69ff0`, and
  `git apply --check` at merge time is the final guard.
- **CI has never run with PR-A/PR-B applied** — all results remain PASS LOCAL
  until the Owner's integration run produces a green GitHub Actions result
  (which, at current HEAD, will also produce the first CI Docker evidence).
- **Docker has never been executed by Muse** — §7 is source inspection;
  §8's PASS criteria are expectations for the Owner's run, not results.
- **Decisions retained by the Owner:** integrate PR-A → PR-B on current main
  or re-pin a review baseline first; PR-C approve/reject (independent);
  PHASE VIII authorization (separate, written); TUTOR-03 live pilot remains
  BLOCKED (no `send_llm`-approved sources, no budget/key granted).
- **PHASE VII status: NOT CLOSED** — it closes only when both PRs are merged
  with green CI under Owner control.
