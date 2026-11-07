"""Check local links in the team's entry-point documentation (no network)."""
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    ROOT / name for name in ("README.md", "CONTRIBUTING.md", "SCIENCE.md", "THIRD_PARTY_NOTICES.md",
                             "deploy/cloud-run/README.md", "knowledge/tutor-skills/README.md")
]
FILES += sorted((ROOT / "docs").glob("*.md"))
FILES += sorted((ROOT / "docs/tasks").glob("*.md"))
checked = 0
for page in FILES:
    content = re.sub(r"```.*?```", "", page.read_text(encoding="utf-8"), flags=re.DOTALL)
    for target in re.findall(r"!?\[[^\]]*\]\(([^)]+)\)", content):
        parsed = urlsplit(target.strip("<>"))
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        path = page.parent / unquote(parsed.path)
        if not path.exists():
            raise SystemExit(f"Broken local doc link: {page.relative_to(ROOT)} -> {target}")
        checked += 1
print(f"Verified {checked} local documentation links")
