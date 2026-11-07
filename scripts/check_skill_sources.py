"""Verify pinned vendor skill files against the recorded hashes without network access."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / '.agents/vendor-lock.json').read_text(encoding='utf-8'))
for skill in manifest['skills']:
    folder = root / '.agents/skills' / skill['name']
    for relative, expected in skill['files'].items():
        actual = hashlib.sha256((folder / relative).read_bytes()).hexdigest()
        if actual != expected:
            raise SystemExit(f'Upstream skill changed: {skill["name"]}/{relative}')
print(f'Verified {len(manifest["skills"])} pinned vendor skills')
