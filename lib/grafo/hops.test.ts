import { describe, expect, it } from "vitest";

import corpusRaw from "./data/corpus.json";
import entitiesRaw from "./data/entities.json";
import goldenRaw from "./data/golden.json";
import fixture from "./fixtures/hops.json";
import { answerGraph } from "./answer";
import { extractTriples } from "./extract";
import type { Chunk, Entity, GoldenQuestion } from "./types";

const ENTITIES = entitiesRaw.entities as Entity[];
const GOLDEN = goldenRaw.questions as GoldenQuestion[];
const REGISTRY = { entities: ENTITIES };
const triples = extractTriples(corpusRaw.chunks as Chunk[], ENTITIES).triples;
const right = (cap: number) => GOLDEN.filter((q) => answerGraph(q.text, REGISTRY, triples, cap) === q.gold).length;

describe("answerGraph with a link cap", () => {
  it("answers 9 with one link, 12 with two and all 13 with three", () => {
    expect([1, 2, 3].map(right)).toEqual([9, 12, 13]);
  });

  it("refuses a question that needs more links than the cap", () => {
    const q09 = GOLDEN.find((q) => q.id === "q09")!;
    expect(answerGraph(q09.text, REGISTRY, triples, 2)).toBeNull();
    expect(answerGraph(q09.text, REGISTRY, triples)).toBe(q09.gold);
  });

  it("matches the answers per cap pinned for Python", () => {
    for (const [cap, answers] of Object.entries(fixture.answers)) {
      expect(GOLDEN.map((q) => answerGraph(q.text, REGISTRY, triples, Number(cap)))).toEqual(answers);
    }
  });
});
