import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";

export async function GET() {
  try {
    const db = getSql();
    const rows = await db`SELECT id, question, answer, hops, created_at FROM grafo.queries ORDER BY id DESC LIMIT 20`;
    return NextResponse.json({ queries: rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error leyendo historial" },
      { status: 500 },
    );
  }
}
