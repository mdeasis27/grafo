"""In-memory directed graph — mirrors lib/grafo/graph.ts."""

from __future__ import annotations


def targets(node: str, rel: str, triples: list[dict]) -> list[str]:
    return [t["tail"] for t in triples if t["head"] == node and t["rel"] == rel]


def sources(node: str, rel: str, triples: list[dict]) -> list[str]:
    return [t["head"] for t in triples if t["tail"] == node and t["rel"] == rel]


def _pick(ids: list[str]) -> str | None:
    return sorted(ids)[0] if ids else None


def traverse(start: str, hops: list[dict], triples: list[dict]) -> str | None:
    current = start
    for hop in hops:
        neighbors = targets(current, hop["rel"], triples) if hop["dir"] == "out" else sources(current, hop["rel"], triples)
        nxt = _pick(neighbors)
        if nxt is None:
            return None
        current = nxt
    return current


def traversal_chunk_ids(start: str, hops: list[dict], triples: list[dict]) -> list[str]:
    ids: list[str] = []
    current = start
    for hop in hops:
        if hop["dir"] == "out":
            candidates = [t for t in triples if t["head"] == current and t["rel"] == hop["rel"]]
        else:
            candidates = [t for t in triples if t["tail"] == current and t["rel"] == hop["rel"]]
        if not candidates:
            return []
        chosen = sorted(candidates, key=lambda t: (t["tail"], t["head"]))[0]
        ids.append(chosen["chunkId"])
        current = chosen["tail"] if hop["dir"] == "out" else chosen["head"]
    return ids
