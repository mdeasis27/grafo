import { describe, expect, it } from "vitest";

import corpusRaw from "./data/corpus.json";
import { bestScore, lexicalScore, retrieve } from "./retrieve";
import type { Chunk } from "./types";

const CHUNKS = corpusRaw.chunks as Chunk[];

describe("lexicalScore", () => {
  it("scores overlap of non-stopword tokens", () => {
    expect(lexicalScore("Who is the CEO of Organization A?", "Bob Rivera is the CEO of Organization A.")).toBeGreaterThan(
      lexicalScore("Who is the CEO of Organization A?", "Investor A invested in Organization C."),
    );
  });

  it("ignores stopwords", () => {
    expect(lexicalScore("the of in", "the of in")).toBe(0);
  });
});

describe("retrieve", () => {
  it("ranks the CEO fact chunk first for a CEO question", () => {
    const top = retrieve("Who is the CEO of Organization A?", CHUNKS, 3);
    expect(top[0].id).toBe("c03");
  });

  it("is deterministic and respects k", () => {
    const top = retrieve("Organization A", CHUNKS, 5);
    expect(top).toHaveLength(5);
  });
});

describe("bestScore", () => {
  it("returns the maximum lexical overlap", () => {
    expect(bestScore("Organization A", CHUNKS)).toBeGreaterThan(0);
  });
});
