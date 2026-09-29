// lib/grafo/retrieve.ts
// Deterministic lexical retriever — the "vector-only" baseline in demo mode.
// A TF-IDF/embedding proxy documented as such (no model download, no keys). It
// shares chunk ids with the graph, which is the whole cross-key trick: the
// baseline can read the fact stored on a retrieved chunk but cannot traverse.
// Mirrors backend/src/grafo/retrieve.py.

import { STOPWORDS } from "./ontology";
import type { Chunk } from "./types";

function tokenize(text: string): Set<string> {
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 0);
  return new Set(tokens.filter((t) => !STOPWORDS.has(t)));
}

/** Number of distinct query tokens present in the chunk text. */
export function lexicalScore(query: string, text: string): number {
  const q = tokenize(query);
  const doc = tokenize(text);
  let score = 0;
  for (const t of q) if (doc.has(t)) score += 1;
  return score;
}

export function retrieve(
  query: string,
  chunks: readonly Chunk[],
  k = 3,
): Chunk[] {
  return chunks
    .map((c) => ({ chunk: c, score: lexicalScore(query, c.text) }))
    .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id))
    .slice(0, k)
    .map((x) => x.chunk);
}

export function bestScore(query: string, chunks: readonly Chunk[]): number {
  if (chunks.length === 0) return 0;
  return Math.max(...chunks.map((c) => lexicalScore(query, c.text)));
}
