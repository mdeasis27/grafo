"""Answer paths — mirrors lib/grafo/answer.ts.

answer_graph traverses the graph; answer_vector reads a single fact off a
retrieved chunk (shared chunk id) and cannot chain or count.
"""

from __future__ import annotations

from .graph import sources, targets, traverse
from .resolve import canonical_name, find_mentions
from .retrieve import retrieve


def is_aggregation(question: str, agg_triggers: list[str]) -> bool:
    q = question.lower()
    return any(t in q for t in agg_triggers)


def find_keywords(question: str, table: list[dict]) -> list[dict]:
    q = question.lower()
    hits: list[tuple[int, dict]] = []
    for kw in table:
        idx = q.find(kw["key"])
        if idx >= 0:
            hits.append((idx, kw))
    hits.sort(key=lambda x: x[0])
    return [kw for _, kw in hits]


def answer_graph(question: str, entities: list[dict], triples: list[dict], ontology: dict) -> str | None:
    if is_aggregation(question, ontology["aggTriggers"]):
        q = question.lower()
        agg_kw = next((k for k in ontology["aggKeywords"] if k["key"] in q), None)
        if not agg_kw:
            return None
        mentions = find_mentions(question, entities)
        anchor = mentions[0] if mentions else None
        if not anchor:
            return None
        neighbors = targets(anchor, agg_kw["rel"], triples) if agg_kw["dir"] == "out" else sources(anchor, agg_kw["rel"], triples)
        return str(len(set(neighbors)))

    keywords = find_keywords(question, ontology["questionKeywords"])
    if not keywords:
        return None
    mentions = find_mentions(question, entities)
    anchor = mentions[0] if mentions else None
    if not anchor:
        return None

    node = traverse(anchor, [{"rel": k["rel"], "dir": k["dir"]} for k in keywords], triples)
    if node is None:
        return None
    return canonical_name(node, entities)


def answer_vector(question: str, entities: list[dict], chunks: list[dict], by_chunk: dict[str, list[dict]], ontology: dict, k: int = 3) -> str | None:
    if is_aggregation(question, ontology["aggTriggers"]):
        return None
    keywords = find_keywords(question, ontology["questionKeywords"])
    if len(keywords) != 1:
        return None
    kw = keywords[0]
    mentions = find_mentions(question, entities)
    anchor = mentions[0] if mentions else None
    if not anchor:
        return None

    for chunk in retrieve(question, chunks, set(ontology["stopwords"]), k):
        for t in by_chunk.get(chunk["id"], []):
            if t["rel"] != kw["rel"]:
                continue
            if kw["dir"] == "out" and t["head"] == anchor:
                return canonical_name(t["tail"], entities)
            if kw["dir"] == "in" and t["tail"] == anchor:
                return canonical_name(t["head"], entities)
    return None
