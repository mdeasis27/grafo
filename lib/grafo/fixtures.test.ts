import { describe, expect, it } from "vitest";

import corpusRaw from "./data/corpus.json";
import entitiesRaw from "./data/entities.json";
import goldenRaw from "./data/golden.json";
import benchmarkFixture from "./fixtures/benchmark.json";
import resolutionFixture from "./fixtures/resolution.json";

import { benchmark } from "./benchmark";
import { extractTriples } from "./extract";
import { resolveMention } from "./resolve";
import type { Chunk, Entity, GoldenQuestion } from "./types";

const ENTITIES = entitiesRaw.entities as Entity[];
const CHUNKS = corpusRaw.chunks as Chunk[];
const GOLDEN = goldenRaw.questions as GoldenQuestion[];
const REGISTRY = { entities: ENTITIES };

describe("pinned fixture: entity resolution", () => {
  for (const c of resolutionFixture.cases as { mention: string; expected: string | null }[]) {
    it(`resolves "${c.mention}"`, () => {
      expect(resolveMention(c.mention, REGISTRY)).toBe(c.expected);
    });
  }
});

describe("pinned fixture: benchmark", () => {
  it("reproduces the reference accuracy by hop count", () => {
    const triples = extractTriples(CHUNKS, ENTITIES).triples;
    const result = benchmark(GOLDEN, REGISTRY, CHUNKS, triples, 3);

    expect(result.n).toBe(benchmarkFixture.n);
    expect(result.graph.overall).toBeCloseTo(benchmarkFixture.graph.overall, 10);
    expect(result.vector.overall).toBeCloseTo(benchmarkFixture.vector.overall, 10);
    for (const b of ["1", "2", "3", "agg", "oos"]) {
      expect(result.graph.byHop[b].accuracy).toBeCloseTo(benchmarkFixture.graph.byHop[b as keyof typeof benchmarkFixture.graph.byHop], 10);
      expect(result.vector.byHop[b].accuracy).toBeCloseTo(benchmarkFixture.vector.byHop[b as keyof typeof benchmarkFixture.vector.byHop], 10);
    }
  });
});
