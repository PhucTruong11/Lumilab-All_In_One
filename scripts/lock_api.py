"""Lock installed foundation API dependencies after a controlled virtualenv install."""
from importlib.metadata import distribution, distributions
from pathlib import Path

from packaging.requirements import Requirement
from packaging.utils import canonicalize_name

ROOT = Path(__file__).resolve().parents[1]


def main():
    root = distribution("lumilab-api")
    pending = [Requirement(value) for value in root.requires or [] if "extra ==" not in value]
    runtime = {}
    visited = set()
    while pending:
        requirement = pending.pop()
        key = (canonicalize_name(requirement.name), tuple(sorted(requirement.extras)))
        if key in visited:
            continue
        visited.add(key)
        dist = distribution(requirement.name)
        runtime[dist.metadata["Name"]] = dist.version
        extras = requirement.extras or {""}
        for value in dist.requires or []:
            child = Requirement(value)
            if child.marker is None or any(child.marker.evaluate({"extra": extra}) for extra in extras):
                pending.append(child)
    header = "# Resolved in Python 3.13; regenerate in isolated .venv with scripts/lock_api.py.\n"
    api = header + "\n".join(f"{name}=={version}" for name, version in sorted(runtime.items(), key=lambda pair: pair[0].lower())) + "\n"
    (ROOT / "docker/requirements-api.lock").write_text(api, encoding="utf-8")
    dev = {dist.metadata["Name"]: dist.version for dist in distributions() if canonicalize_name(dist.metadata["Name"]) not in {"pip", "setuptools", "lumilab-api"}}
    (ROOT / "docker/requirements-dev.lock").write_text(header + "\n".join(f"{name}=={version}" for name, version in sorted(dev.items(), key=lambda pair: pair[0].lower())) + "\n", encoding="utf-8")
    print(f"Locked {len(runtime)} runtime dependencies; dev lock includes {len(dev)} packages")


if __name__ == "__main__":
    main()
