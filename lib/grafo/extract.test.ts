import { describe, expect, it } from "vitest";

import corpusRaw from "./data/corpus.json";
import entitiesRaw from "./data/entities.json";
import { extractTriples } from "./extract";
import type { Chunk, Entity } from "./types";

const ENTITIES = entitiesRaw.entities as Entity[];
const CHUNKS = corpusRaw.chunks as Chunk[];

describe("extractTriples (demo corpus)", () => {
  const result = extractTriples(CHUNKS, ENTITIES);

  it("extracts the full graph with no failures or retries", () => {
    expect(result.triples).toHaveLength(15);
    expect(result.failures).toBe(0);
    expect(result.retries).toBe(0);
  });

  it("resolves every endpoint to a canonical node", () => {
    for (const t of result.triples) {
      expect(t.head).toBeTruthy();
      expect(t.tail).toBeTruthy();
      expect(t.chunkId).toBeTruthy();
    }
  });

  it("recovers a specific relationship", () => {
    const acquired = result.triples.filter((t) => t.rel === "ACQUIRED");
    expect(acquired).toHaveLength(1);
    expect(acquired[0]).toMatchObject({ head: "acme", tail: "beta" });
  });
});

describe("extractTriples (validation + retry)", () => {
  it("retries an unknown verb through the synonym map", () => {
    const chunk: Chunk = {
      id: "x01",
      docId: "d",
      section: "s",
      text: "Acme Corp purchased BetaCorp.",
    };
    const result = extractTriples([chunk], ENTITIES);
    expect(result.triples).toHaveLength(1);
    expect(result.triples[0].rel).toBe("ACQUIRED");
    expect(result.retries).toBe(1);
    expect(result.failures).toBe(0);
  });

  it("records a failure for an unparsable sentence", () => {
    const chunk: Chunk = {
      id: "x02",
      docId: "d",
      section: "s",
      text: "Acme Corp ziggurats BetaCorp.",
    };
    const result = extractTriples([chunk], ENTITIES);
    expect(result.triples).toHaveLength(0);
    expect(result.failures).toBe(1);
  });
});
