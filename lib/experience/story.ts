import type { Heading } from "@/design-system/demo/project-story";

type NodeCopy = { name: string; sub: string; analogy: string };

export interface GrafoStory {
  name: string;
  oneLiner: string;
  chips: string[];
  analogy: { heading: Heading; paragraphs: string[]; dictionaryLabel: string; dictionary: { term: string; means: string }[] };
  why: { title: string; text: string };
  tryIt: { heading: Heading; lead: string; question: (links: number) => string; yes: string; no: string; linksLabel: string; note: string; simulate: string; cancel: string; reset: string; error: string; idle: string };
  compare: { heading: Heading; lead: string; graph: (links: number) => string; vector: string; right: string; sentence: (graph: number, vector: number) => string; verdict: (right: number) => string };
  fit: { heading: Heading; worthLabel: string; worth: string; notLabel: string; not: string };
  proves: { heading: Heading; text: string };
  engineers: { summary: string; points: string[]; repoLabel: string };
  scene: { title: string; caption: string; statusLabels: { active: string; danger: string; success: string }; tapeLabel: string; nodes: { questions: NodeCopy; graph: NodeCopy; answered: NodeCopy; tooFar: NodeCopy }; tape: { served: string; rerouted: string; lost: string }; rightOf: (n: number) => string };
}

