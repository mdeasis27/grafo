import { expect, it } from "vitest";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { questionCells, revealedQuestions } from "./scene-state";
import { runMission } from "./mission";

it("hides the questions not revealed yet", () => {
  expect(questionCells([{ status: "served" }, { status: "rerouted" }], 1)).toEqual(["served", "pending"]);
});

it("final tape counts equal the mission totals", async () => {
  const { result } = await runMission({ links: 2 }, new AbortController().signal, () => {});
  expect(tapeCounts(questionCells(result.items, result.items.length))).toEqual({ served: result.right, rerouted: 1, lost: 0, pending: 0 });
});

it("reveals one question per trace step, all of it when complete or under reduced motion", () => {
  expect([1, 2, 12, 13].map(v => revealedQuestions({ visible: v, total: 13, complete: v === 13 }, 13, false))).toEqual([1, 2, 12, 13]);
  expect(revealedQuestions({ visible: 1, total: 13, complete: false }, 13, true)).toBe(13);
});

it("places every node of every fact on both maps", async () => {
  const { GRAPH_EDGES } = await import("./mission");
  const { NARROW, WIDE } = await import("./scene-state");
  const ids = [...new Set(GRAPH_EDGES.flatMap(e => [e.from, e.to]))].sort();
  for (const layout of [WIDE, NARROW]) expect(ids.filter(id => !layout.nodes[id])).toEqual([]);
});

it("keeps a link solid once any earlier question walked it, even if a later one could not", async () => {
  const { baseLinks } = await import("./scene-state");
  const { followLinks } = await import("./mission");
  const items = followLinks(1);
  const q03 = items.findIndex(q => q.id === "q03"), q06 = items.findIndex(q => q.id === "q06");
  const { seen, missing } = baseLinks(items, q06 + 1, -1);
  const shared = items[q03].walk.legs[0];
  const k = [shared.from, shared.to].sort().join("|");
  expect(seen.has(k)).toBe(true);
  expect(missing.has(k)).toBe(false);
});
