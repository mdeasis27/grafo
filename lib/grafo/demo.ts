// lib/grafo/demo.ts
// Wires committed corpus → extraction → entity resolution → benchmark. Runs
// fully offline (no API keys, no model downloads) and produces every number
// the dashboard displays. This is the authoritative TypeScript harness.

import entitiesRaw from "./data/entities.json";
import corpusRaw from "./data/corpus.json";
import goldenRaw from "./data/golden.json";

import { extractTriples, triplesByChunk } from "./extract";
import { benchmark } from "./benchmark";
import { answerGraph, answerVector, findKeywords } from "./answer";
import { traceHops } from "./graph";
import { canonicalName, findMentions, resolveMention } from "./resolve";
import { ONTOLOGY } from "./ontology";
import type { Chunk, Entity, GoldenQuestion, Triple } from "./types";

const ENTITIES = entitiesRaw.entities as Entity[];
const CHUNKS = corpusRaw.chunks as Chunk[];
const GOLDEN = goldenRaw.questions as GoldenQuestion[];

const EXTRACTION = extractTriples(CHUNKS, ENTITIES);
const triples: readonly Triple[] = EXTRACTION.triples;

const REGISTRY = { entities: ENTITIES };

let memoBenchmark: ReturnType<typeof benchmark> | null = null;

export function getBenchmark() {
  if (!memoBenchmark) {
    memoBenchmark = benchmark(GOLDEN, REGISTRY, CHUNKS, triples, 3);
  }
  return memoBenchmark;
}

export function getExtractionStats() {
  return {
    triples: triples.length,
    chunks: CHUNKS.length,
    failures: EXTRACTION.failures,
    retries: EXTRACTION.retries,
    entities: ENTITIES.length,
    relationTypes: [...new Set(triples.map((t) => t.rel))].length,
  };
}

export function getCorpusStats() {
  return {
    nChunks: CHUNKS.length,
    nEntities: ENTITIES.length,
    nQuestions: GOLDEN.length,
  };
}

export function getDelta() {
  const bm = getBenchmark();
  return bm.graph.overall - bm.vector.overall;
}

const chunkTextById = new Map(CHUNKS.map((c) => [c.id, c.text]));
const BY_CHUNK = triplesByChunk(triples);

export function getWorkedExample() {
  const q = GOLDEN.find((x) => x.id === "q06")!;
  const keywords = findKeywords(q.text, ONTOLOGY.questionKeywords);
  const anchor = findMentions(q.text, REGISTRY)[0];
  const trace = traceHops(anchor, keywords.map((k) => ({ rel: k.rel, dir: k.dir })), triples);
  const graphAnswer = answerGraph(q.text, REGISTRY, triples);
  const vectorAnswer = answerVector(q.text, REGISTRY, CHUNKS, BY_CHUNK, 3);

  return {
    question: q.text,
    graph: {
      answer: graphAnswer,
      hops: trace.hops.map((h) => ({
        rel: h.rel,
        from: canonicalName(h.from, REGISTRY),
        to: canonicalName(h.to, REGISTRY),
        chunkId: h.chunkId,
        chunkText: chunkTextById.get(h.chunkId) ?? "",
      })),
    },
    vector: {
      answer: vectorAnswer,
    },
  };
}

const HOP_LABELS: Record<string, string> = {
  "1": "1-hop",
  "2": "2-hop",
  "3": "3-hop",
  agg: "Aggregation",
  oos: "Out-of-scope",
};

export function getHopLabels(): Record<string, string> {
  return HOP_LABELS;
}

export function getResolutionDemo() {
  const mentions = ["Acme Corp", "ACME", "Acme Corporation", "Acme Corrp", "Tesla"];
  return mentions.map((m) => {
    const id = resolveMention(m, REGISTRY);
    return { mention: m, node: id ? canonicalName(id, REGISTRY) : null, resolved: id !== null };
  });
}
