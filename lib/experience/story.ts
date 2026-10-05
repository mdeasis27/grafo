import type { ExperienceInput } from "./types";
export const graphScenarios: Record<"path" | "outside", ExperienceInput> = { path: { question: "Organization A competitor operates in which region?" }, outside: { question: "What is the weather tomorrow?" } };
export function isGraphScenario(input: ExperienceInput, id: keyof typeof graphScenarios) { return input.question === graphScenarios[id].question; }
