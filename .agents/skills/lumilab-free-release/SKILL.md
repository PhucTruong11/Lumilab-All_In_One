---
name: lumilab-free-release
description: Prepares or executes an authorized LumiLab release using verified free hosting, bounded API usage, rollback and a local fallback.
---
# Free release

Read the Docker Compose instructions in `README.md`, `docs/LLM-DATA-REVIEW.md` and the release task. Verify the target environment's compute, build, registry, egress, secrets and DB costs and quotas before choosing it. Use the target and budget approved for the task.

Before live AI, verify free-tier account configuration, remaining quota, durable atomic attempt counter, no SDK retries and template error path. Keep RAG/embedding libraries out of the lean API unless the selected host has passed resource tests.

Run release checks, DB restore and online/local walkthroughs. Health probes never call providers. Record the exact build, migration, source/model revisions and real outcomes. If deployment is not authorized or credentials are missing, finish the local deployable result and report the specific missing input; do not claim it is published.
