import json
from pathlib import Path

import pytest

from grafo.answer import answer_graph, answer_vector
from grafo.benchmark import benchmark
from grafo.extract import extract_triples, triples_by_chunk
from grafo.resolve import resolve_mention

FIXTURES = Path(__file__).parent / "fixtures"


def _load(name: str):
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def _entities():
    return _load("entities.json")["entities"]


def _chunks():
    return _load("corpus.json")["chunks"]


def _golden():
    return _load("golden.json")["questions"]


def _ontology():
    return _load("ontology.json")


def test_resolution_matches_fixture():
    entities = _entities()
    for case in _load("resolution.json")["cases"]:
        assert resolve_mention(case["mention"], entities) == case["expected"]


def test_extraction_is_deterministic_and_complete():
    result = extract_triples(_chunks(), _entities(), _ontology())
    assert len(result["triples"]) == 15
    assert result["failures"] == 0
    assert result["retries"] == 0


def test_extraction_retries_unknown_verb():
    chunk = {"id": "x01", "docId": "d", "section": "s", "text": "Organization A purchased Organization B."}
    result = extract_triples([chunk], _entities(), _ontology())
    assert len(result["triples"]) == 1
    assert result["triples"][0]["rel"] == "ACQUIRED"
    assert result["retries"] == 1


def test_answer_graph_matches_gold():
    entities = _entities()
    triples = extract_triples(_chunks(), entities, _ontology())["triples"]
    for q in _golden():
        assert answer_graph(q["text"], entities, triples, _ontology()) == q["gold"]


def test_answer_vector_parity_and_limits():
    entities = _entities()
    chunks = _chunks()
    ontology = _ontology()
    triples = extract_triples(chunks, entities, ontology)["triples"]
    by_chunk = triples_by_chunk(triples)
    for q in _golden():
        got = answer_vector(q["text"], entities, chunks, by_chunk, ontology, 3)
        if q["hops"] == "1":
            assert got == q["gold"]
        else:
            assert got is None


def test_benchmark_matches_fixture():
    entities = _entities()
    chunks = _chunks()
    ontology = _ontology()
    triples = extract_triples(chunks, entities, ontology)["triples"]
    fixture = _load("benchmark.json")

    result = benchmark(_golden(), entities, chunks, triples, ontology, 3)
    assert result["n"] == fixture["n"]
    assert result["graph"]["overall"] == pytest.approx(fixture["graph"]["overall"], abs=1e-9)
    assert result["vector"]["overall"] == pytest.approx(fixture["vector"]["overall"], abs=1e-9)
    for b in ["1", "2", "3", "agg", "oos"]:
        assert result["graph"]["byHop"][b]["accuracy"] == pytest.approx(fixture["graph"]["byHop"][b], abs=1e-9)
        assert result["vector"]["byHop"][b]["accuracy"] == pytest.approx(fixture["vector"]["byHop"][b], abs=1e-9)


def test_answer_graph_link_cap_matches_fixture():
    entities = _entities()
    triples = extract_triples(_chunks(), entities, _ontology())["triples"]
    for cap, answers in _load("hops.json")["answers"].items():
        assert [answer_graph(q["text"], entities, triples, _ontology(), int(cap)) for q in _golden()] == answers
    q09 = next(q for q in _golden() if q["id"] == "q09")
    assert answer_graph(q09["text"], entities, triples, _ontology(), None) == q09["gold"]
