// scripts/seed.mjs
// Creates the grafo schema + queries table and seeds sample history rows.
// Run: node scripts/seed.mjs  (requires DATABASE_URL in env or .env.local)

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.trim().match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch {
    /* no .env.local */
  }
}

loadEnv();

const sql = neon(process.env.DATABASE_URL);

const QUERIES = [
  ["Who is the CEO of Organization A?", "Bob Rivera", 1],
  ["Organization A's competitor operates in which region?", "Mexico", 2],
  ["The company Organization A acquired — which investor backed it?", "Investor A", 2],
  ["Organization A's competitor partners with a company — in which region does that company operate?", "Mexico", 3],
];

async function main() {
  await sql`CREATE SCHEMA IF NOT EXISTS grafo`;
  await sql`DROP TABLE IF EXISTS grafo.queries`;

  await sql`
    CREATE TABLE grafo.queries (
      id serial PRIMARY KEY,
      question text NOT NULL,
      answer text,
      hops integer NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`;

  for (const [question, answer, hops] of QUERIES) {
    await sql`INSERT INTO grafo.queries (question, answer, hops) VALUES (${question}, ${answer}, ${hops})`;
  }

  const [{ c }] = await sql`SELECT count(*)::int AS c FROM grafo.queries`;
  console.log(`Seeded grafo schema: ${c} queries`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
