// lib/grafo/benchmark.ts
// Graph RAG vs vector-only baseline, accuracy broken out by hop count. The
// vector baseline is a single-passage reader: it can answer one-hop lookups
// (parity) but structurally cannot chain hops or count, which is exactly the
// curve a graph RAG demo is meant to show. Mirrors backend/src/grafo/benchmark.py.

import { answerGraph, answerVector } from "./answer";
import { triplesByChunk } from "./extract";
import type { Chunk, GoldenQuestion, Triple } from "./types";

interface Registry {
  entities: { id: string; type: string; name: string; aliases: string[] }[];
}

export interface BucketStat {
  correct: number;
  total: number;
  accuracy: number;
}

export interface PathResult {
  overall: number;
  byHop: Record<string, BucketStat>;
}

export interface BenchmarkResult {
  graph: PathResult;
  vector: PathResult;
  n: number;
  buckets: string[];
}

function emptyBuckets(buckets: string[]): Record<string, BucketStat> {
  const out: Record<string, BucketStat> = {};
  for (const b of buckets) out[b] = { correct: 0, total: 0, accuracy: 0 };
  return out;
}

function summarize(correct: number, total: number): number {
  return total === 0 ? 0 : correct / total;
}

export function benchmark(
  golden: readonly GoldenQuestion[],
  registry: Registry,
  chunks: readonly Chunk[],
  triples: readonly Triple[],
  k = 3,
): BenchmarkResult {
  const buckets = ["1", "2", "3", "agg", "oos"];
  const byChunk = triplesByChunk(triples);

  const graphCorrect: Record<string, number> = {};
  const vectorCorrect: Record<string, number> = {};
  const totals: Record<string, number> = {};
  for (const b of buckets) {
    graphCorrect[b] = 0;
    vectorCorrect[b] = 0;
    totals[b] = 0;
  }

  for (const q of golden) {
    const ga = answerGraph(q.text, registry, triples);
    const va = answerVector(q.text, registry, chunks, byChunk, k);
    const gCorrect = q.gold === null ? ga === null : ga === q.gold;
    const vCorrect = q.gold === null ? va === null : va === q.gold;
    totals[q.hops] += 1;
    if (gCorrect) graphCorrect[q.hops] += 1;
    if (vCorrect) vectorCorrect[q.hops] += 1;
  }

  const graphByHop = emptyBuckets(buckets);
  const vectorByHop = emptyBuckets(buckets);
  let gTotal = 0;
  let vTotal = 0;
  for (const b of buckets) {
    graphByHop[b] = {
      correct: graphCorrect[b],
      total: totals[b],
      accuracy: summarize(graphCorrect[b], totals[b]),
    };
    vectorByHop[b] = {
      correct: vectorCorrect[b],
      total: totals[b],
      accuracy: summarize(vectorCorrect[b], totals[b]),
    };
    gTotal += graphCorrect[b];
    vTotal += vectorCorrect[b];
  }

  return {
    graph: { overall: summarize(gTotal, golden.length), byHop: graphByHop },
    vector: { overall: summarize(vTotal, golden.length), byHop: vectorByHop },
    n: golden.length,
    buckets,
  };
}
