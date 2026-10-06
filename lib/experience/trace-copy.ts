export function traceCopy(locale: "en" | "es", key: string) {
  const n = /^question\.(\d+)$/.exec(key)?.[1];
  if (!n) return key;
  return locale === "en" ? `question ${n} traced` : `pregunta ${n} recorrida`;
}
