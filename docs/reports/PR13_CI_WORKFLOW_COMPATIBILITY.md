# CI Workflow Compatibility — After PR #13/#15

**Baseline:** `a05a01364332845fed6d844e61732352fce3c3d9`
**Headline finding:** `.github/workflows/ci.yml` is **byte-identical** between
`b7e333bb` and `a05a0136` (verified by direct diff). The PR #13 commit named
"sua loi CI" changed test/source files, not the workflow. Every CI-readiness
conclusion from the b7e333bb audit therefore carries over; the only deltas are
growth in what the unchanged workflow now executes.

| CI component | Old behavior (b7e333bb) | New behavior (a05a0136) | PR-B impact | Verdict |
|---|---|---|---|---|
| Workflow file | ci.yml (backend/frontend/e2e/quality-gate) | Identical bytes | None | COMPATIBLE |
| PostgreSQL in backend job | None — PG tests skip by design | Unchanged | None | COMPATIBLE |
| PostgreSQL in e2e job | postgres:17-alpine service + health-check | Unchanged | None | COMPATIBLE |
| DB URL scheme | `postgresql+psycopg://...` in e2e env | Unchanged — and now REQUIRED by main.py (psycopg3 migration) | None; scheme already coherent | COMPATIBLE |
| PG pytest line in e2e | runs `test_tutor_postgres.py` (7) | Unchanged — still does not name `test_tutor_run_acceptance_pg.py` | Same 1-line patch proposed (regenerated in the new PR-B bundle) | PATCH PROPOSED (unchanged) |
| Playwright scope | `npm run test:e2e` (whole suite) | Unchanged — now also executes the team's new `curriculum-labs` + `dataset-sync` specs and PR-B's `tutor-acceptance.spec.ts` automatically | None | COMPATIBLE |
| Backend pytest scope | full `apps/api/tests` discovery in e2e job env | Unchanged — new team tests (`test_curriculum_labs.py` etc.) and PR-B tests are discovered the same way | None | COMPATIBLE |
| Python/driver deps | psycopg2-era code | pyproject pins `psycopg[binary]>=3.2,<4`; CI installs from the same pyproject | Local runners must install psycopg3 (Muse did) | COMPATIBLE |
| Data build in e2e | data_cli build step | data_cli CLI changed (options before subcommand; `--root` removed) — the workflow's own invocation is the repo's current one and was not altered by Muse; local invocations must use the new syntax | Documented in BASELINE_REFRESH_PR13.md | NOTED |

Local verification vs GitHub Actions: all results in this audit are LOCAL.
GitHub Actions status remains NOT VERIFIED by Muse (the connector's
workflow-runs tool requires write-classified access).
