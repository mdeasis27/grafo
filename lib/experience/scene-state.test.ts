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
