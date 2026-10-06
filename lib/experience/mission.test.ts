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

it("runs the mission, reveals one question per step and stops when cancelled", async () => {
  const ids: string[] = [];
  const run = await runMission({ links: 2 }, new AbortController().signal, e => ids.push(e.id));
  expect(run.result.items).toHaveLength(13);
  expect(run.result.comparison).toEqual({ graph: 12, vector: 7 });
  expect(ids).toHaveLength(13);
  const c = new AbortController(); c.abort();
  await expect(runMission({ links: 2 }, c.signal, () => {})).rejects.toThrow();
});

it("each question carries the walk the engine follows, cut at the link cap", () => {
  const at = (links: number, id: string) => followLinks(links).find(i => i.id === id)!.walk;
  expect(at(2, "q09")).toMatchObject({ anchor: "acme", reach: 2, count: false });
  expect(at(2, "q09").legs.map(l => l.to)).toEqual(["gamma", "epsilon", "mexico"]);
  expect(at(3, "q09").reach).toBe(3);
  expect([1, 2, 3].map(l => followLinks(l).filter(i => i.walk.reach < i.walk.legs.length).map(i => i.id))).toEqual([["q06", "q07", "q08", "q09"], ["q09"], []]);
  expect(at(1, "q10")).toMatchObject({ anchor: "delta", count: true, reach: 3 });
  expect(at(2, "q12")).toEqual({ anchor: "brazil", legs: [], reach: 0, count: false });
});
