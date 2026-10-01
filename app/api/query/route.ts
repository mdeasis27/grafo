import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";
import { extractTriples } from "@/lib/grafo/extract";
import { answerGraph, findKeywords } from "@/lib/grafo/answer";
import { traceHops } from "@/lib/grafo/graph";
import { findMentions } from "@/lib/grafo/resolve";
import { ONTOLOGY } from "@/lib/grafo/ontology";
import entitiesRaw from "@/lib/grafo/data/entities.json";
import corpusRaw from "@/lib/grafo/data/corpus.json";
import type { Chunk, Entity } from "@/lib/grafo/types";

const ENTITIES = entitiesRaw.entities as Entity[];
const CHUNKS = corpusRaw.chunks as Chunk[];
const REGISTRY = { entities: ENTITIES };
const TRIPLES = extractTriples(CHUNKS, ENTITIES).triples;

export async function POST(request: Request) {
  let question: string;
  try {
    const body = await request.json();
    question = typeof body.question === "string" ? body.question.trim() : "";
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }

  if (!question) {
    return NextResponse.json({ error: "Escribe una pregunta" }, { status: 400 });
  }

  const anchor = findMentions(question, REGISTRY)[0] ?? null;
  const keywords = findKeywords(question, ONTOLOGY.questionKeywords);
  const answer = answerGraph(question, REGISTRY, TRIPLES);
  const trace = anchor
    ? traceHops(anchor, keywords.map((k) => ({ rel: k.rel, dir: k.dir })), TRIPLES)
    : { hops: [], end: null };
  const hops = trace.hops.map((h) => ({
    rel: h.rel,
    dir: h.dir,
    from: h.from,
    to: h.to,
    chunkId: h.chunkId,
  }));

  let persisted = true;
  try {
    const db = getSql();
    await db`INSERT INTO grafo.queries (question, answer, hops) VALUES (${question}, ${answer}, ${hops.length})`;
  } catch {
    persisted = false;
  }

  return NextResponse.json({
    question,
    answer,
    hops: hops.length,
    trace: hops,
    persisted,
  });
}
