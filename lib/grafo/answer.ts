// lib/grafo/answer.ts
// Two answer paths over the SAME graph (built from extracted triples):
//   answerGraph — traverses the graph with parameterized hops.
//   answerVector — the vector-only baseline: retrieves chunks, then reads the
//     single fact stored on a retrieved chunk (via the shared chunk id). It has
//     no graph, so it cannot chain hops or count.
// Mirrors backend/src/grafo/answer.py.

import { ONTOLOGY } from "./ontology";
import { canonicalName, findMentions } from "./resolve";
import { sources, targets, traverse } from "./graph";
import { retrieve } from "./retrieve";
import type { Chunk, Ontology, QuestionKeyword, Triple } from "./types";

interface Registry {
  entities: { id: string; type: string; name: string; aliases: string[] }[];
}

function isAggregation(question: string): boolean {
  const q = question.toLowerCase();
  return ONTOLOGY.aggTriggers.some((t) => q.includes(t));
}

export function findKeywords(question: string, table: readonly QuestionKeyword[]): QuestionKeyword[] {
  const q = question.toLowerCase();
  const hits: { kw: QuestionKeyword; idx: number }[] = [];
  for (const kw of table) {
    const idx = q.indexOf(kw.key);
    if (idx >= 0) hits.push({ kw, idx });
  }
  hits.sort((a, b) => a.idx - b.idx);
  return hits.map((h) => h.kw);
}

export function answerGraph(
  question: string,
  registry: Registry,
  triples: readonly Triple[],
  maxHops = Number.POSITIVE_INFINITY,
): string | null {
  // An aggregation counts neighbors over one relation: it needs one link.
  if (isAggregation(question)) {
    if (maxHops < 1) return null;
    const q = question.toLowerCase();
    const aggKw = ONTOLOGY.aggKeywords.find((k) => q.includes(k.key));
    if (!aggKw) return null;
    const anchor = findMentions(question, registry)[0] ?? null;
    if (!anchor) return null;
    const neighbors = aggKw.dir === "out"
      ? targets(anchor, aggKw.rel, triples)
      : sources(anchor, aggKw.rel, triples);
    return String(new Set(neighbors).size);
  }

  const keywords = findKeywords(question, ONTOLOGY.questionKeywords);
  if (keywords.length === 0) return null;
  // Refuse when the question needs more links than the cap allows.
  if (keywords.length > maxHops) return null;
  const anchor = findMentions(question, registry)[0] ?? null;
  if (!anchor) return null;

  const node = traverse(anchor, keywords.map((k) => ({ rel: k.rel, dir: k.dir })), triples);
  if (node === null) return null;
  return canonicalName(node, registry);
}

export function answerVector(
  question: string,
  registry: Registry,
  chunks: readonly Chunk[],
  byChunk: Map<string, Triple[]>,
  k = 3,
): string | null {
  if (isAggregation(question)) return null;
  const keywords = findKeywords(question, ONTOLOGY.questionKeywords);
  if (keywords.length !== 1) return null;
  const kw = keywords[0];
  const anchor = findMentions(question, registry)[0] ?? null;
  if (!anchor) return null;

  for (const chunk of retrieve(question, chunks, k)) {
    const facts = byChunk.get(chunk.id) ?? [];
    for (const t of facts) {
      if (t.rel !== kw.rel) continue;
      if (kw.dir === "out" && t.head === anchor) return canonicalName(t.tail, registry);
      if (kw.dir === "in" && t.tail === anchor) return canonicalName(t.head, registry);
    }
  }
  return null;
}

export type { Ontology };
