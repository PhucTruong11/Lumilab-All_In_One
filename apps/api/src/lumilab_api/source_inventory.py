"""Inventory downloaded sources without granting ingestion or academic approval."""
import argparse
import hashlib
import json
import subprocess
import xml.etree.ElementTree as ET
from datetime import UTC, datetime
from pathlib import Path

from .data_pipeline import load_registry

TOPICS = {
    "physics": {"forces_pulleys": ("force", "newton", "machine", "pulley", "work"),
        "electricity": ("circuit", "current", "resistance", "ohm", "capacitor"),
        "pendulum": ("pendulum", "harmonic", "oscillat", "periodic")},
    "chemistry": {"acid_base": ("acid", "base", "titration", "ph"),
        "precipitation": ("precipitation", "solubility", "ionic"),
        "inorganic_reactions": ("reaction", "stoichiometry", "gas", "oxidation")},
}


def inventory(root: Path) -> dict:
    registry = load_registry(root / "knowledge/pipeline/sources.json")
    report = {"created_at": datetime.now(UTC).isoformat(), "scientific_status":"draft",
        "curriculum":registry.curriculum, "sources":[], "llm_calls":0,
        "vmlu":{"status":"AUTHENTICATED_DOWNLOAD_REQUIRED", "url":"https://vmlu.ai/#Download",
            "repo_commit":None, "dataset_downloaded":False, "license_status":"dataset_terms_pending",
            "note":"Do not reuse website credentials or unofficial mirrors. Repo MIT is not a dataset grant."}}
    for source in registry.sources:
        if source.kind != "external":
            continue
        folder = root / ".local/sources" / source.id.removeprefix("openstax-")
        actual = subprocess.check_output(["git","-C",str(folder),"rev-parse","HEAD"],text=True).strip()
        if actual != source.commit:
            raise ValueError("Source commit mismatch")
        items, selected = [], []
        topic = TOPICS["physics" if "physics" in source.id else "chemistry"]
        for path in sorted(folder.glob("modules/*/index.cnxml")):
            raw = path.read_bytes()
            if b"<!DOCTYPE" in raw or b"<!ENTITY" in raw:
                raise ValueError("Unsupported XML declaration")
            element = ET.fromstring(raw)
            title = next((" ".join(e.itertext()).strip() for e in element
                if e.tag.split("}")[-1] == "title"), "")
            matches = [key for key, needles in topic.items() if any(n in title.lower() for n in needles)]
            item = {"path":path.relative_to(folder).as_posix(), "title":title,
                "sha256":hashlib.sha256(raw).hexdigest(), "bytes":len(raw), "topics":matches}
            items.append(item)
            if matches:
                selected.append(item)
        license_path = folder / "LICENSE"
        report["sources"].append({"source_id":source.id,"commit":actual,"url":str(source.url),
            "license":source.license, "license_sha256":hashlib.sha256(license_path.read_bytes()).hexdigest(),
            "rights_status":source.rights_status,"module_count":len(items),
            "text_bytes":sum(i["bytes"] for i in items),"selected_module_count":len(selected),
            "modules":items,"candidate_sections":selected,"ingested":False,
            "note":"Title keyword selection only; review chapter/level/science and rights before import."})
    vmlu = root / ".local/sources/VMLU"
    if vmlu.exists():
        report["vmlu"]["repo_commit"] = subprocess.check_output(["git","-C",str(vmlu),"rev-parse","HEAD"],text=True).strip()
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path(".local/source-audit/inventory.json"))
    args = parser.parse_args()
    result = inventory(Path.cwd())
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"sources":[{k:v for k,v in s.items() if k not in {"modules","candidate_sections"}}
        for s in result["sources"]],"vmlu":result["vmlu"]},ensure_ascii=False))


if __name__ == "__main__":
    main()
