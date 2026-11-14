export const STOPWORDS = new Set(
  `a an the and or but if then than that this these those of in on at to for from by with about into over after before
   is are was were be been being am do does did doing have has had having can could should would will shall may might must
   i you he she it we they me him her us them my your his its our their what which who whom whose when where why how
   tell show give find explain please thanks thank hey hi hello there here s t re ve ll don not no yes ok okay`
    .split(/\s+/)
    .filter(Boolean)
);

export function tokenize(text = '') {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) || []).filter(
    (w) => w.length > 1 && !STOPWORDS.has(w)
  );
}

export function splitSentences(text = '') {
  return text
    .split(/(?<=[.!?])\s+(?=["'(]?[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);
}

export function buildIdfTable(terms, documents) {
  const table = new Map();
  const N = Math.max(documents.length, 1);
  for (const term of terms) {
    const hits = documents.filter((doc) => doc.includes(term)).length;
    const idf = Math.log((N - hits + 0.5) / (hits + 0.5) + 1);
    table.set(term, Math.max(idf, 0.2));
  }
  return table;
}

export function tokenOverlap(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let shared = 0;
  for (const item of setA) {
    if (setB.has(item)) shared++;
  }
  return shared / Math.min(setA.size, setB.size);
}
