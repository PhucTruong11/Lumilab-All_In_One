"""Validate public configs, provenance links and project skill adapters; no network calls."""
import json
import subprocess
import sys
from pathlib import Path

from jsonschema import Draft7Validator
from lumilab_api.recompute import load_runtime_definitions
from lumilab_api.retrieval import Corpus

ROOT = Path(__file__).resolve().parents[1]


def read(relative):
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))


def main():
    schema = read("packages/contracts/schemas/lab.schema.json")
    Draft7Validator.check_schema(schema)
    validator = Draft7Validator(schema)
    dataset = read("knowledge/curated/entries.json")
    entries = {entry["id"]: entry for entry in dataset["entries"]}
    sources = {source["id"] for source in read("knowledge/sources/sources.json")["sources"]}
    if len(entries) != len(dataset["entries"]):
        raise ValueError("Duplicate knowledge IDs")
    seen = set()
    for path in (ROOT / "knowledge/labs").glob("*.lab.json"):
        lab = json.loads(path.read_text(encoding="utf-8"))
        validator.validate(lab)
        if lab["id"] in seen:
            raise ValueError("Duplicate lab IDs")
        seen.add(lab["id"])
        if lab["dataset_version"] != dataset["dataset_version"]:
            raise ValueError("Dataset revision mismatch")
        for evidence in lab["evidence_ids"]:
            entry = entries[evidence]
            if entry["lab_id"] != lab["id"] or not set(entry["source_ids"]) <= sources:
                raise ValueError("Evidence provenance mismatch")
        for param in lab["parameters"].values():
            if not param["min"] <= param["default"] <= param["max"]:
                raise ValueError("Inconsistent bounds")
    if not seen:
        raise ValueError("Empty catalog")
    runtime = load_runtime_definitions(ROOT / "packages/lab-engine")
    corpus = Corpus.model_validate(read("knowledge/retrieval/documents.json"))
    if any(document.lab_id not in runtime for document in corpus.documents):
        raise ValueError("Retrieval source lab is not supported")
    inventory = read("knowledge/sources/lab-provenance.json")["labs"]
    if {item["lab_id"] for item in inventory} != set(runtime):
        raise ValueError("Runtime provenance inventory is incomplete")
    subprocess.run([sys.executable, str(ROOT / "scripts/export_api_schemas.py"), "--check"], check=True)
    subprocess.run([sys.executable, str(ROOT / "scripts/sync_claude_skills.py"), "--check"], check=True)
    print(f"Validated {len(seen)} draft labs, {len(entries)} knowledge entries and provenance links")


if __name__ == "__main__":
    main()
