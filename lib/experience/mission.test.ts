import { expect, it } from "vitest";
import { followLinks, runMission, vectorRight } from "./mission";

const count = (links: number) => {
  const items = followLinks(links);
  return { served: items.filter(i => i.status === "served").length, rerouted: items.filter(i => i.status === "rerouted").length, lost: items.filter(i => i.status === "lost").length };
};

it("following up to 2 links answers 12 and refuses q09, which needs 3", () => {
  expect(count(2)).toEqual({ served: 12, rerouted: 1, lost: 0 });
  expect(followLinks(2).filter(i => i.status === "rerouted").map(i => i.id)).toEqual(["q09"]);
  expect(count(1)).toEqual({ served: 9, rerouted: 4, lost: 0 });
});

it("sweep: both bet answers are reachable on the slider, and the default says no", () => {
  expect([1, 2, 3].map(l => count(l).served === 13)).toEqual([false, false, true]);
});

it("vector search alone gets 7 of 13 right", () => {
  expect(vectorRight()).toBe(7);
});

it("runs the mission, reveals in groups of four and stops when cancelled", async () => {
  const ids: string[] = [];
  const run = await runMission({ links: 2 }, new AbortController().signal, e => ids.push(e.id));
  expect(run.result.items).toHaveLength(13);
  expect(run.result.comparison).toEqual({ graph: 12, vector: 7 });
  expect(ids).toHaveLength(4);
  const c = new AbortController(); c.abort();
  await expect(runMission({ links: 2 }, c.signal, () => {})).rejects.toThrow();
});
