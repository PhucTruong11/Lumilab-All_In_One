"""Serializable BM25 postings. Query only ranks prebuilt, eligible records."""
import math
from collections import Counter

from .retrieval_terms import PROFILE, words


class BM25Index:
    def __init__(self, data: dict):
        if (data.get("version") != "bm25-postings-v1" or not isinstance(data.get("lengths"), dict)
                or not isinstance(data.get("postings"), dict)):
            raise ValueError("Malformed BM25 artifact")
        lengths, totals = data["lengths"], Counter()
        if any(not isinstance(k, str) or type(n) is not int or n < 0 for k, n in lengths.items()):
            raise ValueError("Invalid BM25 document length")
        for term, posting in data["postings"].items():
            if not isinstance(term, str) or not isinstance(posting, dict):
                raise ValueError("Invalid BM25 posting")
            for key, count in posting.items():
                if key not in lengths or type(count) is not int or count <= 0:
                    raise ValueError("Invalid BM25 posting count")
                totals[key] += count
        if any(totals[key] != n for key, n in lengths.items()):
            raise ValueError("BM25 length/posting mismatch")
        self.data = data
        self.lengths = data["lengths"]
        self.postings = data["postings"]
        self.profile = data.get('profile', 'legacy')

    @classmethod
    def build(cls, texts: dict[str, str]):
        postings, lengths = {}, {}
        for key, text in sorted(texts.items()):
            counts = Counter(words(text))
            lengths[key] = sum(counts.values())
            for term, count in sorted(counts.items()):
                postings.setdefault(term, {})[key] = count
        return cls({"version":"bm25-postings-v1", "profile":PROFILE, "lengths":lengths, "postings":postings})

    def rank(self, query: str, allowed: set[str]) -> list[tuple[float, str]]:
        allowed = allowed & self.lengths.keys()
        if not allowed:
            return []
        # Use only eligible documents for DF and average length.
        mean = sum(self.lengths[key] for key in allowed) / len(allowed) or 1
        scores = Counter()
        for term in set(words(query)):
            candidates = {key: n for key, n in self.postings.get(term, {}).items() if key in allowed}
            inverse = math.log(1 + (len(allowed) - len(candidates) + .5) / (len(candidates) + .5))
            for key, n in candidates.items():
                scores[key] += inverse * n * 2.5 / (n + 1.5 * (.25 + .75 * self.lengths[key] / mean))
        return sorted(((score, key) for key, score in scores.items()), key=lambda x: (-x[0], x[1]))

    def coverage(self, query: str, key: str) -> float:
        terms = set(words(query))
        return sum(key in self.postings.get(term, {}) for term in terms) / max(1, len(terms))
