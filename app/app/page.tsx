"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert } from "@/design-system/components/alert";
import { StatusBadge } from "@/design-system/components/status-badge";
import { extractTriples } from "@/lib/grafo/extract";
import { canonicalName, findMentions } from "@/lib/grafo/resolve";
import { findKeywords } from "@/lib/grafo/answer";
import { traceHops } from "@/lib/grafo/graph";
import { ONTOLOGY } from "@/lib/grafo/ontology";
import entitiesRaw from "@/lib/grafo/data/entities.json";
import corpusRaw from "@/lib/grafo/data/corpus.json";
import type { Chunk, Entity } from "@/lib/grafo/types";

const ENTITIES = entitiesRaw.entities as Entity[];
const CHUNKS = corpusRaw.chunks as Chunk[];
const REGISTRY = { entities: ENTITIES };
const TRIPLES = extractTriples(CHUNKS, ENTITIES).triples;

const chunkText = (id: string) => CHUNKS.find((c) => c.id === id)?.text ?? "";

const REL_ES: Record<string, string> = {
  ACQUIRED: "adquirió",
  FOUNDED_BY: "fue fundada por",
  CEO_OF: "es CEO de",
  INVESTED_IN: "invirtió en",
  COMPETES_WITH: "compite con",
  SUPPLIES_TO: "provee a",
  OPERATES_IN: "opera en",
  PARTNERS_WITH: "se asocia con",
  OWNS: "posee",
  EMPLOYS: "emplea",
};

const TYPE_COLOR: Record<string, string> = {
  COMPANY: "#7dd3fc",
  PERSON: "#c4b5fd",
  PRODUCT: "#f9a8d4",
  REGION: "#86efac",
  INVESTOR: "#fcd34d",
  INDUSTRY: "#5eead4",
};

const TYPE_LABEL: Record<string, string> = {
  COMPANY: "Empresa",
  PERSON: "Persona",
  PRODUCT: "Producto",
  REGION: "Región",
  INVESTOR: "Inversor",
  INDUSTRY: "Industria",
};

// Fixed layout (viewBox 0 0 800 500).
const POS: Record<string, { x: number; y: number }> = {
  delta: { x: 400, y: 55 },
  bob: { x: 140, y: 100 },
  alice: { x: 260, y: 80 },
  carol: { x: 400, y: 120 },
  zeta: { x: 45, y: 235 },
  acme: { x: 285, y: 235 },
  gamma: { x: 525, y: 235 },
  epsilon: { x: 720, y: 235 },
  beta: { x: 145, y: 375 },
  falcon: { x: 285, y: 375 },
  brazil: { x: 185, y: 470 },
  orbit: { x: 525, y: 375 },
  mexico: { x: 625, y: 405 },
};

const EXAMPLES = [
  { q: "Who is the CEO of Acme?", label: "1-hop", id: "q01" },
  { q: "Acme's competitor operates in which region?", label: "2-hop", id: "q06" },
  { q: "The company Acme acquired — which investor backed it?", label: "2-hop", id: "q07" },
  { q: "Acme's competitor partners with a company — in which region does that company operate?", label: "3-hop", id: "q09" },
];

const NODES = ENTITIES.filter((e) => POS[e.id]);

interface HopResult {
  rel: string;
  from: string;
  to: string;
  chunkId: string;
}

function computeTrace(question: string): { hops: HopResult[]; end: string | null; answer: string | null } {
  const anchor = findMentions(question, REGISTRY)[0] ?? null;
  const keywords = findKeywords(question, ONTOLOGY.questionKeywords);
  if (!anchor || keywords.length === 0) return { hops: [], end: null, answer: null };
  const trace = traceHops(anchor, keywords.map((k) => ({ rel: k.rel, dir: k.dir })), TRIPLES);
  const answer = trace.end ? canonicalName(trace.end, REGISTRY) : null;
  return { hops: trace.hops, end: trace.end, answer };
}

