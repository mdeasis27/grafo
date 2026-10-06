import { describe, expect, it } from "vitest";

import entitiesRaw from "./data/entities.json";
import { findMentions, normalize, resolveMention, trigramSimilarity } from "./resolve";
import type { Entity } from "./types";

const REGISTRY = { entities: entitiesRaw.entities as Entity[] };

describe("normalize", () => {
  it("lowercases, strips punctuation, collapses whitespace", () => {
    expect(normalize("  Organization  A. ")).toBe("organization a");
    expect(normalize("ORGANIZATION A")).toBe("organization a");
  });
});

describe("trigram similarity", () => {
  it("is 1 for identical strings", () => {
    expect(trigramSimilarity("organizationa", "organizationa")).toBeCloseTo(1, 10);
  });
  it("is 0 for disjoint strings", () => {
    expect(trigramSimilarity("organizationa", "investora")).toBe(0);
  });
  it("scores a single-char typo above threshold", () => {
    expect(trigramSimilarity("organizationaincorporated", "organizationaincorported")).toBeGreaterThan(0.6);
  });
});

describe("resolveMention", () => {
  it("matches exact canonical name", () => {
    expect(resolveMention("Organization A", REGISTRY)).toBe("acme");
  });
  it("matches aliases regardless of case", () => {
    expect(resolveMention("ORGANIZATION A", REGISTRY)).toBe("acme");
    expect(resolveMention("Organization A Incorporated", REGISTRY)).toBe("acme");
    expect(resolveMention("Org A", REGISTRY)).toBe("acme");
    expect(resolveMention("Investor A", REGISTRY)).toBe("delta");
    expect(resolveMention("Org C", REGISTRY)).toBe("gamma");
  });
  it("collapses a typo into the same node via similarity", () => {
    expect(resolveMention("Organization A Incorported", REGISTRY)).toBe("acme");
  });
  it("returns null for unknown entities", () => {
    expect(resolveMention("Unlisted entity", REGISTRY)).toBeNull();
    expect(resolveMention("Oracle", REGISTRY)).toBeNull();
  });
});

describe("findMentions", () => {
  it("returns ordered unique entity ids", () => {
    expect(findMentions("Who is the CEO of Organization A?", REGISTRY)).toEqual(["acme"]);
    expect(findMentions("Investor A invested in Organization C", REGISTRY)).toEqual([
      "delta",
      "gamma",
    ]);
  });
  it("handles possessives", () => {
    expect(findMentions("Organization A's competitor", REGISTRY)).toEqual(["acme"]);
  });
});