export const STORY: Record<"en" | "es", GrafoStory> = {
  en: {
    name: "Knowledge graph",
    oneLiner: "Some answers only show up when you follow the chain: who knows whom, and whom that person knows.",
    chips: ["Linked answers", "2 min", "Live demo"],
    analogy: {
      heading: { before: "The", accent: "analogy" },
      paragraphs: [
        "You need a plumber. You don't know one, but your neighbor's sister does. The answer was never in one place; you got it by following two links. Stop after the first link and you come back empty-handed.",
        "Here the links are facts pulled from company documents: who runs which company, who invested in whom, where each one operates. The slider decides how many links the search may follow before it gives up.",
      ],
      dictionaryLabel: "In the diagram below",
      dictionary: [
        { term: "a person you know", means: "an entity in the graph" },
        { term: "a link", means: "one fact that joins two entities" },
        { term: "a friend of a friend", means: "an answer two or three links away" },
        { term: "\"I can't reach that\"", means: "a refusal when more links are needed" },
      ],
    },
    why: { title: "Why I built it", text: "" },
    tryIt: {
      heading: { before: "Try", accent: "it" },
      lead: "Thirteen questions about a set of companies. Five need one link, three need two, one needs three, two need counting, and two ask about things the documents never say.",
      question: (n) => `Before you run it, place a bet: following up to ${n} ${n === 1 ? "link" : "links"}, does it answer all 13 questions correctly?`,
      yes: "Yes, all 13",
      no: "No, some are out of reach",
      linksLabel: "Links the search may follow",
      note: "Each square is one question, in order. Green got the right answer, or correctly said the documents don't have it. Blue was out of reach with this many links. Red would be a wrong answer.",
      simulate: "Run it",
      cancel: "Cancel",
      reset: "Start over",
      error: "The questions could not be answered. Try another number of links.",
      idle: "Place your bet and press Run it.",
    },
    compare: {
      heading: { before: "The graph", accent: "or a plain search" },
      lead: "Same thirteen questions, same documents. One side follows links in the graph; the other reads the closest passage, one at a time.",
      graph: (n) => `Graph, up to ${n} ${n === 1 ? "link" : "links"}`,
      vector: "Plain search",
      right: "right answers",
      sentence: (graph, vector) => {
        if (graph === vector) return `Both got ${graph} of 13 right.`;
        if (graph < vector) return `This time the plain search did better: ${vector} against ${graph}.`;
        return `The graph got ${graph} of 13 right; the plain search got ${vector}. It misses every question that needs a second link or a count.`;
      },
      verdict: (n) => `${n} of 13 questions answered correctly`,
    },
    fit: {
      heading: { before: "Where it", accent: "fits" },
      worthLabel: "Worth it",
      worth: "When the useful answer sits across several documents and only appears by joining them. I picture a credit team checking who really stands behind a company: its owners, their investors, their other businesses.",
      notLabel: "Not needed",
      not: "When each answer lives in one passage, like a policy lookup. A plain search is simpler and just as good there.",
    },
    proves: {
      heading: { before: "What it", accent: "proves" },
      text: "I split questions by how many links they need and let the system refuse when the chain is longer than it may follow. A missing link shows up as a blue square, and the search never makes up the last step.",
    },
    engineers: {
      summary: "For engineers",
      points: [
        "Facts are extracted from the documents as typed triples, entity names are resolved (exact, alias, then trigram similarity) and the graph is traversed by relation keywords in the question.",
        "The link cap refuses when a question needs more relations than allowed. Aggregations count neighbors over one relation and need one link.",
        "Answers per cap are pinned in a fixture read by the TypeScript and Python suites. The plain-search baseline uses the same documents and top 3 passages.",
        "Stack: Next.js 16, TypeScript, Python, Vitest, pytest.",
      ],
      repoLabel: "Source code",
    },
    scene: {
      title: "What the graph did with each question",
      caption: "Watch each question follow its links to an answer, or stop when the chain runs out.",
      statusLabels: { active: "following links", success: "answered", danger: "wrong answer" },
      tapeLabel: "Thirteen questions, in order",
      nodes: {
        questions: { name: "Questions", sub: "13 about companies", analogy: "what you ask" },
        graph: { name: "Graph", sub: "follows links", analogy: "your contacts" },
        answered: { name: "Answered", sub: "right or correctly refused", analogy: "the plumber" },
        tooFar: { name: "Out of reach", sub: "needs more links", analogy: "a friend too far" },
      },
      tape: { served: "answered right", rerouted: "out of reach", lost: "wrong answer" },
      rightOf: (n) => `Answered correctly: ${n} of 13`,
    },
  },
  es: {
    name: "Grafo",
    oneLiner: "Algunas respuestas solo aparecen si sigues la cadena: quién conoce a quién, y a quién conoce esa persona.",
    chips: ["Respuestas enlazadas", "2 min", "Demo en vivo"],
    analogy: {
      heading: { accent: "La analogía" },
      paragraphs: [
        "Necesitas un plomero. Tú no conoces a ninguno, pero la hermana de tu vecina sí. La respuesta nunca estuvo en un solo lugar; la obtuviste siguiendo dos eslabones. Si te detienes en el primero, te quedas sin nada.",
        "Aquí los eslabones son datos sacados de documentos de empresas: quién dirige cada empresa, quién invirtió en quién, dónde opera cada una. El slider decide cuántos eslabones puede seguir la búsqueda antes de rendirse.",
      ],
      dictionaryLabel: "En el diagrama de abajo",
      dictionary: [
        { term: "una persona que conoces", means: "una entidad del grafo" },
        { term: "un eslabón", means: "un dato que une dos entidades" },
        { term: "el amigo de un amigo", means: "una respuesta a dos o tres eslabones" },
        { term: "\"no llego hasta ahí\"", means: "un rechazo cuando hacen falta más eslabones" },
      ],
    },
    why: { title: "Por qué lo hice", text: "" },
    tryIt: {
      heading: { accent: "Pruébalo" },
      lead: "Trece preguntas sobre un grupo de empresas. Cinco necesitan un eslabón, tres necesitan dos, una necesita tres, dos piden contar y dos preguntan cosas que los documentos nunca dicen.",
      question: (n) => `Antes de correrlo, apuesta: siguiendo hasta ${n} ${n === 1 ? "eslabón" : "eslabones"}, ¿responde bien las 13 preguntas?`,
      yes: "Sí, las 13",
      no: "No, algunas quedan fuera de alcance",
      linksLabel: "Eslabones que puede seguir la búsqueda",
      note: "Cada cuadrito es una pregunta, en orden. Verde dio la respuesta correcta, o dijo con razón que los documentos no la tienen. Azul quedó fuera de alcance con esos eslabones. Rojo sería una respuesta equivocada.",
      simulate: "Correr",
      cancel: "Cancelar",
      reset: "Empezar de nuevo",
      error: "No se pudieron responder las preguntas. Prueba con otro número de eslabones.",
      idle: "Haz tu apuesta y presiona Correr.",
    },
    compare: {
      heading: { before: "El grafo", accent: "o una búsqueda simple" },
      lead: "Las mismas trece preguntas, los mismos documentos. De un lado se siguen eslabones en el grafo; del otro se lee el pasaje más cercano, uno a la vez.",
      graph: (n) => `Grafo, hasta ${n} ${n === 1 ? "eslabón" : "eslabones"}`,
      vector: "Búsqueda simple",
      right: "respuestas correctas",
      sentence: (graph, vector) => {
        if (graph === vector) return `Los dos acertaron ${graph} de 13.`;
        if (graph < vector) return `Esta vez la búsqueda simple salió mejor: ${vector} contra ${graph}.`;
        return `El grafo acertó ${graph} de 13; la búsqueda simple, ${vector}. Falla todas las preguntas que necesitan un segundo eslabón o contar.`;
      },
      verdict: (n) => `${n} de 13 preguntas respondidas bien`,
    },
    fit: {
      heading: { before: "¿Dónde", accent: "sirve", after: "?" },
      worthLabel: "Vale la pena",
      worth: "Cuando la respuesta útil está repartida en varios documentos y solo aparece al unirlos. Pienso en un equipo de crédito que revisa quién está de verdad detrás de una empresa: sus dueños, sus inversionistas, sus otros negocios.",
      notLabel: "No hace falta",
      not: "Cuando cada respuesta vive en un solo pasaje, como consultar una política. Ahí una búsqueda simple es más sencilla y funciona igual de bien.",
    },
    proves: {
      heading: { before: "Lo que", accent: "demuestra" },
      text: "Separé las preguntas según cuántos eslabones necesitan y dejé que el sistema rechace cuando la cadena es más larga de lo permitido. Un eslabón faltante se ve como un cuadrito azul, y la búsqueda nunca inventa el último paso.",
    },
    engineers: {
      summary: "Para ingenieros",
      points: [
        "Los datos se extraen de los documentos como tripletas con tipo, los nombres se resuelven (exacto, alias y luego similitud por trigramas) y el grafo se recorre con las palabras de relación de la pregunta.",
        "El límite de eslabones rechaza cuando una pregunta necesita más relaciones de las permitidas. Las preguntas de conteo cuentan vecinos sobre una relación y necesitan un eslabón.",
        "Las respuestas por límite están fijadas en un fixture que leen las pruebas de TypeScript y de Python. La búsqueda simple usa los mismos documentos y los 3 pasajes más cercanos.",
        "Stack: Next.js 16, TypeScript, Python, Vitest, pytest.",
      ],
      repoLabel: "Código fuente",
    },
    scene: {
      title: "Lo que hizo el grafo con cada pregunta",
      caption: "Mira cómo cada pregunta sigue sus eslabones hasta una respuesta, o se detiene cuando la cadena se acaba.",
      statusLabels: { active: "siguiendo eslabones", success: "respondió", danger: "respuesta equivocada" },
      tapeLabel: "Trece preguntas, en orden",
      nodes: {
        questions: { name: "Preguntas", sub: "13 sobre empresas", analogy: "lo que preguntas" },
        graph: { name: "Grafo", sub: "sigue eslabones", analogy: "tus contactos" },
        answered: { name: "Respondida", sub: "bien o rechazada con razón", analogy: "el plomero" },
        tooFar: { name: "Fuera de alcance", sub: "faltan eslabones", analogy: "un amigo demasiado lejos" },
      },
      tape: { served: "respondida bien", rerouted: "fuera de alcance", lost: "respuesta equivocada" },
      rightOf: (n) => `Respondidas bien: ${n} de 13`,
    },
  },
};
