"""Offline data workflow. No model downloads or external provider calls."""
import argparse
import json
import subprocess
from pathlib import Path

from .data_pipeline import (
    compile_artifact,
    convert_section,
    digest,
    lint_corpus,
    load_registry,
    section_blocks,
)
from .retrieval import Corpus
from .vector_index import VectorConfig


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["lint", "build", "convert", "import-section"])
    parser.add_argument("--knowledge", type=Path, default=Path("knowledge"))
    parser.add_argument("--labs", type=Path, default=Path("packages/lab-engine"))
    parser.add_argument("--output", type=Path, default=Path(".local/retrieval/index.json"))
    parser.add_argument("--include-drafts", action="store_true")
    parser.add_argument("--commercial", action="store_true")
    parser.add_argument("--mvp-only", action="store_true")
    parser.add_argument("--chroma", type=Path)
    parser.add_argument("--input", type=Path)
    parser.add_argument("--document-id")
    parser.add_argument("--title")
    parser.add_argument("--chapter", default="pending")
    parser.add_argument("--source-id")
    parser.add_argument("--git-dir", type=Path)
    parser.add_argument("--section-path")
    parser.add_argument("--lab-id", choices=["pendulum", "circuit", "chemistry"])
    args = parser.parse_args()
    registry = load_registry(args.knowledge / "pipeline/sources.json")
    if args.command == "import-section":
        if not all([args.input, args.document_id, args.title, args.source_id, args.lab_id]):
            parser.error("import-section requires input, document-id, title, source-id and lab-id")
        source = registry.source(args.source_id)
        if not source.permits("convert") or not source.permits("index"):
            raise SystemExit("SOURCE_IMPORT_NOT_APPROVED")
        content = args.input.read_text(encoding="utf-8")
        first, text = content.split("\n", 1)
        prefix, suffix = "<!-- lumilab-metadata ", " -->"
        if not first.startswith(prefix) or not first.endswith(suffix):
            raise SystemExit("Converted metadata header required")
        header = json.loads(first[len(prefix):-len(suffix)])
        if (header["source_id"] != source.id or header["commit"] != source.commit or header["lab_id"] != args.lab_id
                or header.get("license") != source.license
                or header.get("content_sha256") != digest(text.strip())):
            raise SystemExit("Converted metadata/source mismatch")
        corpus_path = args.knowledge / "retrieval/documents.json"
        raw = json.loads(corpus_path.read_text(encoding="utf-8"))
        record = {"id": args.document_id, "lab_id": args.lab_id, "title": args.title,
            "text": "", "keywords": [], "review_status": "draft", "reviewer": None,
            "reviewed_at": None, "origin": "external", "external_material_use": "licensed-excerpt",
            "references": [{"label": source.title, "url": str(source.url), "authority": source.id}],
            "assumptions": ["Imported excerpt pending scientific/curriculum review"],
            "provenance": {"source_id": source.id, "book": source.title, "chapter": args.chapter,
                "section": header["section"], "license": source.license, "commit": source.commit,
                "source_language": "en", "level": "THPT"}}
        parts = section_blocks(text.strip())
        for number, part in enumerate(parts):
            item = json.loads(json.dumps(record))
            item.update(id=args.document_id if len(parts) == 1 else f"{args.document_id}-part-{number+1}",text=part)
            item["provenance"]["section"] = header["section"] + (f"#part-{number+1}" if len(parts) > 1 else "")
            raw["documents"].append(item)
        validated = Corpus.model_validate(raw)
        lint_corpus(validated, registry, args.labs)
        corpus_path.write_text(validated.model_dump_json(indent=2) + "\n", encoding="utf-8")
        return
    if args.command == "convert":
        if not all([args.source_id, args.git_dir, args.section_path, args.lab_id]):
            parser.error("convert requires source-id, git-dir, section-path and lab-id")
        source = registry.source(args.source_id)
        if not source.permits("convert"):
            raise SystemExit("SOURCE_CONVERSION_NOT_APPROVED: no source text was read")
        actual = subprocess.check_output(["git", "-C", str(args.git_dir), "rev-parse", "HEAD"], text=True).strip()
        if actual != source.commit:
            raise SystemExit("Source commit differs from registry")
        section = Path(args.section_path)
        if section.is_absolute() or ".." in section.parts or section.suffix not in {".cnxml", ".md", ".xml"}:
            raise SystemExit("Unsupported section path")
        text = subprocess.check_output(["git", "-C", str(args.git_dir), "show",
            source.commit + ":" + section.as_posix()], timeout=30).decode("utf-8")
        converted = convert_section(text, source=source, metadata={"lab_id": args.lab_id,
            "book": source.title, "section": section.as_posix(), "level": "THPT"}, cnxml=section.suffix != ".md")
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(converted, encoding="utf-8")
        return
    corpus = Corpus.model_validate_json((args.knowledge / "retrieval/documents.json").read_text(encoding="utf-8"))
    if args.mvp_only:
        corpus = corpus.model_copy(update={"documents": [d for d in corpus.documents
            if d.lab_id in registry.mvp_lab_ids]})
    issues = lint_corpus(corpus, registry, args.labs, strict=not args.include_drafts)
    if args.command == "lint":
        print(json.dumps({"revision": corpus.revision, "issues": issues}, ensure_ascii=False))
        if issues and not args.include_drafts:
            raise SystemExit(1)
        return
    config = VectorConfig.from_env()
    artifact = compile_artifact(corpus, registry, args.labs, include_drafts=args.include_drafts,
        commercial=args.commercial, provider=config.provider())
    if args.chroma is not None:
        from .vector_index import ChromaVectorStore
        vectors = {chunk["chunk_id"]: row for chunk, row in
                   zip(artifact["chunks"], artifact["vectors"], strict=True)}
        ChromaVectorStore(args.chroma, artifact["fingerprint"][:32], vectors)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(artifact, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    card = {"corpus_revision": corpus.revision, "fingerprint": artifact["fingerprint"],
        "chunks": len(artifact["chunks"]), "embedding_id": artifact["embedding_id"],
        "draft": args.include_drafts, "commercial": args.commercial,
        "review_counts": {status: sum(d.review_status == status for d in corpus.documents)
                          for status in ("draft", "cross_checked", "reviewed")},
        "excluded_external_sources": [s.id for s in registry.sources if not s.permits("index")],
        "limitations": ["No academic approval implied", "No automatic external ingestion",
                        "Semantic model requires separate quality review" if artifact["semantic"] else "Hash embedding is lexical, not semantic", "Chunk token count is estimated"]}
    args.output.with_name("data-card.json").write_text(json.dumps(card, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"chunks": len(artifact["chunks"]), "fingerprint": artifact["fingerprint"]}))


if __name__ == "__main__":
    main()
