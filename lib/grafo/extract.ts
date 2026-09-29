// lib/grafo/extract.ts
// Deterministic extraction pass (demo mode). In live mode an LLM returns this
// schema; here a rule-based parser produces the same shape over semi-structured
// sentences. Every response is validated against the constrained ontology and
// failed sentences are retried against a synonym map. Mirrors
// backend/src/grafo/extract.py.

import { ENTITY_TYPES, ONTOLOGY, RELATION_TYPES } from "./ontology";
import { findMentions, resolveMention } from "./resolve";
import type { Chunk, ExtractionResult, Triple } from "./types";

export interface ExtractContext {
  entities: { id: string; type: string; name: string; aliases: string[] }[];
}

function validateTriple(triple: Triple, entities: ExtractContext["entities"]): string | null {
  const head = entities.find((e) => e.id === triple.head);
  const tail = entities.find((e) => e.id === triple.tail);
  if (!head || !ENTITY_TYPES.includes(head.type)) return `unknown head type: ${triple.head}`;
  if (!tail || !ENTITY_TYPES.includes(tail.type)) return `unknown tail type: ${triple.tail}`;
  if (!RELATION_TYPES.includes(triple.rel)) return `unknown relation: ${triple.rel}`;
  if (triple.confidence < 0 || triple.confidence > 1) return `bad confidence: ${triple.confidence}`;
  if (!triple.chunkId) return "missing chunk id";
  return null;
}

function mentionIn(text: string, entities: ExtractContext["entities"], last: boolean): string | null {
  const ids = findMentions(text, { entities });
  if (ids.length === 0) return null;
  return last ? ids[ids.length - 1] : ids[0];
}

function resolveSide(text: string, entities: ExtractContext["entities"]): { id: string; confidence: number } | null {
  const id = mentionIn(text, entities, true);
  if (id) return { id, confidence: 1.0 };
  // looser fallback: substring match without word boundary (retry path)
  const t = text.toLowerCase();
  for (const e of entities) {
    for (const candidate of [e.name, ...e.aliases]) {
      if (candidate && t.includes(candidate.toLowerCase())) {
        return { id: e.id, confidence: 0.8 };
      }
    }
  }
  return null;
}

export function extractTriples(
  chunks: readonly Chunk[],
  entities: ExtractContext["entities"],
): ExtractionResult {
  const triples: Triple[] = [];
  let failures = 0;
  let retries = 0;
  const pending: { chunk: Chunk; sentence: string }[] = [];

  const phrases = ONTOLOGY.relationPhrases;
  const synonyms = ONTOLOGY.relationSynonyms;

  for (const chunk of chunks) {
    const sentences = chunk.text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const sentence of sentences) {
      const sl = sentence.toLowerCase();
      const matched = phrases.find((p) => sl.indexOf(p.phrase) >= 0);
      if (!matched) {
        pending.push({ chunk, sentence });
        continue;
      }
      const idx = sl.indexOf(matched.phrase);
      const subjectText = sentence.slice(0, idx);
      const objectText = sentence.slice(idx + matched.phrase.length);
      const head = resolveSide(subjectText, entities);
      const tail = resolveSide(objectText, entities);
      if (!head || !tail) {
        failures += 1;
        continue;
      }
      const triple: Triple = {
        head: head.id,
        rel: matched.relation,
        tail: tail.id,
        chunkId: chunk.id,
        confidence: Math.min(head.confidence, tail.confidence),
      };
      if (validateTriple(triple, entities) !== null) {
        failures += 1;
        continue;
      }
      triples.push(triple);
    }
  }

  // Retry pass: sentences with no primary phrase get a synonym lookup.
  for (const { chunk, sentence } of pending) {
    const sl = sentence.toLowerCase();
    const synonymKey = Object.keys(synonyms).find((k) => sl.indexOf(k) >= 0);
    if (!synonymKey) {
      failures += 1;
      continue;
    }
    const rel = synonyms[synonymKey];
    const idx = sl.indexOf(synonymKey);
    const subjectText = sentence.slice(0, idx);
    const objectText = sentence.slice(idx + synonymKey.length);
    const head = resolveSide(subjectText, entities);
    const tail = resolveSide(objectText, entities);
    if (!head || !tail) {
      failures += 1;
      continue;
    }
    const triple: Triple = {
      head: head.id,
      rel,
      tail: tail.id,
      chunkId: chunk.id,
      confidence: Math.min(head.confidence, tail.confidence, 0.7),
    };
    if (validateTriple(triple, entities) !== null) {
      failures += 1;
      continue;
    }
    triples.push(triple);
    retries += 1;
  }

  return { triples, failures, retries };
}

export function triplesByChunk(triples: readonly Triple[]): Map<string, Triple[]> {
  const map = new Map<string, Triple[]>();
  for (const t of triples) {
    const list = map.get(t.chunkId) ?? [];
    list.push(t);
    map.set(t.chunkId, list);
  }
  return map;
}

// Kept for parity with resolve.ts's standalone resolver (extraction uses
// mentionIn/resolveSide above, which are word-boundary exact matches).
export { resolveMention };
