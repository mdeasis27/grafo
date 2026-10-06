const COPY: Record<string, { en: string; es: string }> = {
  "batch.1": { en: "questions 1 to 4 traced", es: "preguntas 1 a 4 recorridas" },
  "batch.2": { en: "questions 5 to 8 traced", es: "preguntas 5 a 8 recorridas" },
  "batch.3": { en: "questions 9 to 12 traced", es: "preguntas 9 a 12 recorridas" },
  "batch.4": { en: "question 13 traced", es: "pregunta 13 recorrida" },
};
export function traceCopy(locale: "en" | "es", key: string) { return COPY[key]?.[locale] ?? key; }
