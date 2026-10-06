import { expect, it } from "vitest";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { questionCells, revealedQuestions } from "./scene-state";
import { runMission } from "./mission";

it("hides the questions not revealed yet", () => {
  expect(questionCells([{ id: "a", status: "served" }, { id: "b", status: "rerouted" }], 1)).toEqual(["served", "pending"]);
});

it("final tape counts equal the mission totals", async () => {
  const { result } = await runMission({ links: 2 }, new AbortController().signal, () => {});
  expect(tapeCounts(questionCells(result.items, result.items.length))).toEqual({ served: result.right, rerouted: 1, lost: 0, pending: 0 });
});

it("reveals the same groups the trace reports, all of it when complete or under reduced motion", () => {
  expect([1, 2, 3, 4].map(v => revealedQuestions({ visible: v, total: 4, complete: false }, 13, false))).toEqual([4, 8, 12, 13]);
  expect(revealedQuestions({ visible: 4, total: 4, complete: true }, 13, false)).toBe(13);
  expect(revealedQuestions({ visible: 1, total: 4, complete: false }, 13, true)).toBe(13);
});
