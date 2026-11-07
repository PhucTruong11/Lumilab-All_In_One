"""Local vector retrieval adapters. The default is feature hashing, not semantic AI.

Optional libraries are imported only when explicitly configured. Model identifiers
are never downloaded: sentence-transformers must point at an existing local model.
"""

import hashlib
import importlib
import json
import math
import os
import re
import unicodedata
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

STOP_WORDS = set("la va cua thi khi voi nhung mot cac cho minh ban em nay do sao vi gi".split())


def tokens(text: str) -> set[str]:
    normalized = unicodedata.normalize("NFD", text.lower().replace("đ", "d"))
    normalized = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return set(re.findall(r"[a-z0-9]+", normalized)) - STOP_WORDS


class VectorUnavailable(RuntimeError):
    """Configuration/dependency/model error; lexical retrieval remains available."""


class EmbeddingProvider(Protocol):
    id: str
    semantic: bool

    def encode(self, texts: Sequence[str]) -> list[list[float]]: ...


def normalized(vector: Sequence[float]) -> list[float]:
    if not vector or any(not math.isfinite(value) for value in vector):
        raise VectorUnavailable("Embedding must be nonempty and finite")
    scale = max(abs(value) for value in vector)
    scaled = [value / scale if scale else 0.0 for value in vector]
    norm = math.sqrt(sum(value * value for value in scaled))
    return [value / norm if norm else 0.0 for value in scaled]


class HashEmbedding:
    """Stable token hashing with L2 normalization; no language understanding."""

    semantic = False

    def __init__(self, dimensions: int = 512):
        if not 64 <= dimensions <= 4096:
            raise VectorUnavailable("Hash dimensions must be between 64 and 4096")
        self.dimensions = dimensions
        self.id = f"token-hash-v1-{dimensions}"

    def encode(self, texts: Sequence[str]) -> list[list[float]]:
        output = []
        for text in texts:
            vector = [0.0] * self.dimensions
            for token in tokens(text):
                digest = hashlib.sha256(token.encode("utf-8")).digest()
                index = int.from_bytes(digest[:8], "big") % self.dimensions
                vector[index] += 1.0 if digest[8] % 2 else -1.0
            output.append(normalized(vector))
        return output


class SentenceTransformerEmbedding:
    semantic = True

    def __init__(self, model_path: Path, revision: str, family: str = "generic"):
        if not model_path.is_dir() or not revision.strip():
            raise VectorUnavailable("A local model directory and explicit revision are required")
        try:
            module = importlib.import_module("sentence_transformers")
            self.model = module.SentenceTransformer(
                str(model_path.resolve()), device="cpu", local_files_only=True,
                trust_remote_code=False,
            )
        except (ImportError, OSError, RuntimeError, ValueError) as exc:
            raise VectorUnavailable("Local sentence-transformers model unavailable") from exc
        if family not in {"generic", "e5"}:
            raise VectorUnavailable("Unsupported embedding prompt family")
        self.family = family
        # Revision is operator-controlled: change it whenever local weights change.
        self.id = f"sentence-transformers:{revision}:{family}"

    def encode_query(self, texts: Sequence[str]) -> list[list[float]]:
        return self.encode(["query: " + text for text in texts] if self.family == "e5" else texts)

    def chunk_text(self, text: str, max_tokens: int = 300) -> list[str]:
        """Bound actual embedding tokens, including passage prefix/special tokens."""
        if not 200 <= max_tokens <= 400:
            raise ValueError("Unsupported token limit")
        tokenizer = self.model.tokenizer
        budget = min(max_tokens, self.model.max_seq_length) - 8
        if budget < 40:
            raise VectorUnavailable("Embedding context too short")
        ids = tokenizer.encode(text, add_special_tokens=False)
        chunks = []
        for start in range(0, len(ids), budget - 30):
            chunks.append(tokenizer.decode(ids[start:start + budget], skip_special_tokens=True))
            if start + budget >= len(ids):
                break
        return chunks

    def encode_documents(self, texts: Sequence[str]) -> list[list[float]]:
        return self.encode(["passage: " + text for text in texts] if self.family == "e5" else texts)

    def encode(self, texts: Sequence[str]) -> list[list[float]]:
        if not texts:
            return []
        result = self.model.encode(
            list(texts), normalize_embeddings=True, show_progress_bar=False,
        )
        return [normalized(row.tolist()) for row in result]


@dataclass(frozen=True)
class VectorConfig:
    embedder: str = "hash"
    store: str = "memory"
    model_path: Path | None = None
    model_revision: str = ""
    model_family: str = "generic"
    chroma_path: Path | None = None
    max_chunks: int = 10000

    @classmethod
    def from_env(cls) -> "VectorConfig":
        model_path = os.environ.get("LUMILAB_RETRIEVAL_MODEL_PATH")
        chroma_path = os.environ.get("LUMILAB_RETRIEVAL_CHROMA_PATH")
        return cls(
            embedder=os.environ.get("LUMILAB_RETRIEVAL_EMBEDDER", "hash"),
            store=os.environ.get("LUMILAB_RETRIEVAL_STORE", "memory"),
            model_path=Path(model_path) if model_path else None,
            model_revision=os.environ.get("LUMILAB_RETRIEVAL_MODEL_REVISION", ""),
            model_family=os.environ.get("LUMILAB_RETRIEVAL_MODEL_FAMILY", "generic"),
            chroma_path=Path(chroma_path) if chroma_path else None,
        )

    def provider(self) -> EmbeddingProvider:
        if self.embedder == "hash":
            return HashEmbedding()
        if self.embedder == "sentence-transformers" and self.model_path is not None:
            return SentenceTransformerEmbedding(self.model_path, self.model_revision, self.model_family)
        raise VectorUnavailable("Unsupported embedder or missing local model configuration")


