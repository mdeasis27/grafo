import type {ExperienceResult} from "@/lib/experience/adapter";

const names:Record<string,string>={COMPETES_WITH:"compite con",OPERATES_IN:"opera en",ACQUIRED:"adquirió",FOUNDED_BY:"fundada por",SUPPLIES_TO:"provee a",PARTNERS_WITH:"colabora con",OWNS:"posee",INVESTED_IN:"invirtió en"};
export function GraphScene({result,visible,complete,lang}:{result:ExperienceResult|null;visible:number;complete:boolean;lang:"en"|"es"}) {
 const es=lang==="es";
 const hops=result?.hops??[];
 const nodes=hops.length?[hops[0].from,...hops.map(hop=>hop.to)]:[];
 const x=(index:number)=>85+index*570/Math.max(1,nodes.length-1);
 return <div>
  <svg role="img" aria-label={es?"Saltos calculados sobre la ontología local":"Computed hops over the local ontology"} viewBox="0 0 760 230" className="h-auto w-full">
   {hops.slice(0,visible).map((hop,index)=><g key={index} opacity={index<visible?1:.15}><path d={`M${x(index)+65} 100H${x(index+1)-65}`} stroke="var(--info)" strokeWidth="3" fill="none"/><path d={`M${x(index+1)-72} 94l8 6-8 6`} fill="none" stroke="var(--info)" strokeWidth="2"/><text x={(x(index)+x(index+1))/2} y="70" textAnchor="middle" fill="var(--muted)" fontSize="10">{es?names[hop.relation]??hop.relation:hop.relation.replaceAll('_',' ').toLowerCase()}</text></g>)}
   {nodes.map((node,index)=><g key={index} opacity={index<=visible?1:.15}><rect x={x(index)-65} y="78" width="130" height="46" rx="8" fill="var(--surface)" stroke={index<=visible?"var(--info)":"var(--border)"}/><title>{index<=visible?node:(es?"Pendiente":"Pending")}</title><text x={x(index)} y="105" textAnchor="middle" fill="var(--foreground)" fontSize="11">{index<=visible?(node.length>17?node.slice(0,17)+"…":node):"…"}</text><text x={x(index)} y="150" textAnchor="middle" fill="var(--muted)" fontSize="11">{index===0?(es?"Origen":"Start"):`${es?"Salto":"Hop"} ${index}`}</text></g>)}
   {!hops.length&&<><path d="M80 100H325M425 100H670" stroke="var(--border)" strokeWidth="3" strokeDasharray="8 6"/><text x="375" y="108" textAnchor="middle" fill={result?"var(--warning)":"var(--muted)"} fontSize="22">{result?"?":"…"}</text><text x="375" y="165" textAnchor="middle" fill="var(--muted)" fontSize="13">{result?(es?"No hay una ruta soportada para esta relación":"No supported path for this relationship"):(es?"Ejecuta una pregunta para seguir su ruta":"Run a question to trace its path")}</text></>}
  </svg>
  <ol className="mb-5 space-y-2 text-sm">{hops.slice(0,visible).map((hop,index)=><li key={index}><span className="mr-2 font-mono text-info">0{index+1}</span>{hop.from} → {es?names[hop.relation]??hop.relation:hop.relation.replaceAll('_',' ').toLowerCase()} → {hop.to}</li>)}</ol>
  {complete&&result?.status==="answered"&&<details className="mb-6 rounded border border-border p-4 text-sm"><summary className="cursor-pointer">{es?"Comparar con la evidencia de un solo pasaje":"Compare with single-passage evidence"}</summary><p className="mt-3 leading-7">{result.baseline}</p><p className="mt-3 text-xs text-muted-foreground">{es?"Texto original del corpus local; la ruta anterior muestra las relaciones que el pasaje individual no enlaza.":"Original local corpus text; the route above shows relationships the individual passage does not join."}</p></details>}
 </div>;
}
