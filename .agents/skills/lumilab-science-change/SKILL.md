---
name: lumilab-science-change
description: Changes LumiLab deterministic models, scientific verification or curated facts with model-scoped evidence and cross-language regression checks.
---
# Scientific change

Read `SCIENCE.md`, `docs/VERIFICATION.md` and the task's model scope. Trace the model through `packages/lab-engine/`, the Python recompute path and the UI. Preserve nonlinear pendulum behavior at large release angles and water auto-ionization near titration equivalence.

Record assumptions, units, supported bounds and provenance before changing formulas. Use independent reference cases and physical invariants. Put shared vectors under `tests/golden/` and run the affected TypeScript and Python tests.

For catalog/parser extensions distinguish malformed, unsupported and insufficient data. Require T2/T4 review before marking knowledge approved. Do not let an LLM decide a reaction or manufacture a numeric expected result. Update model/dataset revisions and affected contracts together.
