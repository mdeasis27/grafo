"use client";

import Link from "next/link";
import { Alert } from "@/design-system/components/alert";
import { Card } from "@/design-system/components/card";
import { MetricCard } from "@/design-system/components/metric-card";
import { StatusBadge } from "@/design-system/components/status-badge";
import { cn } from "@/design-system/utils";
import {
  getBenchmark,
  getDelta,
  getExtractionStats,
  getHopLabels,
  getResolutionDemo,
  getWorkedExample,
} from "@/lib/grafo/demo";

const BENCH = getBenchmark();
const STATS = getExtractionStats();
const DELTA = getDelta();
const WORKED = getWorkedExample();
const RESOLUTION = getResolutionDemo();
const HOP_LABELS = getHopLabels();

function pct(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}

export default function AppPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              Inicio
            </Link>
            <div className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <svg className="h-4 w-4 text-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground leading-tight">Grafo</h1>
                <p className="text-xs text-muted-foreground">Knowledge-graph RAG</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="info" dot className="px-3 py-1">
              Demo mode
            </StatusBadge>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* ── SUMMARY BAR ─────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetricCard label="Entidades" value={STATS.entities} hint="nodos resueltos" />
          <MetricCard label="Triples" value={STATS.triples} hint="aristas con chunk id" tone="success" />
          <MetricCard label="Preguntas eval" value={BENCH.n} hint="estratificadas por hops" />
          <MetricCard
            label="Δ graph vs vector"
            value={`+${(DELTA * 100).toFixed(0)}pp`}
            hint="accuracy overall"
            tone="success"
          />
        </div>

        {/* ── BENCHMARK BY HOP COUNT ──────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Benchmark por hop count</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Graph RAG (traversal con citas) frente a un baseline vector-only (single-passage
            reader). Paridad en 1-hop; la brecha se abre al subir los hops, porque el baseline no
            puede encadenar ni contar.
          </p>
          <div className="overflow-x-auto rounded-[var(--radius-md)] shadow-[var(--shadow-card)] bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--gray-50)]">
                  <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dificultad</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Graph</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vector-only</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {BENCH.buckets.map((b) => {
                  const g = BENCH.graph.byHop[b];
                  const v = BENCH.vector.byHop[b];
                  const delta = g.accuracy - v.accuracy;
                  return (
                    <tr key={b}>
                      <td className="px-5 py-3.5 font-semibold text-foreground">{HOP_LABELS[b]}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-success">{pct(g.accuracy)}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-muted-foreground">{pct(v.accuracy)}</td>
                      <td className={cn("px-4 py-3.5 text-right tabular-nums", delta > 0 ? "text-success" : "text-muted-foreground")}>
                        {delta > 0 ? `+${pct(delta)}` : pct(delta)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── WORKED EXAMPLE ──────────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Ejemplo 2-hop con citas</h2>
          <p className="text-sm text-muted-foreground mb-5">
            Cada hop cita el chunk que lo justifica (el grafo y el índice comparten el mismo
            chunk id). El baseline vector-only devuelve <code className="font-mono text-xs">null</code>: no puede cruzar chunks.
          </p>
          <Card className="p-5">
            <p className="text-sm font-semibold text-foreground mb-4">{WORKED.question}</p>
            <ol className="space-y-2">
              {WORKED.graph.hops.map((h, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <StatusBadge tone="info">{h.rel}</StatusBadge>
                  <span className="text-foreground">{h.from}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-foreground font-semibold">{h.to}</span>
                  <span className="text-xs text-muted-foreground font-mono">[{h.chunkId}] {h.chunkText}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex items-center gap-3">
              <StatusBadge tone="success">Graph answer</StatusBadge>
              <span className="text-foreground font-semibold">{WORKED.graph.answer}</span>
              <span className="mx-2 h-4 w-px bg-[var(--border)]" aria-hidden="true" />
              <StatusBadge tone="warning">Vector answer</StatusBadge>
              <span className="text-muted-foreground">{WORKED.vector.answer ?? "null (no puede encadenar)"}</span>
            </div>
          </Card>
        </section>

        {/* ── ENTITY RESOLUTION ───────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Entity resolution</h2>
          <p className="text-sm text-muted-foreground mb-5">
            &quot;Acme Corp&quot;, &quot;ACME&quot; y &quot;Acme Corporation&quot; colapsan en un solo nodo
            (exact → alias → trigram similarity sobre umbral). Un typo &quot;Acme Corrp&quot; también resuelve;
            una entidad desconocida no.
          </p>
          <div className="grid gap-4 sm:grid-cols-5">
            {RESOLUTION.map((r) => (
              <Card key={r.mention} className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{r.mention}</p>
                <p className="text-sm font-semibold text-foreground">{r.node ?? "—"}</p>
                <div className="mt-2">
                  {r.resolved ? (
                    <StatusBadge tone="success">resuelto</StatusBadge>
                  ) : (
                    <StatusBadge tone="warning">sin match</StatusBadge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── EXTRACTION ──────────────────────── */}
        <section>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">Extracción con schema estricto</h2>
          <Alert tone="info" title="Validación + reintento">
            {STATS.triples} triples extraídos de {STATS.chunks} chunks con{" "}
            <strong>{STATS.failures} fallos</strong> y <strong>{STATS.retries} reintentos</strong>.
            Cada triple valida tipo de entidad y relación contra la ontología restringida; un verbo
            desconocido reintenta por el mapa de sinónimos. El grafo es en memoria (proxy documentado
            de Neo4j; Neo4j no corre en Vercel).
          </Alert>
        </section>

        <footer className="pt-8 border-t border-[var(--border)] flex items-center justify-between text-xs text-muted-foreground">
          <span>Grafo · Knowledge-graph RAG · Demo mode</span>
          <a href="https://github.com/mdeasis27/grafo" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-mono">GitHub</a>
        </footer>
      </div>
    </div>
  );
}
