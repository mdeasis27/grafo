import {expect,test} from "vitest";
import {graphScenarios} from "./story";
import {runExperience} from "./adapter";
test("business presets traverse committed relations and refuse unsupported questions",async()=>{
 const path=await runExperience(graphScenarios.path,new AbortController().signal,()=>{});
 const outside=await runExperience(graphScenarios.outside,new AbortController().signal,()=>{});
 expect(path.result.status).toBe("answered");
 expect(path.result.hops.length).toBeGreaterThanOrEqual(2);
 expect(outside.result.status).toBe("refused");
 expect(outside.result.hops).toHaveLength(0);
 expect(outside.trace.at(-1)?.kind).toBe("decision");
});
