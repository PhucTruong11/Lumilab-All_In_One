# API module

Follow root AGENTS.md. T3 owns HTTP/storage, T2 owns scientific domain/verifier and T4 owns tutor/retrieval. Coordinate boundary changes before touching another owner's code.

- Keep deterministic models independent of FastAPI and providers. Routers validate and delegate; transaction boundaries belong in services/repositories.
- Do not replace PostgreSQL integration checks with SQLite for JSONB, ownership or concurrent budget behavior. Migrations and data backup need real Postgres tests.
- Avoid importing optional embedding/provider packages when the feature is off. Network calls have timeouts; no network in unit tests.
- Keep error envelopes and OpenAPI synced with public contracts. Do not log raw input, auth headers, API keys or database URLs.
- Run pytest/Ruff and affected contract/golden checks. Verification recomputes draft readings in preview. Keep those outputs separate from trusted facts. Keep VERIFIED disabled until reviewed evidence and required scientific stages exist. Draft run storage uses session ownership and PostgreSQL. Keep token hashes and draft run data separate from tutor facts.