export default function AppPage() {
  const [question, setQuestion] = useState(EXAMPLES[2].q);
  const [result, setResult] = useState<ReturnType<typeof computeTrace> | null>(null);
  const [step, setStep] = useState(0);

  function run(q: string) {
    setQuestion(q);
    setResult(computeTrace(q));
    setStep(0);
  }

  useEffect(() => {
    if (result && step < result.hops.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 650);
      return () => clearTimeout(t);
    }
  }, [result, step]);

  const activeHops = result ? result.hops.slice(0, step) : [];
  const activeNodes = new Set<string>();
  if (result && result.hops.length > 0) {
    activeNodes.add(result.hops[0].from);
    for (const h of activeHops) activeNodes.add(h.to);
  }

  const currentNode = activeHops.length > 0 ? activeHops[activeHops.length - 1].to : result?.hops[0]?.from ?? null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Inicio
            </Link>
            <div className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <svg className="h-4 w-4 text-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground leading-tight">Grafo</h1>
                <p className="text-xs text-muted-foreground">Knowledge-graph RAG</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="info" dot className="px-3 py-1">Demo mode</StatusBadge>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Recorre el grafo en vivo</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Caso de uso real: <strong>due diligence de proveedores y competidores</strong>. Haz una
            pregunta multi-hop y mira cómo el grafo encadena entidades — algo que un buscador
            vectorial no puede. Cada salto cita la frase que lo justifica.
          </p>
        </div>

        {/* ── QUESTION BAR ───────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                onClick={() => run(ex.q)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  question === ex.q
                    ? "border-info/40 bg-info/10 text-info"
                    : "border-[var(--border)] text-muted-foreground hover:text-foreground"
                }`}
              >
                {ex.label}: {ex.q.length > 52 ? ex.q.slice(0, 52) + "…" : ex.q}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run(question)}
              placeholder="Pregunta en inglés, p.ej. Acme's competitor operates in which region?"
              className="flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/60"
            />
            <button
              onClick={() => run(question)}
              className="rounded-[var(--radius-md)] bg-accent px-5 py-2 text-sm font-medium text-[#ffffff] hover:bg-accent/90 transition-colors"
            >
              Recorrer grafo
            </button>
          </div>
        </div>

        {/* ── GRAPH ──────────────────────────── */}
        <div className="rounded-[var(--radius-md)] shadow-[var(--shadow-card)] bg-card p-4 overflow-x-auto">
          <svg viewBox="0 0 800 500" className="w-full min-w-[640px]" role="img" aria-label="grafo de entidades">
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#52525b" />
              </marker>
            </defs>

            {/* edges */}
            {TRIPLES.map((t, i) => {
              const from = POS[t.head];
              const to = POS[t.tail];
              if (!from || !to) return null;
              const active = activeHops.some((h) => h.from === t.head && h.to === t.tail);
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              return (
                <g key={i}>
                  <line
                    x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke={active ? "#38bdf8" : "#3f3f46"}
                    strokeWidth={active ? 3 : 1.25}
                    strokeDasharray={active ? undefined : "3 3"}
                    opacity={active ? 1 : 0.55}
                    markerEnd={active ? undefined : "url(#arrow)"}
                    style={{ transition: "stroke 0.3s, stroke-width 0.3s, opacity 0.3s" }}
                  />
                  {active && (
                    <circle cx={mx} cy={my} r={4} fill="#38bdf8" className="animate-ping" style={{ transformOrigin: `${mx}px ${my}px` }} />
                  )}
                  <text x={mx + dx * 0.12} y={my + dy * 0.12 - 6} textAnchor="middle" fontSize="9" fill="#a1a1aa" className="font-mono">
                    {REL_ES[t.rel] ?? t.rel}
                  </text>
                </g>
              );
            })}

            {/* nodes */}
            {NODES.map((e) => {
              const p = POS[e.id];
              const active = activeNodes.has(e.id);
              const isCurrent = currentNode === e.id;
              const isAnswer = result?.end === e.id && step >= result.hops.length && result.hops.length > 0;
              const color = TYPE_COLOR[e.type] ?? "#e4e4e7";
              return (
                <g key={e.id} style={{ transition: "opacity 0.3s" }} opacity={active || result === null || step === 0 ? 1 : 0.35}>
                  {isCurrent && <circle cx={p.x} cy={p.y} r={22} fill="none" stroke="#38bdf8" strokeWidth={2} className="animate-ping" />}
                  <circle
                    cx={p.x} cy={p.y} r={16}
                    fill={color}
                    fillOpacity={0.18}
                    stroke={isAnswer ? "#38bdf8" : active ? color : "#52525b"}
                    strokeWidth={isAnswer ? 3 : active ? 2 : 1.25}
                    style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
                  />
                  <circle cx={p.x} cy={p.y} r={4} fill={color} />
                  <text x={p.x} y={p.y + 30} textAnchor="middle" fontSize="11" fill={active ? "#fafafa" : "#a1a1aa"} fontWeight={active ? 600 : 400}>
                    {e.name}
                  </text>
                  <text x={p.x} y={p.y + 42} textAnchor="middle" fontSize="8" fill="#71717a" className="font-mono uppercase">
                    {TYPE_LABEL[e.type]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* ── TRAIL + ANSWER ─────────────────── */}
        {result && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Camino recorrido</h3>
              {result.hops.length === 0 ? (
                <Alert tone="warning" title="Sin recorrido">
                  No se pudo anclar una entidad ni inferir palabras clave de la pregunta. Prueba
                  una de las preguntas de ejemplo.
                </Alert>
              ) : (
                result.hops.map((h, i) => {
                  const fromName = canonicalName(h.from, REGISTRY);
                  const toName = canonicalName(h.to, REGISTRY);
                  const revealed = i < step;
                  return (
                    <div
                      key={i}
                      className={`rounded-[var(--radius-md)] border p-3 text-sm transition-opacity ${
                        revealed ? "opacity-100" : "opacity-25"
                      } border-[var(--border)] bg-surface`}
                    >
                      <p className="text-foreground">
                        <span className="font-semibold">{fromName}</span>{" "}
                        <span className="text-info font-medium">{REL_ES[h.rel] ?? h.rel}</span>{" "}
                        <span className="font-semibold">{toName}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground font-mono">
                        “[{h.chunkId}] {chunkText(h.chunkId)}”
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Respuesta</h3>
              {result.answer ? (
                <div className="rounded-[var(--radius-md)] border border-success/30 bg-success/10 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge tone="success" dot>grafo</StatusBadge>
                    <span className="text-xs text-muted-foreground">{result.hops.length} hops</span>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{result.answer}</p>
                </div>
              ) : (
                <Alert tone="warning" title="El grafo no tiene respuesta">
                  Esta pregunta requiere cruzar entidades que el grafo no conecta (fuera de
                  alcance), o no contiene entidades conocidas.
                </Alert>
              )}
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-surface p-4">
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge tone="warning">vector-only</StatusBadge>
                  <span className="text-xs text-muted-foreground">baseline sin grafo</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.hops.length > 1
                    ? "null — no puede encadenar ni contar: el baseline vectorial recupera chunks pero no tiene aristas que recorrer."
                    : "Podría responder preguntas de un solo hecho, pero no encadenar hops."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