class VectorStore(Protocol):
    def rank(self, query: Sequence[float], allowed_ids: set[str], limit: int) -> list[tuple[float, str]]:
        ...


class MemoryVectorStore:
    def __init__(self, vectors: Mapping[str, Sequence[float]]):
        self.vectors = {key: normalized(value) for key, value in vectors.items()}
        self.dimensions = len(next(iter(self.vectors.values()), []))
        if any(len(row) != self.dimensions for row in self.vectors.values()):
            raise VectorUnavailable("Inconsistent embedding dimensions")

    def rank(self, query: Sequence[float], allowed_ids: set[str], limit: int) -> list[tuple[float, str]]:
        query = normalized(query)
        if self.vectors and len(query) != self.dimensions:
            raise VectorUnavailable("Query embedding dimension differs from index")
        scores = [
            (sum(a * b for a, b in zip(query, row, strict=True)), key)
            for key, row in self.vectors.items() if key in allowed_ids
        ]
        return sorted(scores, key=lambda row: (-row[0], row[1]))[:limit]


class ChromaVectorStore:
    def __init__(self, path: Path, fingerprint: str, vectors: Mapping[str, Sequence[float]]):
        try:
            chromadb = importlib.import_module("chromadb")
            # Avoid telemetry and any default embedding function/model download.
            settings = chromadb.config.Settings(anonymized_telemetry=False)
            self.client = chromadb.PersistentClient(path=str(path), settings=settings)
            self.collection = self.client.get_or_create_collection(
                name=f"lumilab-{fingerprint}", embedding_function=None,
                metadata={"hnsw:space": "cosine"},
            )
            items = list(vectors.items())
            for start in range(0, len(items), 100):
                batch = items[start:start + 100]
                self.collection.upsert(
                    ids=[key for key, _ in batch],
                    embeddings=[list(row) for _, row in batch],
                    metadatas=[{"chunk_id": key} for key, _ in batch],
                )
        except (ImportError, OSError, RuntimeError, ValueError) as exc:
            raise VectorUnavailable("Local Chroma store unavailable") from exc

    def rank(self, query: Sequence[float], allowed_ids: set[str], limit: int) -> list[tuple[float, str]]:
        if not allowed_ids:
            return []
        try:
            result = self.collection.query(
                query_embeddings=[list(query)], n_results=min(limit, len(allowed_ids)),
                where={"chunk_id": {"$in": sorted(allowed_ids)}}, include=["distances"],
            )
            rows = [(1.0 - distance, key) for key, distance in zip(
                result["ids"][0], result["distances"][0], strict=True,
            ) if key in allowed_ids]
            if any(not math.isfinite(score) for score, _ in rows):
                raise VectorUnavailable("Nonfinite vector similarity")
            return sorted(rows, key=lambda row: (-row[0], row[1]))
        except (KeyError, IndexError, TypeError, ValueError) as exc:
            raise VectorUnavailable("Malformed local vector response") from exc


class LocalVectorIndex:
    def __init__(
        self, texts: Mapping[str, str], corpus_revision: str, config: VectorConfig,
        provider: EmbeddingProvider | None = None,
    ):
        if len(texts) > config.max_chunks:
            raise VectorUnavailable("Corpus exceeds configured local vector chunk limit")
        self.provider = provider or config.provider()
        self.method = "local-semantic-vector" if self.provider.semantic else "local-hash-vector"
        fingerprint_data = [corpus_revision, self.provider.id, sorted(texts.items())]
        self.fingerprint = hashlib.sha256(
            json.dumps(fingerprint_data, ensure_ascii=False).encode("utf-8"),
        ).hexdigest()[:32]
        rows = getattr(self.provider, "encode_documents", self.provider.encode)(list(texts.values()))
        if len(rows) != len(texts):
            raise VectorUnavailable("Embedding count differs from chunk count")
        vectors = {key: normalized(row) for key, row in zip(texts, rows, strict=True)}
        dimensions = len(next(iter(vectors.values()), []))
        if any(len(row) != dimensions for row in vectors.values()):
            raise VectorUnavailable("Inconsistent embedding dimensions")
        self.dimensions = dimensions
        if config.store == "memory":
            self.store: VectorStore = MemoryVectorStore(vectors)
        elif config.store == "chroma" and config.chroma_path is not None:
            self.store = ChromaVectorStore(config.chroma_path, self.fingerprint, vectors)
        else:
            raise VectorUnavailable("Unsupported vector store or missing local Chroma path")

    def rank(self, query: str, allowed_ids: set[str], limit: int = 3) -> list[tuple[float, str]]:
        if not allowed_ids:
            return []
        rows = getattr(self.provider, "encode_query", self.provider.encode)([query])
        if len(rows) != 1 or len(rows[0]) != self.dimensions:
            raise VectorUnavailable("Invalid query embedding shape")
        return self.store.rank(normalized(rows[0]), allowed_ids, limit)
