// lib/grafo/types.ts
// Core data shapes for the knowledge-graph RAG demo. All fields are plain
// JSON-serializable so the same types are mirrored one-to-one in the Python
// backend (backend/src/grafo/types.py).

export interface Entity {
  id: string;
  type: string;
  name: string;
  aliases: string[];
}

export interface Chunk {
  id: string;
  docId: string;
  section: string;
  text: string;
}

export interface Triple {
  head: string;
  rel: string;
  tail: string;
  chunkId: string;
  confidence: number;
}

export interface GoldenQuestion {
  id: string;
  text: string;
  hops: string;
  gold: string | null;
  evidenceChunkIds: string[];
}

export interface RelationPhrase {
  relation: string;
  phrase: string;
}

export interface QuestionKeyword {
  key: string;
  rel: string;
  dir: "in" | "out";
}

export interface Ontology {
  entityTypes: string[];
  relationTypes: string[];
  relationPhrases: RelationPhrase[];
  relationSynonyms: Record<string, string>;
  questionKeywords: QuestionKeyword[];
  aggKeywords: QuestionKeyword[];
  aggTriggers: string[];
  resolutionThreshold: number;
  stopwords: string[];
}

export interface ExtractionResult {
  triples: Triple[];
  failures: number;
  retries: number;
}
