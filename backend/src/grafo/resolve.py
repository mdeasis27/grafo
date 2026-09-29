"""Entity resolution — mirrors lib/grafo/resolve.ts.

"Acme Corp", "ACME" and "Acme Corporation" must collapse into one node. Three
passes: exact canonical name, alias list, then trigram similarity over a tuned
threshold.
"""

from __future__ import annotations

import re

_DEFAULT_THRESHOLD = 0.6


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _trigrams(s: str) -> set[str]:
    return {s[i : i + 3] for i in range(len(s) - 2)}


def trigram_similarity(a: str, b: str) -> float:
    a = a.replace(" ", "")
    b = b.replace(" ", "")
    A = _trigrams(a)
    B = _trigrams(b)
    if not A or not B:
        return 0.0
    inter = len(A & B)
    union = len(A | B)
    return inter / union if union else 0.0


def resolve_mention(mention: str, entities: list[dict], threshold: float = _DEFAULT_THRESHOLD) -> str | None:
    m = normalize(mention)

    for e in entities:
        if normalize(e["name"]) == m:
            return e["id"]
    for e in entities:
        for a in e["aliases"]:
            if normalize(a) == m:
                return e["id"]

    best_id = None
    best_score = 0.0
    for e in entities:
        for candidate in [e["name"], *e["aliases"]]:
            score = trigram_similarity(m, normalize(candidate))
            if score > best_score:
                best_score = score
                best_id = e["id"]
    return best_id if best_score >= threshold else None


def find_mentions(text: str, entities: list[dict]) -> list[str]:
    q = text.lower()
    found: list[tuple[int, str]] = []
    for e in entities:
        best = float("inf")
        for candidate in [e["name"], *e["aliases"]]:
            pattern = re.compile(r"\b" + re.escape(candidate.lower()) + r"\b")
            m = pattern.search(q)
            if m and m.start() < best:
                best = m.start()
        if best != float("inf"):
            found.append((best, e["id"]))

    found.sort(key=lambda x: (x[0], x[1]))
    seen: set[str] = set()
    ids: list[str] = []
    for _, eid in found:
        if eid not in seen:
            seen.add(eid)
            ids.append(eid)
    return ids


def canonical_name(eid: str, entities: list[dict]) -> str | None:
    for e in entities:
        if e["id"] == eid:
            return e["name"]
    return None
