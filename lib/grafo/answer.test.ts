import { describe, expect, it } from "vitest";

import corpusRaw from "./data/corpus.json";
import entitiesRaw from "./data/entities.json";
import goldenRaw from "./data/golden.json";
import { answerGraph, answerVector } from "./answer";
import { extractTriples, triplesByChunk } from "./extract";
import type { Chunk, Entity, GoldenQuestion, Triple } from "./types";

const ENTITIES = entitiesRaw.entities as Entity[];
const CHUNKS = corpusRaw.chunks as Chunk[];
const GOLDEN = goldenRaw.questions as GoldenQuestion[];

const REGISTRY = { entities: ENTITIES };
const triples: readonly Triple[] = extractTriples(CHUNKS, ENTITIES).triples;
const byChunk = triplesByChunk(triples);

describe("answerGraph", () => {
  for (const q of GOLDEN) {
    it(`answers "${q.text}"`, () => {
      expect(answerGraph(q.text, REGISTRY, triples)).toBe(q.gold);
    });
  }
});

describe("answerVector (single-passage reader baseline)", () => {
  it("matches graph on one-hop lookups (parity)", () => {
    for (const q of GOLDEN.filter((x) => x.hops === "1")) {
      expect(answerVector(q.text, REGISTRY, CHUNKS, byChunk, 3)).toBe(q.gold);
    }
  });

  it("cannot chain hops", () => {
    for (const q of GOLDEN.filter((x) => x.hops === "2" || x.hops === "3")) {
      expect(answerVector(q.text, REGISTRY, CHUNKS, byChunk, 3)).toBeNull();
    }
  });

  it("cannot aggregate", () => {
    for (const q of GOLDEN.filter((x) => x.hops === "agg")) {
      expect(answerVector(q.text, REGISTRY, CHUNKS, byChunk, 3)).toBeNull();
    }
  });

  it("refuses out-of-scope questions", () => {
    for (const q of GOLDEN.filter((x) => x.hops === "oos")) {
      expect(answerVector(q.text, REGISTRY, CHUNKS, byChunk, 3)).toBeNull();
    }
  });
});
