# Grafo

**Knowledge-graph RAG with entity resolution and a graph-vs-vector benchmark** —
constrained ontology, deterministic extraction, alias + trigram entity resolution, and
parameterized graph traversals that cite their source chunk per hop.

> **Result:** Graph RAG raises multi-hop accuracy from **0% to 100%** against a
> vector-only single-passage baseline, with **parity at 1-hop (100% vs 100%)**. Overall:
> **100% graph vs 53.8% vector** on 13 questions stratified by hop count (1/2/3-hop,
> aggregation, out-of-scope). The graph cites a real chunk id per hop; the vector
> baseline returns `null` on anything that requires crossing chunks.

---

## Result

### Accuracy by hop count (n = 13)

| Difficulty | Graph RAG | Vector-only | Δ |
|---|---|---|---|
| 1-hop | 100% | 100% | — |
| 2-hop | 100% | 0% | **+100pp** |
| 3-hop | 100% | 0% | **+100pp** |
| Aggregation | 100% | 0% | **+100pp** |
| Out-of-scope | 100% | 100% | — |
| **Overall** | **100%** | **53.8%** | **+46pp** |

The curve is the story: parity on single-fact questions, and a widening gap as hops
increase. The vector-only baseline is a *single-passage reader* — it retrieves chunks and
reads the one fact stored on a chunk (via the shared chunk id) but has no graph, so it
structurally cannot chain hops or count.

### Entity resolution

`"Acme Corp"`, `"ACME"`, `"Acme Corporation"` and the typo `"Acme Corrp"` all collapse to
one node. Three passes: exact canonical name → alias list → trigram similarity over a
tuned threshold (0.6). Unknown entities (`"Tesla"`, `"Oracle"`) resolve to `null`.

### Extraction (schema + retry)

15 triples extracted from 15 chunks with **0 failures, 0 retries** on the clean corpus.
An unknown verb (`"purchased"`) is recovered through a synonym map (documented retry path).

---

## Architecture

```
lib/grafo/              # canonical core (TypeScript, tested)
  ontology.ts           #   constrained schema loaded from data/ontology.json
  resolve.ts            #   normalize · trigram similarity · resolveMention · findMentions
  extract.ts            #   deterministic extraction + schema validation + synonym retry
  graph.ts              #   in-memory directed graph (Neo4j proxy) · targets/sources · traverse
  retrieve.ts           #   deterministic lexical retriever (embedding proxy)
  answer.ts             #   answerGraph (traversal) · answerVector (single-passage baseline)
  benchmark.ts          #   accuracy broken out by hop count
  demo.ts               #   wires corpus → extraction → resolution → benchmark
  data/                 #   entities, corpus, golden questions, ontology (committed)
  fixtures/             #   resolution.json + benchmark.json (shared math, pinned)
backend/                # same math in Python + pytest (authoritative)
  src/grafo/            #   resolve.py · extract.py · graph.py · retrieve.py · answer.py · benchmark.py
  tests/                #   pinned to tests/fixtures/{resolution,benchmark}.json
app/                    # Next.js landing + demo dashboard (Vercel, demo mode)
```

The graph and the vector index share the **same chunk id** — that cross-key lets the
traversal cite the sentence that justified each hop, and lets the baseline read a chunk's
fact without being able to traverse.

## Design decisions & tradeoffs

1. **Entity resolution is the centerpiece.** Most RAG demos skip it and end up with the same
   company as four disconnected nodes. The demo shows the exact→alias→similarity ladder, with
   the similarity threshold (0.6, trigram Jaccard) documented and fixture-pinned.
2. **The vector baseline is a single-passage reader, not a strawman.** It is exactly what a
   pure-retrieval RAG without a reasoning layer can do. The 0% on 2+ hops is honest: chaining
   and counting are graph operations.
3. **Deterministic demo, no model.** The graph is in-memory (documented Neo4j proxy; Neo4j
   can't run on Vercel), extraction is rule-based (LLM proxy), and retrieval is lexical
   (embedding proxy). Live mode swaps each behind the same interface via `ai-kit`.

## What did not work

- **The 0% is a ceiling effect of a synthetic corpus.** On real, messy text the vector
  baseline would occasionally surface a connecting chunk by lexical luck; the demo's
  controlled corpus isolates the *structural* difference (traversal vs single-passage) rather
  than the noisy real-world middle ground.
- **The lexical retriever has no stemming**, so `"competitor"` never matches `"competes"`.
  That's a *feature* of the demo — it makes the synonym-blindness of lexical retrieval visible
  — but a real embedder would close part of the gap.

## Run it

```bash
# frontend demo + TS tests
pnpm install && pnpm dev      # http://localhost:3000
pnpm test                     # 48 vitest tests

# backend (authoritative math) — Python 3.12+
cd backend && uv sync --extra dev && uv run pytest   # 6 tests, pinned fixtures
```

## Stack

Next.js 16 · TypeScript · Vitest · Tailwind v4 · Python 3.13 · pytest
