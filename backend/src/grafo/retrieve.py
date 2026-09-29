"""Deterministic lexical retriever — mirrors lib/grafo/retrieve.ts."""

from __future__ import annotations

import re


def tokenize(text: str, stopwords: set[str]) -> set[str]:
    tokens = [t for t in re.split(r"[^a-z0-9]+", text.lower()) if t]
    return {t for t in tokens if t not in stopwords}


def lexical_score(query: str, text: str, stopwords: set[str]) -> int:
    q = tokenize(query, stopwords)
    doc = tokenize(text, stopwords)
    return sum(1 for t in q if t in doc)


def retrieve(query: str, chunks: list[dict], stopwords: set[str], k: int = 3) -> list[dict]:
    scored = [(c, lexical_score(query, c["text"], stopwords)) for c in chunks]
    scored.sort(key=lambda x: (-x[1], x[0]["id"]))
    return [c for c, _ in scored[:k]]


def best_score(query: str, chunks: list[dict], stopwords: set[str]) -> int:
    if not chunks:
        return 0
    return max(lexical_score(query, c["text"], stopwords) for c in chunks)
