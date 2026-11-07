---
name: lumilab-contract-change
description: Updates LumiLab public lab schemas or API contracts and synchronizes Python models, TypeScript consumers and contract tests.
---
# Contract change

Read `docs/CONTRACT.md` and assigned paths. T3 coordinates shared contracts. Check current endpoints in OpenAPI and trace changed fields into schemas, Python models, frontend DTOs, fixtures, persisted records and tests.

Prefer a compatible additive revision. If a breaking change is necessary, describe migration/consumer order and coordinate owners before editing their files. Add error and boundary examples. Run catalog/schema tests, API tests, frontend type check and affected E2E. Do not claim a new contract is implemented while only changing Markdown.
