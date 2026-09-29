// lib/grafo/graph.ts
// In-memory directed graph over extracted triples (documented proxy for Neo4j;
// Neo4j cannot run on Vercel). Every edge carries its source chunk id, which is
// the cross-key that lets us cite the sentence that justified a traversal hop.
// Mirrors backend/src/grafo/graph.py.

import type { Triple } from "./types";

/** Outbound neighbors: nodes at the tail of `node -[rel]-> ?`. */
export function targets(node: string, rel: string, triples: readonly Triple[]): string[] {
  const out: string[] = [];
  for (const t of triples) if (t.head === node && t.rel === rel) out.push(t.tail);
  return out;
}

/** Inbound neighbors: nodes at the head of `? -[rel]-> node`. */
export function sources(node: string, rel: string, triples: readonly Triple[]): string[] {
  const out: string[] = [];
  for (const t of triples) if (t.tail === node && t.rel === rel) out.push(t.head);
  return out;
}

function pick(ids: string[]): string | null {
  if (ids.length === 0) return null;
  return [...ids].sort()[0];
}

/** Directed traversal following an ordered hop list. Each hop is (rel, dir).
 * Returns the final node id reached, or null if any hop has no neighbor. */
export function traverse(
  start: string,
  hops: readonly { rel: string; dir: "in" | "out" }[],
  triples: readonly Triple[],
): string | null {
  let current = start;
  for (const hop of hops) {
    const neighbors = hop.dir === "out"
      ? targets(current, hop.rel, triples)
      : sources(current, hop.rel, triples);
    const next = pick(neighbors);
    if (next === null) return null;
    current = next;
  }
  return current;
}

export interface TraceHop {
  rel: string;
  dir: "in" | "out";
  from: string;
  to: string;
  chunkId: string;
}

export interface Trace {
  hops: TraceHop[];
  end: string | null;
}

/** Full traversal trace with the source chunk id per hop, for citation UI. */
export function traceHops(
  start: string,
  hops: readonly { rel: string; dir: "in" | "out" }[],
  triples: readonly Triple[],
): Trace {
  const trace: TraceHop[] = [];
  let current = start;
  for (const hop of hops) {
    const candidates = hop.dir === "out"
      ? triples.filter((t) => t.head === current && t.rel === hop.rel)
      : triples.filter((t) => t.tail === current && t.rel === hop.rel);
    if (candidates.length === 0) return { hops: trace, end: null };
    const chosen = [...candidates].sort(
      (a, b) => a.tail.localeCompare(b.tail) || a.head.localeCompare(b.head),
    )[0];
    const to = hop.dir === "out" ? chosen.tail : chosen.head;
    trace.push({ rel: chosen.rel, dir: hop.dir, from: current, to, chunkId: chosen.chunkId });
    current = to;
  }
  return { hops: trace, end: current };
}

/** Chunk ids that justify a traversal (one per hop). */
export function traversalChunkIds(
  start: string,
  hops: readonly { rel: string; dir: "in" | "out" }[],
  triples: readonly Triple[],
): string[] {
  const ids: string[] = [];
  let current = start;
  for (const hop of hops) {
    const candidates = hop.dir === "out"
      ? triples.filter((t) => t.head === current && t.rel === hop.rel)
      : triples.filter((t) => t.tail === current && t.rel === hop.rel);
    if (candidates.length === 0) return [];
    const chosen = [...candidates].sort((a, b) => a.tail.localeCompare(b.tail) || a.head.localeCompare(b.head))[0];
    ids.push(chosen.chunkId);
    current = hop.dir === "out" ? chosen.tail : chosen.head;
  }
  return ids;
}
