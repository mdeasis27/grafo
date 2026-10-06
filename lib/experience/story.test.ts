import { describe, expect, it } from "vitest";
import { STORY } from "./story";
import { lintStory, storyStrings as strings } from "@/design-system/demo/copy-lint";

describe("Grafo story copy", () => {
  it("has the same shape in English and Spanish", () => {
    const keys = (o: unknown): string[] => o && typeof o === "object" && !Array.isArray(o) ? Object.entries(o).filter(([k]) => k !== "before" && k !== "after").flatMap(([k, v]) => [k, ...keys(v).map(x => `${k}.${x}`)]) : [];
    expect(keys(STORY.es)).toEqual(keys(STORY.en));
    expect(STORY.es.analogy.dictionary).toHaveLength(STORY.en.analogy.dictionary.length);
  });

  it("has no empty strings except the owner-supplied why note", () => {
    for (const locale of ["en", "es"] as const) {
      const { why, ...rest } = STORY[locale];
      expect(why.title.trim()).not.toBe("");
      for (const s of strings(rest)) expect(s.trim(), `${locale}: empty string`).not.toBe("");
    }
  });

  it("avoids AI-sounding patterns and brand names", () => {
    for (const locale of ["en", "es"] as const) expect(lintStory(STORY[locale]), locale).toEqual([]);
  });

  it("states the comparison truthfully at a gap, a tie and the reverse case", () => {
    expect(STORY.es.compare.sentence(12, 7)).toBe("El grafo acertó 12 de 13; la búsqueda simple, 7. Falla todas las preguntas que necesitan un segundo eslabón o contar.");
    expect(STORY.en.compare.sentence(7, 7)).toBe("Both got 7 of 13 right.");
    expect(STORY.en.compare.sentence(6, 7)).toContain("plain search did better");
  });

  it("asks the bet about the links the visitor chose", () => {
    expect(STORY.en.tryIt.question(1)).toContain("following up to 1 link,");
    expect(STORY.es.tryIt.question(2)).toContain("siguiendo hasta 2 eslabones,");
    expect(STORY.es.compare.verdict(12)).toBe("12 de 13 preguntas respondidas bien");
  });
});

describe("Grafo scene copy", () => {
  it("has one question per benchmark item and a label for every node and relation a walk touches", async () => {
    const { followLinks } = await import("./mission");
    const items = followLinks(3);
    for (const locale of ["en", "es"] as const) {
      const scene = STORY[locale].scene;
      expect(scene.questions).toHaveLength(items.length);
      for (const { walk } of items) for (const id of [walk.anchor, ...walk.legs.flatMap(l => [l.from, l.to])]) expect(scene.entities[id ?? ""], `${locale}: ${id}`).toBeTruthy();
      for (const { walk } of items) for (const l of walk.legs) expect(scene.relations[l.rel], `${locale}: ${l.rel}`).toBeTruthy();
    }
  });
});
