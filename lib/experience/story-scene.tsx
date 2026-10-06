"use client";
import type { CSSProperties } from "react";
import type { PlaybackFrame } from "@/design-system/demo/playback";
import type { TraceEvent } from "@/design-system/demo/types";
import { StoryStage } from "@/design-system/demo/decision-lab";
import { OutcomeTape, useReducedMotion } from "@/design-system/demo/project-story";
import { tapeCounts } from "@/design-system/demo/outcome-tape";
import { GRAPH_EDGES, type AnsweredQuestion, type LinkStatus } from "./mission";
import { baseLinks, linkKey as key, NARROW, questionCells, revealedQuestions, WIDE, type Layout } from "./scene-state";
import { STORY } from "./story";

type Point = readonly [number, number];

const HOP_MS = 200;
const STROKE: Record<LinkStatus, string> = { served: "stroke-success", rerouted: "stroke-info", lost: "stroke-danger" };
const FILL: Record<LinkStatus, string> = { served: "fill-success", rerouted: "fill-info", lost: "fill-danger" };
const MARK: Record<LinkStatus, string> = { served: "✓", rerouted: "⋯", lost: "×" };
const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });
const HALO: CSSProperties = { paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 5, strokeLinejoin: "round" };
// Keyframes live with the scene; reduced motion shows the end state of every animation.
const CSS = `@keyframes grafo-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}@keyframes grafo-in{from{opacity:0}to{opacity:1}}
.grafo-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:grafo-draw ${HOP_MS}ms linear forwards}.grafo-in{opacity:0;animation:grafo-in 200ms ease-out forwards}
@media (prefers-reduced-motion:reduce){.grafo-draw,.grafo-in{animation:none;opacity:1;stroke-dashoffset:0}}`;

/** Where a question stops: the answer node(s), the last reachable contact, or the anchor itself. */
function endpoints(q: AnsweredQuestion): string[] {
  const { anchor, legs, reach, count } = q.walk;
  if (count) return legs.map(l => l.to);
  if (reach > 0) return [legs[reach - 1].to];
  return anchor ? [anchor] : [];
}

function ContactMap({ layout, items, revealed, current, ariaLabel, copy, className }: { layout: Layout; items: AnsweredQuestion[]; revealed: number; current: number; ariaLabel: string; copy: (typeof STORY)["en"]["scene"]; className: string }) {
  const P = layout.nodes;
  const { seen, missing } = baseLinks(items, revealed, current);
  const q = current >= 0 ? items[current] : undefined;
  const legs = q ? q.walk.legs : [];
  const legDelay = (k: number) => (q?.walk.count ? 0 : k * HOP_MS);
  const settle = q ? (q.walk.count ? HOP_MS : q.walk.reach * HOP_MS) : 0;
  const label = (a: Point, b: Point, text: string, cls: string, style?: CSSProperties) =>
    <text x={(a[0] + b[0]) / 2} y={(a[1] + b[1]) / 2 - 7} textAnchor="middle" fontSize={layout.font - 3} className={cls} style={{ ...HALO, ...style }}>{text}</text>;

  return <svg viewBox={`0 0 ${layout.w} ${layout.h}`} role="img" aria-label={ariaLabel} className={`h-auto w-full ${className}`} data-grafo-map>
    <style>{CSS}</style>
    {GRAPH_EDGES.map(e => { const k = key(e.from, e.to); return <line key={`${e.from}-${e.rel}-${e.to}`} x1={P[e.from][0]} y1={P[e.from][1]} x2={P[e.to][0]} y2={P[e.to][1]} strokeWidth={missing.has(k) ? 3 : 2} strokeDasharray={missing.has(k) ? "6 6" : undefined} className={missing.has(k) ? "stroke-info" : seen.has(k) ? "stroke-foreground/45" : "stroke-border"} />; })}
    {q ? <g key={current} data-current-question={q.id}>
      {legs.map((l, k) => {
        const a = P[l.from], b = P[l.to];
        const inReach = k < q.walk.reach;
        return <g key={k}>
          {inReach
            ? <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} pathLength={1} strokeWidth={4} strokeLinecap="round" className={`grafo-draw ${STROKE[q.status]}`} style={delay(legDelay(k))} />
            : <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={4} strokeDasharray="6 6" className="grafo-in stroke-info" style={delay(settle)} data-missing-link />}
          {inReach
            ? label(a, b, copy.relations[l.rel] ?? l.rel, "grafo-in fill-foreground", delay(legDelay(k)))
            : label(a, b, copy.missing, "grafo-in fill-info font-semibold", delay(settle))}
        </g>;
      })}
    </g> : null}
    {Object.entries(P).map(([id, [x, y]]) => {
      const start = q?.walk.anchor === id;
      const end = q ? endpoints(q).includes(id) : false;
      return <g key={id}>
        {start && !end ? <circle cx={x} cy={y} r={17} fill="none" strokeWidth={2.5} strokeDasharray="4 4" className="stroke-foreground" /> : null}
        {end && q ? <g key={current} className="grafo-in" style={delay(settle)}>
          <circle cx={x} cy={y} r={17} fill="none" strokeWidth={3} className={STROKE[q.status]} />
          <text x={x + 19} y={y - 13} fontSize={layout.font} fontWeight={700} className={FILL[q.status]} aria-hidden="true">{MARK[q.status]}</text>
        </g> : null}
        <circle cx={x} cy={y} r={9} strokeWidth={2} className="fill-surface stroke-muted-foreground" />
        <text x={x} y={y < 100 ? y - 24 : y + 32} textAnchor="middle" fontSize={layout.font} className="fill-foreground" style={HALO}>{copy.entities[id] ?? id}</text>
      </g>;
    })}
  </svg>;
}

