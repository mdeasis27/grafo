import corpusRaw from "@/lib/grafo/data/corpus.json";
import entitiesRaw from "@/lib/grafo/data/entities.json";
import goldenRaw from "@/lib/grafo/data/golden.json";
import { answerGraph, answerVector, questionPath, type QuestionPath } from "@/lib/grafo/answer";
import { extractTriples, triplesByChunk } from "@/lib/grafo/extract";
import type { Chunk, Entity, GoldenQuestion } from "@/lib/grafo/types";
import type { DemoAdapter, TraceEvent } from "@/design-system/demo/types";

export type LinkStatus = "served" | "rerouted" | "lost";
/** The links a question needs and how many fit under the cap (`reach`); the rest stay out of reach. */
export type Walk = QuestionPath & { reach: number };
export type AnsweredQuestion = { id: string; status: LinkStatus; walk: Walk };
export type MissionInput = { links: number };
export type MissionResult = { items: AnsweredQuestion[]; right: number; comparison: { graph: number; vector: number } };

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
    const path = questionPath(q.text, REGISTRY, TRIPLES);
    const walk = { ...path, reach: path.count ? path.legs.length : Math.min(links, path.legs.length) };
    if (answer === q.gold) return { id: q.id, status: "served", walk };
    return { id: q.id, status: answer === null ? "rerouted" : "lost", walk };
  });
}

/** Right answers from vector search alone, which reads one passage at a time and can't chain or count. */
export function vectorRight(): number {
  const byChunk = triplesByChunk(TRIPLES);
  return GOLDEN.filter((q) => answerVector(q.text, REGISTRY, CHUNKS, byChunk, 3) === q.gold).length;
}

/** Every fact in the graph, for drawing the map. */
export const GRAPH_EDGES = TRIPLES.map((t) => ({ from: t.head, rel: t.rel, to: t.tail }));

export const runMission: DemoAdapter<MissionInput, MissionResult> = async (input, signal, onEvent) => {
  const startedAt = performance.now();
  const items = followLinks(input.links);
  const trace: TraceEvent[] = [];
  for (const [i, q] of items.entries()) {
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    const event: TraceEvent = { id: `question-${i + 1}`, step: i + 1, kind: "traverse", messageKey: `question.${i + 1}`, timestampMs: performance.now() - startedAt, evidenceIds: [q.id] };
    trace.push(event);
    onEvent(event);
  }
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const right = items.filter((i) => i.status === "served").length;
  return { input, result: { items, right, comparison: { graph: right, vector: vectorRight() } }, trace, executionMs: performance.now() - startedAt, mode: "local" };
};
