import type { Heading } from "@/design-system/demo/project-story";

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
  scene: {
    title: string; caption: string; tapeLabel: string; tape: { served: string; rerouted: string; lost: string }; rightOf: (n: number) => string;
    mapLabel: string; idle: string; entities: Record<string, string>; relations: Record<string, string>; questions: string[];
    questionOf: (n: number) => string; links: (used: number, cap: number) => string; answer: string; counted: (n: number) => string;
    noData: string; outOfReach: (need: number, cap: number) => string; wrong: string; missing: string; summary: (outOfReach: number, cap: number) => string;
  };
}

export const STORY: Record<"en" | "es", GrafoStory> = {
  en: {
    name: "Connected evidence",
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
      caption: "Each question starts at whoever it asks about and moves from contact to contact. Green reached the answer, blue ran out of links.",
      tapeLabel: "Thirteen questions, in order",
      tape: { served: "answered right", rerouted: "out of reach", lost: "wrong answer" },
      rightOf: (n) => `Answered correctly: ${n} of 13`,
      mapLabel: "Map of companies, people and countries joined by facts from the documents",
      idle: "Each question follows its links here.",
      entities: { acme: "Company A", beta: "Company B", gamma: "Company C", epsilon: "Company D", zeta: "Company E", delta: "Investor A", alice: "Founder", bob: "CEO", mexico: "Mexico", brazil: "Brazil" },
      relations: { ACQUIRED: "acquired", FOUNDED_BY: "founded by", CEO_OF: "runs", INVESTED_IN: "invested", COMPETES_WITH: "competes", OPERATES_IN: "operates in", SUPPLIES_TO: "supplies", PARTNERS_WITH: "partners" },
      questions: [
        "Who is the CEO of Company A?",
        "Who founded Company A?",
        "Where does Company C operate?",
        "Which company did Company A acquire?",
        "Which investor backed Company C?",
        "Where does Company A's competitor operate?",
        "Which investor backed the company Company A acquired?",
        "Where does Company C's partner operate?",
        "Where does the partner of Company A's competitor operate?",
        "How many companies did Investor A invest in?",
        "How many companies operate in Mexico?",
        "What is the GDP of Brazil?",
        "Who is the CFO of Company A?",
      ],
      questionOf: (n) => `Question ${n} of 13`,
      links: (used, cap) => `Links followed: ${used} of ${cap}`,
      answer: "Answer:",
      counted: (n) => `Answer: ${n}, counting its contacts.`,
      noData: "The documents don't say, and it answers exactly that.",
      outOfReach: (need, cap) => `Out of reach: it needs ${need} links and may follow ${cap}.`,
      wrong: "Wrong answer.",
      missing: "missing link",
      summary: (n, cap) => n === 0 ? `Every question reached its answer within ${cap} ${cap === 1 ? "link" : "links"}.` : `${n} ${n === 1 ? "question needed" : "questions needed"} more than ${cap} ${cap === 1 ? "link" : "links"} and stayed out of reach, with no made-up answer.`,
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
      caption: "Cada pregunta sale de quien la menciona y viaja de contacto en contacto. Verde llegó a la respuesta, azul se quedó sin eslabones.",
      tapeLabel: "Trece preguntas, en orden",
      tape: { served: "respondida bien", rerouted: "fuera de alcance", lost: "respuesta equivocada" },
      rightOf: (n) => `Respondidas bien: ${n} de 13`,
      mapLabel: "Mapa de empresas, personas y países unidos por datos de los documentos",
      idle: "Aquí cada pregunta sigue sus eslabones.",
      entities: { acme: "Empresa A", beta: "Empresa B", gamma: "Empresa C", epsilon: "Empresa D", zeta: "Empresa E", delta: "Inversionista A", alice: "Fundadora", bob: "Director", mexico: "México", brazil: "Brasil" },
      relations: { ACQUIRED: "compró", FOUNDED_BY: "la fundó", CEO_OF: "la dirige", INVESTED_IN: "invirtió", COMPETES_WITH: "compite", OPERATES_IN: "opera en", SUPPLIES_TO: "le vende", PARTNERS_WITH: "socia" },
      questions: [
        "¿Quién dirige la Empresa A?",
        "¿Quién fundó la Empresa A?",
        "¿Dónde opera la Empresa C?",
        "¿Qué empresa compró la Empresa A?",
        "¿Qué inversionista respaldó a la Empresa C?",
        "¿Dónde opera la competidora de la Empresa A?",
        "¿Qué inversionista respaldó a la empresa que compró la Empresa A?",
        "¿Dónde opera la socia de la Empresa C?",
        "¿Dónde opera la socia de la competidora de la Empresa A?",
        "¿En cuántas empresas invirtió el Inversionista A?",
        "¿Cuántas empresas operan en México?",
        "¿Cuál es el PIB de Brasil?",
        "¿Quién es el director financiero de la Empresa A?",
      ],
      questionOf: (n) => `Pregunta ${n} de 13`,
      links: (used, cap) => `Eslabones seguidos: ${used} de ${cap}`,
      answer: "Respuesta:",
      counted: (n) => `Respuesta: ${n}, contando sus contactos.`,
      noData: "Los documentos no lo dicen, y eso es lo que responde.",
      outOfReach: (need, cap) => `Fuera de alcance: necesita ${need} eslabones y puede seguir ${cap}.`,
      wrong: "Respuesta equivocada.",
      missing: "falta este eslabón",
      summary: (n, cap) => n === 0 ? `Todas las preguntas llegaron a su respuesta con ${cap} ${cap === 1 ? "eslabón" : "eslabones"} o menos.` : `${n} ${n === 1 ? "pregunta necesitaba" : "preguntas necesitaban"} más de ${cap} ${cap === 1 ? "eslabón" : "eslabones"} y ${n === 1 ? "quedó" : "quedaron"} fuera de alcance, sin inventar respuesta.`,
    },
  },
};
