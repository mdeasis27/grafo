import corpusRaw from "@/lib/grafo/data/corpus.json";
import entitiesRaw from "@/lib/grafo/data/entities.json";
import goldenRaw from "@/lib/grafo/data/golden.json";
import { answerGraph, answerVector } from "@/lib/grafo/answer";
import { extractTriples, triplesByChunk } from "@/lib/grafo/extract";
import type { Chunk, Entity, GoldenQuestion } from "@/lib/grafo/types";
import type { DemoAdapter, TraceEvent } from "@/design-system/demo/types";

export type LinkStatus = "served" | "rerouted" | "lost";
export type AnsweredQuestion = { id: string; status: LinkStatus };
export type MissionInput = { links: number };
export type MissionResult = { items: AnsweredQuestion[]; right: number; comparison: { graph: number; vector: number } };

const STEP = 4;
const ENTITIES = entitiesRaw.entities as Entity[];
const CHUNKS = corpusRaw.chunks as Chunk[];
const GOLDEN = goldenRaw.questions as GoldenQuestion[];
const REGISTRY = { entities: ENTITIES };
const TRIPLES = extractTriples(CHUNKS, ENTITIES).triples;

/** Each benchmark question: right answer (or a correct refusal), refused for needing more links, or wrong. */
export function followLinks(links: number): AnsweredQuestion[] {
  if (!Number.isSafeInteger(links) || links < 1 || links > 3) throw new Error("links must be 1 to 3.");
  return GOLDEN.map((q) => {
    const answer = answerGraph(q.text, REGISTRY, TRIPLES, links);
    if (answer === q.gold) return { id: q.id, status: "served" };
    return { id: q.id, status: answer === null ? "rerouted" : "lost" };
  });
}

/** Right answers from vector search alone, which reads one passage at a time and can't chain or count. */
export function vectorRight(): number {
  const byChunk = triplesByChunk(TRIPLES);
  return GOLDEN.filter((q) => answerVector(q.text, REGISTRY, CHUNKS, byChunk, 3) === q.gold).length;
}

export const runMission: DemoAdapter<MissionInput, MissionResult> = async (input, signal, onEvent) => {
  const startedAt = performance.now();
  const items = followLinks(input.links);
  const trace: TraceEvent[] = [];
  for (let i = 0; i < items.length; i += STEP) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const event: TraceEvent = { id: `batch-${i / STEP + 1}`, step: i / STEP + 1, kind: "traverse", messageKey: `batch.${i / STEP + 1}`, timestampMs: performance.now() - startedAt, evidenceIds: items.slice(i, i + STEP).map((q) => q.id) };
    trace.push(event);
    onEvent(event);
  }
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const right = items.filter((i) => i.status === "served").length;
  return { input, result: { items, right, comparison: { graph: right, vector: vectorRight() } }, trace, executionMs: performance.now() - startedAt, mode: "local" };
};
