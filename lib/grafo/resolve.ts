// lib/grafo/resolve.ts
// Entity resolution — the part every RAG tutorial skips. "Organization A",
// "ORGANIZATION A" and "Organization A Incorporated" must collapse into one
// node or the graph is
// four disconnected islands. Three passes, in order:
//   1. exact canonical-name match
//   2. alias match
//   3. trigram similarity over a tuned threshold (catches typos/abbrev drift)
// Mirrors backend/src/grafo/resolve.py. Behavior is pinned by
// fixtures/resolution.json in both languages.

import { RESOLUTION_THRESHOLD } from "./ontology";
import type { Entity } from "./types";

/** Lowercase, non-alphanumerics to spaces, collapse and trim. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trigrams(s: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + 3 <= s.length; i += 1) out.add(s.slice(i, i + 3));
  return out;
}

/** Q-gram (trigram) Jaccard on space-stripped normalized names. */
export function trigramSimilarity(a: string, b: string): number {
  const A = trigrams(a.replace(/ /g, ""));
  const B = trigrams(b.replace(/ /g, ""));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter += 1;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface Registry {
  entities: Entity[];
}

/** Resolve a free-text mention to a canonical node id, or null. */
export function resolveMention(
  mention: string,
  registry: Registry,
  threshold: number = RESOLUTION_THRESHOLD,
): string | null {
  const m = normalize(mention);

  for (const e of registry.entities) {
    if (normalize(e.name) === m) return e.id;
  }
  for (const e of registry.entities) {
    for (const a of e.aliases) {
      if (normalize(a) === m) return e.id;
    }
  }

  let bestId: string | null = null;
  let bestScore = 0;
  for (const e of registry.entities) {
    for (const candidate of [e.name, ...e.aliases]) {
      const score = trigramSimilarity(m, normalize(candidate));
      if (score > bestScore) {
        bestScore = score;
        bestId = e.id;
      }
    }
  }
  return bestScore >= threshold ? bestId : null;
}

/** Ordered unique entity ids mentioned in free text (by first appearance). */
export function findMentions(text: string, registry: Registry): string[] {
  const q = text.toLowerCase();
  const found: { id: string; idx: number }[] = [];

  for (const e of registry.entities) {
    let best = Number.POSITIVE_INFINITY;
    for (const candidate of [e.name, ...e.aliases]) {
      const re = new RegExp(`\\b${escapeRegExp(candidate.toLowerCase())}\\b`);
      const match = q.match(re);
      if (match && match.index !== undefined && match.index < best) {
        best = match.index;
      }
    }
    if (best !== Number.POSITIVE_INFINITY) found.push({ id: e.id, idx: best });
  }

  found.sort((a, b) => a.idx - b.idx || a.id.localeCompare(b.id));

  const ids: string[] = [];
  const seen = new Set<string>();
  for (const f of found) {
    if (!seen.has(f.id)) {
      seen.add(f.id);
      ids.push(f.id);
    }
  }
  return ids;
}

export function canonicalName(id: string, registry: Registry): string | null {
  const e = registry.entities.find((x) => x.id === id);
  return e ? e.name : null;
}
