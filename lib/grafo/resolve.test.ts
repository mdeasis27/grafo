import { describe, expect, it } from "vitest";

import entitiesRaw from "./data/entities.json";
import { findMentions, normalize, resolveMention, trigramSimilarity } from "./resolve";
import type { Entity } from "./types";

const REGISTRY = { entities: entitiesRaw.entities as Entity[] };

describe("normalize", () => {
  it("lowercases, strips punctuation, collapses whitespace", () => {
    expect(normalize("  Acme  Corp. ")).toBe("acme corp");
    expect(normalize("ACME")).toBe("acme");
  });
});

describe("trigram similarity", () => {
  it("is 1 for identical strings", () => {
    expect(trigramSimilarity("acmecorp", "acmecorp")).toBeCloseTo(1, 10);
  });
  it("is 0 for disjoint strings", () => {
    expect(trigramSimilarity("acme", "beta")).toBe(0);
  });
  it("scores a single-char typo above threshold", () => {
    expect(trigramSimilarity("acmecorp", "acmecorrp")).toBeGreaterThan(0.6);
  });
});

describe("resolveMention", () => {
  it("matches exact canonical name", () => {
    expect(resolveMention("Acme Corp", REGISTRY)).toBe("acme");
  });
  it("matches aliases regardless of case", () => {
    expect(resolveMention("ACME", REGISTRY)).toBe("acme");
    expect(resolveMention("Acme Corporation", REGISTRY)).toBe("acme");
    expect(resolveMention("acme", REGISTRY)).toBe("acme");
    expect(resolveMention("Delta", REGISTRY)).toBe("delta");
    expect(resolveMention("GammaLabs", REGISTRY)).toBe("gamma");
  });
  it("collapses a typo into the same node via similarity", () => {
    expect(resolveMention("Acme Corrp", REGISTRY)).toBe("acme");
  });
  it("returns null for unknown entities", () => {
    expect(resolveMention("Tesla", REGISTRY)).toBeNull();
    expect(resolveMention("Oracle", REGISTRY)).toBeNull();
  });
});

describe("findMentions", () => {
  it("returns ordered unique entity ids", () => {
    expect(findMentions("Who is the CEO of Acme?", REGISTRY)).toEqual(["acme"]);
    expect(findMentions("Delta Ventures invested in Gamma Labs", REGISTRY)).toEqual([
      "delta",
      "gamma",
    ]);
  });
  it("handles possessives", () => {
    expect(findMentions("Acme's competitor", REGISTRY)).toEqual(["acme"]);
  });
});
