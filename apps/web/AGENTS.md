# Frontend module

Follow root AGENTS.md. Preserve the Vietnamese UX and interactive behavior in the legacy demo while porting incrementally. Prioritize the lab canvas/SVG; information and controls can collapse without losing state.

- Engine pure functions own numeric results; React renders snapshots. Never call an LLM from the browser or expose credentials in VITE variables.
- Model API loading/error/empty/degraded states explicitly. A failed save is not saved; a local result is not server verified. Live/template/cache labels reflect actual backend responses.
- Build responsive pointer/keyboard interactions and accessible controls. Use existing renderers and CSS assets where appropriate; add Recharts only for a concrete chart task.
- Run type/lint/unit checks and affected Playwright interactions. Do not replace a real interaction check with a screenshot alone.