export function GrafoStoryScene({ frame, result, links, locale }: { frame: PlaybackFrame<TraceEvent>; result: { items: AnsweredQuestion[] }; links: number; locale: "en" | "es" }) {
  const copy = STORY[locale].scene;
  const reduced = useReducedMotion();
  const items = result.items;
  const revealed = revealedQuestions(frame, items.length, reduced);
  const current = !reduced && frame.event ? revealed - 1 : -1;
  const cells = questionCells(items, revealed);
  const c = tapeCounts(cells);
  const done = reduced || frame.complete;
  const q = current >= 0 ? items[current] : undefined;

  let outcome = "";
  if (q) {
    const end = endpoints(q)[0];
    if (q.status === "rerouted") outcome = copy.outOfReach(q.walk.legs.length, links);
    else if (q.status === "lost") outcome = copy.wrong;
    else if (q.walk.count) outcome = copy.counted(q.walk.legs.length);
    else if (q.walk.legs.length === 0) outcome = copy.noData;
    else outcome = `${copy.answer} ${copy.entities[end] ?? end}.`;
  }
  const used = q ? (q.walk.count ? Math.min(1, q.walk.legs.length) : q.walk.reach) : 0;
  const summary = copy.summary(c.rerouted, links);
  const ariaLabel = [copy.mapLabel, q ? `${copy.questionOf(current + 1, items.length)}: ${copy.questions[q.id]} ${outcome}` : "", done ? summary : ""].filter(Boolean).join(". ");
  const settle = q ? (q.walk.count ? HOP_MS : q.walk.reach * HOP_MS) : 0;

  return <StoryStage locale={locale} title={copy.title} caption={copy.caption} step={frame.visible} total={frame.total}>
    <div className="@container">
      <ContactMap layout={NARROW} items={items} revealed={revealed} current={current} ariaLabel={ariaLabel} copy={copy} className="@min-[30rem]:hidden" />
      <ContactMap layout={WIDE} items={items} revealed={revealed} current={current} ariaLabel={ariaLabel} copy={copy} className="hidden @min-[30rem]:block" />
    </div>
    <div className="mt-4 min-h-[4.5rem] text-sm leading-6" aria-live="polite" data-question-status>
      {q ? <>
        <p><span className="mr-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">{copy.questionOf(current + 1, items.length)}</span>{copy.questions[q.id]}</p>
        <p className="font-mono text-xs text-muted-foreground">{copy.links(used, q.walk.count ? 1 : links)}</p>
        <p key={current} className={`grafo-in font-medium ${q.status === "served" ? "text-success" : q.status === "rerouted" ? "text-info" : "text-danger"}`} style={delay(settle)}><span aria-hidden="true" className="mr-1">{MARK[q.status]}</span>{outcome}</p>
      </> : <p className="text-muted-foreground">{done ? null : copy.idle}</p>}
      {done ? <p className="mt-1" data-scene-summary>{summary}</p> : null}
    </div>
    <div className="mt-6">
      <OutcomeTape cells={cells} labels={copy.tape} ariaLabel={copy.tapeLabel} columns={items.length} />
      <p className="mt-4 font-mono text-2xl font-semibold tracking-tight">{copy.rightOf(c.served, items.length)}</p>
    </div>
  </StoryStage>;
}
