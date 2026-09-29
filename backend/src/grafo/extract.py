"""Deterministic extraction pass — mirrors lib/grafo/extract.ts.

Validates every triple against the constrained ontology and retries sentences
with an unknown verb through a synonym map.
"""

from __future__ import annotations

import re

from .resolve import find_mentions, normalize


def validate_triple(triple: dict, entities: list[dict], entity_types: list[str], relation_types: list[str]) -> str | None:
    ids = {e["id"]: e for e in entities}
    head = ids.get(triple["head"])
    tail = ids.get(triple["tail"])
    if not head or head["type"] not in entity_types:
        return f"unknown head type: {triple['head']}"
    if not tail or tail["type"] not in entity_types:
        return f"unknown tail type: {triple['tail']}"
    if triple["rel"] not in relation_types:
        return f"unknown relation: {triple['rel']}"
    if not 0 <= triple["confidence"] <= 1:
        return f"bad confidence: {triple['confidence']}"
    if not triple["chunkId"]:
        return "missing chunk id"
    return None


def _mention_in(text: str, entities: list[dict], last: bool) -> str | None:
    ids = find_mentions(text, entities)
    if not ids:
        return None
    return ids[-1] if last else ids[0]


def _resolve_side(text: str, entities: list[dict]) -> tuple[str, float] | None:
    eid = _mention_in(text, entities, True)
    if eid:
        return eid, 1.0
    t = text.lower()
    for e in entities:
        for candidate in [e["name"], *e["aliases"]]:
            if candidate and candidate.lower() in t:
                return e["id"], 0.8
    return None


def extract_triples(chunks: list[dict], entities: list[dict], ontology: dict) -> dict:
    triples: list[dict] = []
    failures = 0
    retries = 0
    pending: list[tuple[dict, str]] = []

    phrases = ontology["relationPhrases"]
    synonyms = ontology["relationSynonyms"]
    entity_types = ontology["entityTypes"]
    relation_types = ontology["relationTypes"]

    for chunk in chunks:
        sentences = [s.strip() for s in re.split(r"[.!?]+", chunk["text"]) if s.strip()]
        for sentence in sentences:
            sl = sentence.lower()
            matched = next((p for p in phrases if p["phrase"] in sl), None)
            if not matched:
                pending.append((chunk, sentence))
                continue
            idx = sl.index(matched["phrase"])
            subject_text = sentence[:idx]
            object_text = sentence[idx + len(matched["phrase"]):]
            head = _resolve_side(subject_text, entities)
            tail = _resolve_side(object_text, entities)
            if not head or not tail:
                failures += 1
                continue
            triple = {
                "head": head[0],
                "rel": matched["relation"],
                "tail": tail[0],
                "chunkId": chunk["id"],
                "confidence": min(head[1], tail[1]),
            }
            if validate_triple(triple, entities, entity_types, relation_types) is not None:
                failures += 1
                continue
            triples.append(triple)

    for chunk, sentence in pending:
        sl = sentence.lower()
        synonym_key = next((k for k in synonyms if k in sl), None)
        if not synonym_key:
            failures += 1
            continue
        rel = synonyms[synonym_key]
        idx = sl.index(synonym_key)
        subject_text = sentence[:idx]
        object_text = sentence[idx + len(synonym_key):]
        head = _resolve_side(subject_text, entities)
        tail = _resolve_side(object_text, entities)
        if not head or not tail:
            failures += 1
            continue
        triple = {
            "head": head[0],
            "rel": rel,
            "tail": tail[0],
            "chunkId": chunk["id"],
            "confidence": min(head[1], tail[1], 0.7),
        }
        if validate_triple(triple, entities, entity_types, relation_types) is not None:
            failures += 1
            continue
        triples.append(triple)
        retries += 1

    return {"triples": triples, "failures": failures, "retries": retries}


def triples_by_chunk(triples: list[dict]) -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {}
    for t in triples:
        out.setdefault(t["chunkId"], []).append(t)
    return out
