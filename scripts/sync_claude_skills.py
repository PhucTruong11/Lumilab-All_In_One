"""Mirror coding skills to Claude; Spec Kit owns its native generated skills."""
import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check that generated copies match")
    args = parser.parse_args()
    for folder in sorted((ROOT / ".agents/skills").iterdir()):
        if not (folder / "SKILL.md").is_file() or folder.name.startswith("speckit-"):
            continue
        target_folder = ROOT / ".claude/skills" / folder.name
        if args.check:
            for source in folder.rglob("*"):
                if not source.is_file() or "__pycache__" in source.parts:
                    continue
                target = target_folder / source.relative_to(folder)
                if not target.is_file() or source.read_bytes() != target.read_bytes():
                    raise SystemExit(f"Skill copy differs: {target.relative_to(ROOT)}")
        else:
            shutil.copytree(folder, target_folder, dirs_exist_ok=True, ignore=shutil.ignore_patterns("__pycache__"))
    print("Coding skill copies match" if args.check else "Copied coding skills and supporting resources")


if __name__ == "__main__":
    main()
