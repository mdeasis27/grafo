import type { TapeStatus } from "@/design-system/demo/outcome-tape";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import type { AnsweredQuestion } from "./mission";

export function questionCells(items: readonly Pick<AnsweredQuestion, "status">[], revealed: number): TapeStatus[] {
  return items.map((c, i) => (i >= revealed ? "pending" : c.status));
}

/** One trace step per question; everything at once when complete or under reduced motion. */
export function revealedQuestions(frame: { visible: number; total: number; complete: boolean }, n: number, reducedMotion: boolean): number {
  if (reducedMotion || frame.complete || frame.total === 0) return n;
  return Math.min(n, frame.visible);
}

export const COMPLETE_FRAME: PlaybackFrame<TraceEvent> = { visible: 0, total: 0, event: undefined, complete: true };

type Point = readonly [number, number];
export type Layout = { w: number; h: number; font: number; nodes: Record<string, Point> };

// Two hand-placed maps of the same graph: wide, and narrow for phones (switched by container width).
export const WIDE: Layout = { w: 720, h: 330, font: 17, nodes: { bob: [90, 60], beta: [250, 55], delta: [440, 55], orbit: [610, 55], alice: [90, 170], acme: [250, 170], gamma: [440, 170], epsilon: [610, 170], brazil: [60, 290], carol: [165, 290], falcon: [270, 290], zeta: [380, 290], mexico: [525, 290] } };
export const NARROW: Layout = { w: 390, h: 510, font: 15, nodes: { bob: [55, 45], beta: [215, 45], delta: [300, 70], alice: [65, 160], acme: [200, 175], gamma: [305, 185], carol: [50, 275], falcon: [145, 290], epsilon: [255, 300], orbit: [345, 295], brazil: [40, 385], mexico: [290, 450], zeta: [205, 460] } };

export const linkKey = (a: string, b: string) => [a, b].sort().join("|");

/** Links earlier questions walked (`seen`) and the ones they needed but could not follow (`missing`). */
export function baseLinks(items: readonly Pick<AnsweredQuestion, "walk">[], revealed: number, current: number) {
  const seen = new Set<string>();
  const missing = new Set<string>();
  items.slice(0, revealed).forEach(({ walk }, i) => {
    if (i === current) return;
    walk.legs.forEach((l, k) => (k < walk.reach ? seen : missing).add(linkKey(l.from, l.to)));
  });
  // A link any earlier question walked stays solid, even if a later one could not follow it.
  for (const k of seen) missing.delete(k);
  return { seen, missing };
}
