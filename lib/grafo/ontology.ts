// lib/grafo/ontology.ts
// The constrained ontology, loaded from a committed JSON file so the TypeScript
// core and the Python backend share the exact same schema, extractor phrases,
// router keyword table, and stopwords. Constraining the ontology before any
// code is the whole point: an open "extract everything" prompt yields a graph
// nobody can query.

import ontologyRaw from "./data/ontology.json";
import type { Ontology } from "./types";

export const ONTOLOGY: Ontology = ontologyRaw as Ontology;

export const ENTITY_TYPES = ONTOLOGY.entityTypes;
export const RELATION_TYPES = ONTOLOGY.relationTypes;
export const STOPWORDS = new Set(ONTOLOGY.stopwords);
export const RESOLUTION_THRESHOLD = ONTOLOGY.resolutionThreshold;
