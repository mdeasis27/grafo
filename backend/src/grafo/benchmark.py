"""Benchmark — mirrors lib/grafo/benchmark.ts.

Accuracy broken out by hop count for graph RAG vs a vector-only single-passage
reader baseline.
"""

from __future__ import annotations

from .answer import answer_graph, answer_vector
from .extract import triples_by_chunk

_BUCKETS = ["1", "2", "3", "agg", "oos"]


def _summarize(correct: int, total: int) -> float:
    return correct / total if total else 0.0


def benchmark(golden: list[dict], entities: list[dict], chunks: list[dict], triples: list[dict], ontology: dict, k: int = 3) -> dict:
    by_chunk = triples_by_chunk(triples)
    graph_correct = {b: 0 for b in _BUCKETS}
    vector_correct = {b: 0 for b in _BUCKETS}
    totals = {b: 0 for b in _BUCKETS}

    for q in golden:
        ga = answer_graph(q["text"], entities, triples, ontology)
        va = answer_vector(q["text"], entities, chunks, by_chunk, ontology, k)
        g_ok = (ga is None) if q["gold"] is None else (ga == q["gold"])
        v_ok = (va is None) if q["gold"] is None else (va == q["gold"])
        totals[q["hops"]] += 1
        if g_ok:
            graph_correct[q["hops"]] += 1
        if v_ok:
            vector_correct[q["hops"]] += 1

    graph_by_hop = {b: {"correct": graph_correct[b], "total": totals[b], "accuracy": _summarize(graph_correct[b], totals[b])} for b in _BUCKETS}
    vector_by_hop = {b: {"correct": vector_correct[b], "total": totals[b], "accuracy": _summarize(vector_correct[b], totals[b])} for b in _BUCKETS}

    g_total = sum(graph_correct.values())
    v_total = sum(vector_correct.values())
    n = len(golden)

    return {
        "graph": {"overall": _summarize(g_total, n), "byHop": graph_by_hop},
        "vector": {"overall": _summarize(v_total, n), "byHop": vector_by_hop},
        "n": n,
        "buckets": _BUCKETS,
    }
